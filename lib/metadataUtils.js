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

    // 2. Función interna para filtrar por etiqueta de Anime
    const findAnimeInMetas = (metas) => {
      return (metas || []).find(m => 
        m.genres && (
          m.genres.includes("Animation") || 
          m.genres.includes("Animación") || 
          m.genres.includes("Anime")
        )
      );
    };

    let targetMeta = findAnimeInMetas(searchData.metas);

    // 3. Si no hay resultados o no es anime, intentar en el otro catálogo (movie <-> series)
    if (!targetMeta) {
      const alternativeType = type === "series" ? "movie" : "series";
      const altSearchURL = `https://v3-cinemeta.strem.io/catalog/${alternativeType}/top/search=${encodeURIComponent(title)}.json`;
      const altSearchResp = await fetch(altSearchURL);
      if (altSearchResp.ok) {
        const altSearchData = await altSearchResp.json();
        targetMeta = findAnimeInMetas(altSearchData.metas);
      }
    }

    // 4. Si después de todo no hay un anime confirmado, no devolver fondo (para evitar live action)
    if (!targetMeta) {
      console.log(`No se encontró una versión de Anime con etiqueta para: ${title}`);
      return null;
    }

    const imdb_id = targetMeta.imdb_id || targetMeta.id;
    if (!imdb_id) return null;

    // 5. Construir URL directa de Metahub (usando el subdominio live)
    return `https://live.metahub.space/background/medium/${imdb_id}/img`;
  } catch (error) {
    console.error(`Error generating Metahub background for ${title}:`, error);
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
