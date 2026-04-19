/**
 * Obtiene el fondo (background) de un anime desde Fanart.tv con fallback a Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    // 1. Buscar en Cinemeta para obtener el ID de IMDb y TVDB
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

    // 2. Filtrar para encontrar la versión animada (Animation)
    const animeMeta = searchData.metas.find(m => 
      m.genres && (m.genres.includes("Animation") || m.genres.includes("Animación"))
    );
    
    const targetMeta = animeMeta || searchData.metas[0];
    const imdb_id = targetMeta.imdb_id || targetMeta.id;
    
    // 3. Obtener metadatos completos para tener el tvdb_id
    const metaURL = `https://v3-cinemeta.strem.io/meta/${type}/${imdb_id}.json`;
    const metaResp = await fetch(metaURL);
    if (!metaResp.ok) return null;
    const metaData = await metaResp.json();
    
    const tvdb_id = metaData.meta.tvdb_id;
    
    // 4. Intentar Fanart.tv si hay TVDB ID
    if (tvdb_id) {
      try {
        const fanartAPIKey = "70f90761e053a47321e9095655a9f5d1";
        const fanartURL = `https://webservice.fanart.tv/v3/${type === "movie" ? "movies" : "tv"}/${tvdb_id}?api_key=${fanartAPIKey}`;
        const fanartResp = await fetch(fanartURL);
        if (fanartResp.ok) {
          const fanartData = await fanartResp.json();
          const backgrounds = fanartData.tvbackground || fanartData.showbackground || fanartData.moviebackground;
          if (backgrounds && backgrounds.length > 0) {
            return backgrounds[0].url;
          }
        }
      } catch (fanartError) {
        console.error("Error fetching from Fanart.tv:", fanartError);
      }
    }

    // 5. Fallback a Cinemeta
    return metaData.meta.background || null;
  } catch (error) {
    console.error(`Error fetching background for ${title}:`, error);
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
