/**
 * Obtiene el fondo (background) de un anime desde Metahub usando el ID de IMDb de Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo de Metahub o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    const searchInCinemeta = async (query, contentType) => {
      const searchURL = `https://v3-cinemeta.strem.io/catalog/${contentType}/top/search=${encodeURIComponent(query)}.json`;
      const resp = await fetch(searchURL);
      if (!resp.ok) return null;
      return await resp.json();
    };

    const filterBestAnime = (metas, originalTitle) => {
      if (!metas || metas.length === 0) return null;
      
      const normalizedOriginal = originalTitle.toLowerCase().trim();
      
      return metas.find(m => {
        const genres = m.genres || [];
        const name = (m.name || "").toLowerCase().trim();
        
        // 1. Debe ser animación para evitar live-actions
        const isAnimation = genres.includes("Animation") || 
                           genres.includes("Animación") || 
                           genres.includes("Anime");
        
        // 2. El nombre debe coincidir razonablemente para evitar animes con nombres similares (como Kanojo mo Kanojo)
        // Verificamos si uno contiene al otro o si la coincidencia es muy alta
        const isNameMatch = name.includes(normalizedOriginal) || 
                           normalizedOriginal.includes(name) ||
                           name.split(" ").some(word => word.length > 3 && normalizedOriginal.includes(word));

        return isAnimation && isNameMatch;
      });
    };

    // Intentar búsqueda 1: Título original
    let searchData = await searchInCinemeta(title, type);
    let target = filterBestAnime(searchData?.metas, title);

    // Fallback 1: Buscar en el otro catálogo (movie <-> series)
    if (!target) {
      const altType = type === "series" ? "movie" : "series";
      searchData = await searchInCinemeta(title, altType);
      target = filterBestAnime(searchData?.metas, title);
    }

    // Fallback 2: Intentar añadiendo "anime" a la búsqueda para forzar resultados relevantes
    if (!target) {
      searchData = await searchInCinemeta(title + " anime", type);
      target = filterBestAnime(searchData?.metas, title);
    }

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
