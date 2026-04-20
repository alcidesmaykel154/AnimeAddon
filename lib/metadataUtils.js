/**
 * Obtiene el ID de IMDb usando la API de sugerencias de IMDb.
 * Basado exactamente en la lógica de server.js de Stremio.
 */
async function imdbFind(title) {
  try {
    const searchTerm = title.toLowerCase().trim();
    const firstChar = searchTerm.charAt(0);
    const url = `https://sg.media-imdb.com/suggests/${firstChar}/${encodeURIComponent(searchTerm)}.json`;
    
    const resp = await fetch(url);
    if (!resp.ok) return null;
    
    const text = await resp.text();
    const jsonMatch = text.match(/\{.*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    if (!data.d || data.d.length === 0) return null;

    // Stremio simplemente toma el primer resultado que sea un ID de IMDb válido (tt...)
    const firstResult = data.d.find(item => item.id && item.id.startsWith('tt'));
    return firstResult || null;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene el fondo (background) de un anime usando la lógica de Stremio.
 * @param {string} title Título del anime.
 * @returns {Promise<string|null>} URL de la imagen de fondo de Metahub o null.
 */
async function getBackgroundFromCinemeta(title) {
  try {
    const imdbResult = await imdbFind(title);
    
    if (imdbResult && imdbResult.id) {
      // Stremio usa el dominio images.metahub.space
      return `https://images.metahub.space/background/medium/${imdbResult.id}/img`;
    }

    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  getBackgroundFromCinemeta
};
