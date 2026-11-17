// Pure helpers for computing X/Twitter-style vertical tile splits.

import { drawText } from './text.js';

/** Twitter/X carousel posts currently support up to 20 images. */
export const MAX_TILES = 20;

/** Maps an export format id to its canvas MIME type and file extension. */
export const FORMATS = {
  png: { mime: 'image/png', ext: '.png' },
  jpg: { mime: 'image/jpeg', ext: '.jpg' },
  webp: { mime: 'image/webp', ext: '.webp' },
};

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
 * Nudges any interior boundary that falls inside [start, end] (the text's
 * horizontal bounding box, typically padded a bit) out to whichever edge of
 * that range it's closer to, so no slice cuts through the text. Boundaries
 * are then re-clamped to stay monotonically increasing within [0, width].
 */
export function adjustBoundsForText(bounds, avoidRange, width) {
  if (!avoidRange) return bounds;
  const [start, end] = avoidRange;
  if (end <= start) return bounds;

  const result = [...bounds];
  for (let i = 1; i < result.length - 1; i++) {
    const b = result[i];
    if (b > start && b < end) {
      result[i] = b - start < end - b ? start : end;
    }
  }

  // Keep boundaries non-decreasing and within range.
  for (let i = 1; i < result.length; i++) {
    result[i] = Math.max(result[i], result[i - 1] + 1);
  }
  result[result.length - 1] = width;
  for (let i = result.length - 2; i >= 1; i--) {
    result[i] = Math.min(result[i], result[i + 1] - 1);
  }
  result[0] = 0;
  return result;
}

/**
 * Splits `fileName` into its base (without extension), so tile names can be
 * built as `${base}-split${n}${ext}`. Falls back to sensible defaults when
 * `fileName` is empty or has no extension.
 */
export function splitFileName(fileName) {
  const name = fileName || 'image';
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { base: name };
  return { base: name.slice(0, dot) };
}

/**
 * Draws the source image plus any text overlay onto a single full-resolution
 * canvas. This composite is what actually gets sliced, so text spans
 * correctly across tile boundaries exactly as previewed.
 */
export function renderComposite(imgEl, width, height, textOptions) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0, width, height);

  let textLayout = null;
  if (textOptions?.text?.trim()) {
    textLayout = drawText(ctx, textOptions, width, height);
  }

  return { canvas, textLayout };
}

/**
 * Slices `imgEl` into `count` equal-width vertical strips spanning the full
 * height, trimming `gutterTrim` px off every touching inner edge so the
 * seams line back up once X/Twitter renders its own grid gap. Optionally
 * burns in a text overlay and nudges slice boundaries to avoid cutting
 * through it.
 * Tile names keep the original file's name, appending `-split${n}` before
 * the extension (e.g. `photo.jpg` -> `photo-split1.png`).
 * Returns a Promise resolving to an array of { index, name, blob, url, width, height }.
 */
export async function sliceImage(
  imgEl,
  width,
  height,
  count,
  gutterTrim,
  fileName = '',
  options = {},
) {
  const { text: textOptions = null, fitSlicesToText = false, format = 'png', quality = 0.92 } = options;

  const { canvas: composite, textLayout } = renderComposite(imgEl, width, height, textOptions);

  let bounds = stripBounds(width, count);
  if (fitSlicesToText && textLayout) {
    const pad = Math.max(4, textLayout.fontSize * 0.15);
    bounds = adjustBoundsForText(bounds, [textLayout.left - pad, textLayout.right + pad], width);
  }

  const { base } = splitFileName(fileName);
  const { mime, ext } = FORMATS[format] || FORMATS.png;
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
    if (format !== 'png') {
      // JPEG/WEBP have no alpha channel by default; paint white behind the crop.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, height);
    }
    ctx.drawImage(composite, x0, 0, w, height, 0, 0, w, height);

    // eslint-disable-next-line no-await-in-loop
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
    tiles.push({
      index: i,
      name: `${base}-split${i + 1}${ext}`,
      blob,
      url: URL.createObjectURL(blob),
      width: w,
      height,
    });
  }

  return tiles;
}
