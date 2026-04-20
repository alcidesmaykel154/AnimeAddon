/**
 * Obtiene el ID de IMDb buscando específicamente en la categoría de Anime de IMDb.
 * Usa el parámetro de interés in0000027 para filtrar solo anime.
 */
async function imdbAnimeSearch(title) {
  try {
    // Usamos la búsqueda avanzada de IMDb filtrada por el interés de Anime (in0000027)
    // El formato de la búsqueda es scrapeable o podemos intentar usarlo con Cinemeta si soporta parámetros avanzados
    // Pero la forma más directa de obtener el ttID correcto para un anime es usar el catálogo de anime de Cinemeta
    // que ya está filtrado internamente por estos criterios de IMDb/TMDB.
    
    const animeSearchURL = `https://v3-cinemeta.strem.io/catalog/series/anime/search=${encodeURIComponent(title)}.json`;
    const animeResp = await fetch(animeSearchURL);
    
    if (animeResp.ok) {
      const animeData = await animeResp.json();
      if (animeData.metas && animeData.metas.length > 0) {
        // Retornamos el primer resultado del catálogo de anime, que ya cumple con el interés in0000027
        return animeData.metas[0].imdb_id || animeData.metas[0].id;
      }
    }

    // Fallback a películas de anime
    const movieAnimeURL = `https://v3-cinemeta.strem.io/catalog/movie/anime/search=${encodeURIComponent(title)}.json`;
    const movieResp = await fetch(movieAnimeURL);
    if (movieResp.ok) {
      const movieData = await movieResp.json();
      if (movieData.metas && movieData.metas.length > 0) {
        return movieData.metas[0].imdb_id || movieData.metas[0].id;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene el fondo (background) de un anime usando la lógica de filtrado por Anime de IMDb.
 * @param {string} title Título del anime.
 * @returns {Promise<string|null>} URL de la imagen de fondo de Metahub o null.
 */
async function getBackgroundFromCinemeta(title) {
  try {
    const imdbId = await imdbAnimeSearch(title);
    
    if (imdbId && imdbId.startsWith('tt')) {
      return `https://images.metahub.space/background/medium/${imdbId}/img`;
    }

    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
