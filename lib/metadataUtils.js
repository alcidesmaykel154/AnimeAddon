/**
 * Obtiene el ID de IMDb usando la API de sugerencias de IMDb.
 * Inspirado en la lógica de server.js
 */
async function imdbFind(title) {
  try {
    const searchTerm = title.toLowerCase().trim();
    const firstChar = searchTerm.charAt(0);
    const url = `https://sg.media-imdb.com/suggests/${firstChar}/${encodeURIComponent(searchTerm)}.json`;
    
    const resp = await fetch(url);
    if (!resp.ok) return null;
    
    const text = await resp.text();
    // La respuesta es JSONP: imdb$title({"d": [...]})
    const jsonMatch = text.match(/\{.*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    if (!data.d || data.d.length === 0) return null;

    // Filtrar resultados para encontrar el anime más probable
    // Priorizamos resultados que no sean live action si es posible
    const results = data.d.filter(item => item.id && item.id.startsWith('tt'));
    
    // 1. Intentar encontrar uno que sea explícitamente animación o serie de TV animada
    // En la API de IMDb, 'q' suele ser el tipo: 'feature', 'tvSeries', 'tvMiniSeries', etc.
    // 's' suele contener el reparto o descripción corta.
    const animeMatch = results.find(item => {
      const label = (item.l || "").toLowerCase();
      const stars = (item.s || "").toLowerCase();
      const type = (item.q || "").toLowerCase();
      
      const isAnimeName = label.includes(searchTerm);
      const seemsAnime = stars.includes("animation") || stars.includes("voice") || type === "tvseries" || type === "feature";
      
      // Evitar live actions conocidos (Netflix suele aparecer en 's')
      const isLiveAction = stars.includes("live action") || stars.includes("netflix");
      
      return isAnimeName && seemsAnime && !isLiveAction;
    });

    return animeMatch || results[0];
  } catch (error) {
    console.error("Error in imdbFind:", error);
    return null;
  }
}

/**
 * Obtiene el fondo (background) de un anime desde Metahub usando el ID de IMDb de Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo de Metahub o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    // Intentar encontrar el ID de IMDb directamente usando la técnica de server.js
    const imdbResult = await imdbFind(title);
    
    if (imdbResult && imdbResult.id) {
      return `https://live.metahub.space/background/medium/${imdbResult.id}/img`;
    }

    // Fallback a la búsqueda de Cinemeta si IMDb falla
    const searchURL = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(title)}.json`;
    const searchResp = await fetch(searchURL);
    if (!searchResp.ok) return null;
    const searchData = await searchResp.json();

    const target = (searchData.metas || []).find(m => {
      const genres = (m.genres || []).map(g => g.toLowerCase());
      return genres.includes("animation") || genres.includes("animación") || genres.includes("anime");
    }) || (searchData.metas && searchData.metas[0]);

    if (target) {
      const imdb_id = target.imdb_id || target.id;
      return `https://live.metahub.space/background/medium/${imdb_id}/img`;
    }

    return null;
  } catch (error) {
    console.error(`Error generating Metahub background for ${title}:`, error);
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
