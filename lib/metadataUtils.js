/**
 * Obtiene el fondo (background) de un anime desde Metahub usando el ID de IMDb de Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo de Metahub o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    // 1. Buscar en Cinemeta para obtener el ID de IMDb
    const searchURL = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(title)}.json`;
    const searchResp = await fetch(searchURL);
    if (!searchResp.ok) return null;
    const searchData = await searchResp.json();

    if (!searchData.metas || searchData.metas.length === 0) {
      // Intento de fallback en el otro tipo (si era series buscar en movie y viceversa)
      const alternativeType = type === "series" ? "movie" : "series";
      const altSearchURL = `https://v3-cinemeta.strem.io/catalog/${alternativeType}/top/search=${encodeURIComponent(title)}.json`;
      const altSearchResp = await fetch(altSearchURL);
      if (!altSearchResp.ok) return null;
      const altSearchData = await altSearchResp.json();
      if (!altSearchData.metas || altSearchData.metas.length === 0) return null;
      
      const imdb_id = altSearchData.metas[0].imdb_id || altSearchData.metas[0].id;
      return `https://live.metahub.space/background/medium/${imdb_id}/img`;
    }

    const imdb_id = searchData.metas[0].imdb_id || searchData.metas[0].id;
    if (!imdb_id) return null;

    // 2. Construir URL directa de Metahub
    return `https://live.metahub.space/background/medium/${imdb_id}/img`;
  } catch (error) {
    console.error(`Error generating Metahub background for ${title}:`, error);
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
