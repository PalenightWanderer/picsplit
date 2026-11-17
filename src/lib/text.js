// Shared text-overlay rendering so the live preview and the final exported
// tiles draw text identically (same font metrics, wrapping, and shadow).

/**
 * Wraps the font family in a string if needed
 */
function quoteFamilyIfNeeded(family) {
  const trimmed = String(family || '').trim();
  if (!trimmed) return 'sans-serif';
  if (trimmed.includes(',') || /^['"]/.test(trimmed)) return trimmed;
  return /\s/.test(trimmed) ? `'${trimmed.replace(/'/g, "\\'")}'` : trimmed;
}

export function buildFontString(fontSize, fontFamily, fontWeight = 400) {
  return `${fontWeight} ${fontSize}px ${quoteFamilyIfNeeded(fontFamily)}`;
}

/**
 * Word-wraps `text` (which may already contain explicit newlines) to fit within `maxWidth` px, using `ctx` for measurement.
 */
export function wrapText(ctx, text, maxWidth) {
  const paragraphs = String(text).split('\n');
  const lines = [];

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }
    const words = paragraph.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }

  return lines;
}

/**
 * Computes the layout (wrapped lines, line height, and bounding box) for a
 * text block centered at (xFrac, yFrac) of a `width`x`height` canvas, without
 * drawing anything. Used both to draw and to figure out which x-ranges a
 * "fit slices to text" pass should avoid cutting through.
 */
export function layoutText(ctx, { text, fontSize, fontFamily, fontWeight, align, xFrac, yFrac }, width, height) {
  if (!text || !text.trim()) return null;

  ctx.font = buildFontString(fontSize, fontFamily, fontWeight);
  const maxWidth = Math.max(10, width * 0.92);
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.25;
  const blockHeight = lineHeight * lines.length;
  const blockWidth = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);

  const cx = width * xFrac;
  const cy = height * yFrac;
  const top = cy - blockHeight / 2;
  const left = cx - blockWidth / 2;

  return {
    lines,
    lineHeight,
    fontSize,
    align: align || 'center',
    cx,
    cy,
    top,
    bottom: top + blockHeight,
    left,
    right: left + blockWidth,
    blockWidth,
    blockHeight,
  };
}

/**
 * Draws `text` onto `ctx` (a canvas already sized to `width`x`height`) using
 * the given style/shadow options. No-ops when text is blank.
 */
export function drawText(ctx, options, width, height) {
  const layout = layoutText(ctx, options, width, height);
  if (!layout) return null;

  const { color, shadow } = options;
  ctx.save();
  ctx.font = buildFontString(options.fontSize, options.fontFamily, options.fontWeight);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color || '#ffffff';

  if (shadow?.enabled) {
    ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = shadow.blur ?? 4;
    ctx.shadowOffsetX = shadow.offsetX ?? 2;
    ctx.shadowOffsetY = shadow.offsetY ?? 2;
  }

  const align = layout.align;
  layout.lines.forEach((line, i) => {
    const lineWidth = ctx.measureText(line).width;
    let x = layout.left;
    if (align === 'center') x = layout.cx - lineWidth / 2;
    else if (align === 'right') x = layout.right - lineWidth;
    const y = layout.top + layout.lineHeight * (i + 1) - layout.lineHeight * 0.2;
    ctx.fillText(line, x, y);
  });

  ctx.restore();
  return layout;
}
