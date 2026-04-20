/**
 * Obtiene el fondo (background) de un anime desde Metahub usando el ID de IMDb de Cinemeta.
 * @param {string} title Título del anime.
 * @param {string} type Tipo de contenido ("movie" o "series").
 * @returns {Promise<string|null>} URL de la imagen de fondo de Metahub o null.
 */
async function getBackgroundFromCinemeta(title, type) {
  try {
    // 1. Buscar directamente con el título + " anime" para que Cinemeta priorice la versión animada
    const searchURL = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(title + " anime")}.json`;
    const searchResp = await fetch(searchURL);
    if (!searchResp.ok) return null;
    const searchData = await searchResp.json();

    let target = searchData.metas && searchData.metas[0];

    // 2. Si no hay resultados, intentar solo con el título original
    if (!target) {
      const fallbackURL = `https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(title)}.json`;
      const fallbackResp = await fetch(fallbackURL);
      if (fallbackResp.ok) {
        const fallbackData = await fallbackResp.json();
        target = fallbackData.metas && fallbackData.metas[0];
      }
    }

    // 3. Si sigue sin haber nada, probar el otro catálogo (movie <-> series)
    if (!target) {
      const altType = type === "series" ? "movie" : "series";
      const altURL = `https://v3-cinemeta.strem.io/catalog/${altType}/top/search=${encodeURIComponent(title)}.json`;
      const altResp = await fetch(altURL);
      if (altResp.ok) {
        const altData = await altResp.json();
        target = altData.metas && altData.metas[0];
      }
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
