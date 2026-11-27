// Font hosts for the GDI layer (engine/platform/win32_gdi.cpp). The game asked Windows for fonts by
// LOGFONT; here the browser's fonts stand in (font fidelity was waived). Glyphs are thresholded to 1 bit
// because GDI drew the game's text without antialiasing on 8-bit surfaces.

// Windows cell height (positive lfHeight) includes internal leading; character height (negative) does not.
const pixelSize = font => font.height < 0 ? -font.height : font.height ? Math.round(font.height * 0.82) : 13;
const cssFont = font => `${font.italic ? 'italic ' : ''}${font.weight >= 600 ? 'bold' : 'normal'} ${pixelSize(font)}px ${JSON.stringify(font.face || 'Arial')}, Arial, sans-serif`;

export function canvasFonts(makeCanvas = (w, h) => new OffscreenCanvas(w, h)) {
  const canvas = makeCanvas(256, 64);
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  const metrics = new Map(), rasters = new Map();
  const vertical = font => {
    const key = cssFont(font);
    if (!metrics.has(key)) {
      ctx.font = key;
      const m = ctx.measureText('Mg');
      const ascent = Math.ceil(m.fontBoundingBoxAscent ?? pixelSize(font) * 0.8);
      const descent = Math.ceil(m.fontBoundingBoxDescent ?? pixelSize(font) * 0.2);
      metrics.set(key, {ascent, height: ascent + descent});
    }
    return metrics.get(key);
  };
  const measure = (font, text) => {
    const v = vertical(font);
    ctx.font = cssFont(font);
    return {width: Math.ceil(ctx.measureText(text).width), height: v.height, ascent: v.ascent};
  };
  const raster = (font, text) => {
    const key = cssFont(font) + '\u0000' + (font.underline ? 'u' : '') + text;
    const cached = rasters.get(key);
    if (cached) return cached;
    const m = measure(font, text);
    const width = Math.max(1, m.width), height = Math.max(1, m.height);
    if (canvas.width < width || canvas.height < height) { canvas.width = Math.max(canvas.width, width); canvas.height = Math.max(canvas.height, height); }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = cssFont(font);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 0, m.ascent);
    if (font.underline) ctx.fillRect(0, m.ascent + 1, width, 1);
    const alpha = ctx.getImageData(0, 0, width, height).data;
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < mask.length; i++) mask[i] = alpha[i * 4 + 3] >= 128 ? 1 : 0;
    const result = {width, height, ascent: m.ascent, mask};
    if (rasters.size > 2000) rasters.clear();
    rasters.set(key, result);
    return result;
  };
  return {measure, raster};
}

// Deterministic metrics without glyphs, for headless tests (no canvas in Node).
export function metricFonts() {
  const measure = (font, text) => {
    const size = pixelSize(font), ascent = Math.round(size * 0.8);
    return {width: Math.round(text.length * size * 0.55), height: ascent + Math.round(size * 0.25), ascent};
  };
  return {measure, raster: (font, text) => { const m = measure(font, text); return {...m, mask: new Uint8Array(m.width * m.height)}; }};
}
