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

    const isAnimation = (m) => {
      const genres = m.genres || [];
      return genres.some(g =>
        ["animation", "animación", "anime"].includes(g.toLowerCase())
      );
    };

    const isLiveAction = (m) => {
      const genres = m.genres || [];
      const liveActionGenres = ["reality tv", "talk", "sport", "news", "game show"];
      return genres.some(g => liveActionGenres.includes(g.toLowerCase()));
    };

    const nameScore = (m, originalTitle) => {
      const normalizedOriginal = originalTitle.toLowerCase().trim();
      const name = (m.name || "").toLowerCase().trim();
      if (name === normalizedOriginal) return 3;
      if (name.includes(normalizedOriginal) || normalizedOriginal.includes(name)) return 2;
      const words = normalizedOriginal.split(" ").filter(w => w.length > 3);
      const hits = words.filter(w => name.includes(w)).length;
      return hits / Math.max(words.length, 1);
    };

    const filterBestAnime = (metas, originalTitle) => {
      if (!metas || metas.length === 0) return null;

      // Candidatos que tienen género animación y no son live-action
      const candidates = metas.filter(m => isAnimation(m) && !isLiveAction(m));

      if (candidates.length > 0) {
        return candidates.reduce((best, m) =>
          nameScore(m, originalTitle) > nameScore(best, originalTitle) ? m : best
        );
      }

      // Fallback: algunos animes no tienen el género Animation en Cinemeta,
      // aceptar cualquiera que no sea live-action obvio
      const fallback = metas.find(m => !isLiveAction(m));
      return fallback || null;
    };

    // Intento 1: tipo original
    let searchData = await searchInCinemeta(title, type);
    let target = filterBestAnime(searchData?.metas, title);

    // Fallback 1: tipo alternativo (movie <-> series)
    if (!target) {
      const altType = type === "series" ? "movie" : "series";
      searchData = await searchInCinemeta(title, altType);
      target = filterBestAnime(searchData?.metas, title);
    }

    // Fallback 2: añadir "anime" a la búsqueda
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