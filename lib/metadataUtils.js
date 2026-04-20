/**
 * Obtiene el fondo (background) de un anime desde Fanart.tv con fallback a Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo o null.
 */
/**
 * Calcula la distancia de Levenshtein entre dos cadenas para medir su similitud.
 */
function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Obtiene el fondo (background) de un anime desde Fanart.tv con fallback a Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    const searchTitle = title.toLowerCase().trim();
    const cleanTitle = title.replace(/[^\w\s]/gi, '').toLowerCase().trim();
    
    async function searchInCinemeta(query, contentType) {
      const searchURL = `https://v3-cinemeta.strem.io/catalog/${contentType}/top/search=${encodeURIComponent(query)}.json`;
      const resp = await fetch(searchURL);
      if (!resp.ok) return [];
      const data = await resp.json();
      return data.metas || [];
    }

    // 1. Recopilar resultados de varias búsquedas para tener más opciones
    let allResults = [];
    const searchPromises = [
      searchInCinemeta(title + " Anime", type),
      searchInCinemeta(title, type),
      searchInCinemeta(title, type === "series" ? "movie" : "series")
    ];

    const resultsArray = await Promise.all(searchPromises);
    allResults = [].concat(...resultsArray);

    if (allResults.length === 0) return null;

    // Eliminar duplicados por ID
    const uniqueResults = Array.from(new Map(allResults.map(m => [m.id, m])).values());

    // 2. Sistema de puntuación para encontrar la mejor coincidencia
    const scoredResults = uniqueResults.map(m => {
      const metaName = (m.name || "").toLowerCase().trim();
      const genres = (m.genres || []).map(g => g.toLowerCase());
      let score = 0;

      // Distancia de Levenshtein (menor es mejor, así que restamos de un máximo)
      const dist = getLevenshteinDistance(searchTitle, metaName);
      score += Math.max(0, 20 - dist);

      // Bonus por etiquetas de animación (MUY IMPORTANTE)
      if (genres.some(g => g.includes("animation") || g.includes("animación") || g.includes("anime"))) {
        score += 50;
      }

      // Penalización por Live Action o Reality
      if (genres.some(g => g.includes("reality") || g.includes("talk-show")) || 
          metaName.includes("live action") || 
          metaName.includes("netflix")) {
        score -= 100;
      }

      // Bonus por coincidencia exacta
      if (metaName === searchTitle) score += 30;
      if (metaName.includes(searchTitle) || searchTitle.includes(metaName)) score += 10;

      return { meta: m, score };
    });

    // Ordenar por puntuación descendente
    scoredResults.sort((a, b) => b.score - a.score);
    const bestMatch = scoredResults[0];

    // Umbral mínimo de confianza
    if (!bestMatch || bestMatch.score < 40) {
      console.log(`Baja confianza para el anime: ${title} (Score: ${bestMatch?.score || 0})`);
      return null;
    }

    const imdb_id = bestMatch.meta.imdb_id || bestMatch.meta.id;
    if (!imdb_id) return null;

    return `https://live.metahub.space/background/medium/${imdb_id}/img`;
  } catch (error) {
    console.error(`Error generating Metahub background for ${title}:`, error);
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
