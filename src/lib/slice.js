// Pure helpers for computing X/Twitter-style vertical tile splits.

/**
 * Returns the N+1 pixel boundaries (0..width) that divide `width` into
 * `count` equal-width vertical strips. Boundaries are rounded independently
 * so the strips always cover the full width with no gaps or overlaps.
 */
export function stripBounds(width, count) {
  const bounds = [0];
  for (let i = 1; i < count; i++) {
    bounds.push(Math.round((width * i) / count));
  }
  bounds.push(width);
  return bounds;
}

/** Returns just the interior cut x-positions (count - 1 of them), for preview overlays. */
export function cutPositions(width, count) {
  const bounds = stripBounds(width, count);
  return bounds.slice(1, -1);
}

/**
 * Splits `fileName` into its base (without extension) and extension, so tile
 * names can be built as `${base}-split${n}${ext}`. Falls back to sensible
 * defaults when `fileName` is empty or has no extension.
 */
export function splitFileName(fileName) {
  const name = fileName || 'image';
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { base: name, ext: '.png' };
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

/**
 * Slices `imgEl` into `count` equal-width vertical strips spanning the full
 * height, trimming `gutterTrim` px off every touching inner edge so the
 * seams line back up once X/Twitter renders its own grid gap.
 * Tile names keep the original file's name, appending `-split${n}` before
 * the extension (e.g. `photo.jpg` -> `photo-split1.png`).
 * Returns a Promise resolving to an array of { index, name, blob, url, width, height }.
 */
export async function sliceImage(imgEl, width, height, count, gutterTrim, fileName = '') {
  const bounds = stripBounds(width, count);
  const { base } = splitFileName(fileName);
  const tiles = [];

  for (let i = 0; i < count; i++) {
    const trimLeft = i > 0 ? gutterTrim : 0;
    const trimRight = i < count - 1 ? gutterTrim : 0;

    let x0 = bounds[i] + trimLeft;
    let x1 = bounds[i + 1] - trimRight;
    if (x1 <= x0) x1 = x0 + 1; // guard against extreme trim values collapsing a tile
    const w = x1 - x0;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, x0, 0, w, height, 0, 0, w, height);

    // eslint-disable-next-line no-await-in-loop
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    tiles.push({
      index: i,
      name: `${base}-split${i + 1}.png`,
      blob,
      url: URL.createObjectURL(blob),
      width: w,
      height,
    });
  }

  return tiles;
}
