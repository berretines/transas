/**
 * assets.js — Carga de imágenes
 */
window.TRANSAS_Assets = (() => {
  const images = {};

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar: ' + src));
      img.src = src;
    });
  }

  async function loadAll(assetMap, onProgress) {
    const entries = Object.entries(assetMap);
    let done = 0;
    for (const [key, src] of entries) {
      images[key] = await loadImage(src);
      done += 1;
      if (onProgress) onProgress(done, entries.length, key);
    }
    return images;
  }

  function get(key) {
    return images[key] || null;
  }

  return { loadAll, get, images };
})();
