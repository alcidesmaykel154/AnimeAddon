/**
 * Obtiene el fondo (background) de un anime desde Fanart.tv con fallback a Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
    
    async function searchInCinemeta(query, contentType) {
      const searchURL = `https://v3-cinemeta.strem.io/catalog/${contentType}/top/search=${encodeURIComponent(query)}.json`;
      const resp = await fetch(searchURL);
      if (!resp.ok) return [];
      const data = await resp.json();
      return data.metas || [];
    }

    // 1. Intentar varias combinaciones de búsqueda
    let results = [];
    
    // Primero: Título original + " Anime" en el tipo sugerido
    results = await searchInCinemeta(title + " Anime", type);
    
    // Segundo: Título limpio + " Anime" si falló el anterior
    if (results.length === 0) {
      results = await searchInCinemeta(cleanTitle + " Anime", type);
    }
    
    // Tercero: Título original sin sufijo
    if (results.length === 0) {
      results = await searchInCinemeta(title, type);
    }

    // Cuarto: Buscar en el otro tipo (si era series buscar en movie y viceversa)
    if (results.length === 0) {
      const alternativeType = type === "series" ? "movie" : "series";
      results = await searchInCinemeta(title, alternativeType);
    }

    if (results.length === 0) return null;

    // 2. Filtrado inteligente
    const animeMeta = results.find(m => {
      const genres = (m.genres || []).map(g => g.toLowerCase());
      const name = (m.name || "").toLowerCase();
      const searchTitle = title.toLowerCase();

      // Prioridad 1: Tiene etiquetas explícitas de animación
      const isAnimated = genres.some(g => 
        g.includes("animation") || 
        g.includes("animación") || 
        g.includes("anime")
      );

      // Prioridad 2: El nombre coincide casi exacto y no parece live action
      const nameMatches = name === searchTitle || name.includes(searchTitle);
      const isLiveAction = genres.some(g => g.includes("reality") || g.includes("talk-show")) || 
                          name.includes("live action") || 
                          name.includes("netflix");

      return isAnimated && (nameMatches || !isLiveAction);
    });
    
    // Si el filtro estricto falla, intentamos ser un poco más flexibles con el primer resultado 
    // siempre que el nombre coincida bastante y no sea un live action obvio
    const targetMeta = animeMeta || results.find(m => {
      const name = (m.name || "").toLowerCase();
      const genres = (m.genres || []).map(g => g.toLowerCase());
      return (name.includes(title.toLowerCase()) || title.toLowerCase().includes(name)) && 
             !genres.includes("reality-tv") && 
             !name.includes("live action");
    });

    if (!targetMeta) {
      console.log(`No se pudo verificar una versión de Anime segura para: ${title}`);
      return null;
    }

    const imdb_id = targetMeta.imdb_id || targetMeta.id;
    if (!imdb_id) return null;

    return `https://images.metahub.space/background/medium/${imdb_id}/img`;
  } catch (error) {
    console.error(`Error generating Metahub background for ${title}:`, error);
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
