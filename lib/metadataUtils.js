/**
 * Obtiene el ID de IMDb usando la API de sugerencias de IMDb.
 * Basado exactamente en la lógica de server.js de Stremio.
 */
async function imdbFind(title) {
  try {
    const searchTerm = title.toLowerCase().trim();
    const firstChar = searchTerm.charAt(0);
    const url = `https://sg.media-imdb.com/suggests/${firstChar}/${encodeURIComponent(searchTerm)}.json`;
    
    const resp = await fetch(url);
    if (!resp.ok) return null;
    
    const text = await resp.text();
    const jsonMatch = text.match(/\{.*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    if (!data.d || data.d.length === 0) return null;

    // Stremio simplemente toma el primer resultado que sea un ID de IMDb válido (tt...)
    const firstResult = data.d.find(item => item.id && item.id.startsWith('tt'));
    return firstResult || null;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene el fondo (background) de un anime usando la lógica de Stremio para animes.
 * @param {string} title Título del anime.
 * @returns {Promise<string|null>} URL de la imagen de fondo de Metahub o null.
 */
async function getBackgroundFromCinemeta(title) {
  try {
    // 1. Intentar buscar específicamente en los catálogos de ANIME de Cinemeta (series y películas)
    // Esto es lo que hace Stremio para asegurar que el resultado sea animación
    const catalogs = ['series/anime', 'movie/anime'];
    
    for (const cat of catalogs) {
      const animeSearchURL = `https://v3-cinemeta.strem.io/catalog/${cat}/search=${encodeURIComponent(title)}.json`;
      const animeResp = await fetch(animeSearchURL);
      
      if (animeResp.ok) {
        const animeData = await animeResp.json();
        if (animeData.metas && animeData.metas.length > 0) {
          const target = animeData.metas[0];
          const imdb_id = target.imdb_id || target.id;
          if (imdb_id) {
            return `https://images.metahub.space/background/medium/${imdb_id}/img`;
          }
        }
      }
    }

    // 2. Fallback a la búsqueda general si no se encontró en los catálogos de anime
    const imdbResult = await imdbFind(title);
    if (imdbResult && imdbResult.id) {
      return `https://images.metahub.space/background/medium/${imdbResult.id}/img`;
    }

    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
