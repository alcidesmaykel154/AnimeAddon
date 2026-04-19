/**
 * Obtiene el fondo (background) de un anime desde Fanart.tv con fallback a Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    // 1. Buscar en Cinemeta para obtener el ID de IMDb
    const searchURL = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(title + " Anime")}.json`;
    const searchResp = await fetch(searchURL);
    if (!searchResp.ok) return null;
    let searchData = await searchResp.json();

    if (!searchData.metas || searchData.metas.length === 0) {
      const fallbackURL = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(title)}.json`;
      const fallbackResp = await fetch(fallbackURL);
      if (!fallbackResp.ok) return null;
      searchData = await fallbackResp.json();
    }

    if (!searchData.metas || searchData.metas.length === 0) return null;

    // 2. Filtrar para encontrar la versión animada (Animation) para evitar live actions
    const animeMeta = searchData.metas.find(m => 
      m.genres && (m.genres.includes("Animation") || m.genres.includes("Animación"))
    );
    
    const targetMeta = animeMeta || searchData.metas[0];
    const imdb_id = targetMeta.imdb_id || targetMeta.id;
    
    if (!imdb_id) return null;

    // 3. Construir URL directa de Metahub (usando el ID de IMDb)
    // Formato: https://images.metahub.space/background/medium/{imdb_id}/img
    return `https://images.metahub.space/background/medium/${imdb_id}/img`;
  } catch (error) {
    console.error(`Error generating Metahub background for ${title}:`, error);
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
