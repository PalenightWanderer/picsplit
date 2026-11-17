// Best-effort detection of fonts installed on the user's system, for
// browsers that don't implement the Local Font Access API (`window.
// queryLocalFonts`, Chromium-only). Works by comparing the rendered width of
// a test string in a candidate font vs. generic fallback fonts: if the
// widths differ, the candidate font must be installed (otherwise the
// browser would have silently fallen back and widths would match).
// This can't enumerate every installed font like the real API can, but it
// lets Firefox/Safari users still pick from a curated list of common
// system fonts across Windows, macOS, and Linux.

const TEST_STRING = 'mmmmmmmmmmlli';
const TEST_SIZE = 72;
const BASE_FONTS = ['monospace', 'sans-serif', 'serif'];

// A curated list of font family names commonly preinstalled on Windows,
// macOS, and common Linux desktop distros.
const CANDIDATE_FONTS = [
  // Windows
  'Arial', 'Arial Black', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara',
  'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New',
  'Ebrima', 'Franklin Gothic Medium', 'Gabriola', 'Gadugi', 'Georgia',
  'Impact', 'Ink Free', 'Leelawadee UI', 'Lucida Console',
  'Lucida Sans Unicode', 'Malgun Gothic', 'Microsoft Sans Serif',
  'Microsoft YaHei', 'MS Gothic', 'MV Boli', 'Myanmar Text', 'Nirmala UI',
  'Palatino Linotype', 'Segoe Print', 'Segoe Script', 'Segoe UI',
  'Segoe UI Black', 'Segoe UI Semibold', 'SimSun', 'Sitka', 'Sylfaen',
  'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Yu Gothic',
  // macOS
  'American Typewriter', 'Andale Mono', 'Arial Narrow',
  'Arial Rounded MT Bold', 'Avenir', 'Avenir Next', 'Baskerville',
  'Big Caslon', 'Bradley Hand', 'Brush Script MT', 'Chalkboard SE',
  'Chalkduster', 'Charter', 'Cochin', 'Copperplate', 'Didot',
  'DIN Alternate', 'DIN Condensed', 'Futura', 'Geneva', 'Gill Sans',
  'Helvetica', 'Helvetica Neue', 'Herculanum', 'Hoefler Text', 'Luminari',
  'Marker Felt', 'Menlo', 'Monaco', 'Noteworthy', 'Optima', 'Papyrus',
  'Phosphate', 'Rockwell', 'SignPainter', 'Skia', 'Snell Roundhand',
  'Superclarendon', 'Trattatello', 'Zapfino',
  // Common on Linux desktops
  'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono', 'Liberation Sans',
  'Liberation Serif', 'Liberation Mono', 'Noto Sans', 'Noto Serif',
  'Ubuntu', 'Cantarell', 'Droid Sans', 'FreeSans',
];

/**
 * Returns true if the Chromium-only Local Font Access API is available.
 */
export function hasLocalFontAccess() {
  return typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function';
}

/**
 * Uses the real Local Font Access API to enumerate every font installed on
 * the system (prompts the user for permission the first time). Returns a
 * sorted, de-duplicated array of family names.
 */
export async function queryLocalFontFamilies() {
  const fonts = await window.queryLocalFonts();
  const families = [...new Set(fonts.map((f) => f.family))];
  families.sort((a, b) => a.localeCompare(b));
  return families;
}

/**
 * Synchronous fallback for browsers without Local Font Access (Firefox,
 * Safari, etc.): measures `CANDIDATE_FONTS` against generic fallbacks and
 * returns whichever ones appear to actually be installed.
 */
export function detectAvailableFonts() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const baseWidths = {};
  for (const base of BASE_FONTS) {
    ctx.font = `${TEST_SIZE}px ${base}`;
    baseWidths[base] = ctx.measureText(TEST_STRING).width;
  }

  const detected = [];
  for (const candidate of CANDIDATE_FONTS) {
    const quoted = /\s/.test(candidate) ? `'${candidate}'` : candidate;
    const isInstalled = BASE_FONTS.some((base) => {
      ctx.font = `${TEST_SIZE}px ${quoted}, ${base}`;
      return ctx.measureText(TEST_STRING).width !== baseWidths[base];
    });
    if (isInstalled) detected.push(candidate);
  }

  detected.sort((a, b) => a.localeCompare(b));
  return detected;
}
