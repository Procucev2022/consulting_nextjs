/**
 * Executive Brief Presentation Layout, Brand & Typography Constants (Prompt 283)
 * Strict 10 x 5.625 inch 16:9 Presentation Grid with 0.50" / 0.35" Safe Margins.
 */

export const PPTX_LAYOUT = {
  PAGE_W: 10.0,
  PAGE_H: 5.625,
  SAFE_LEFT: 0.50,
  SAFE_RIGHT: 9.50,
  SAFE_TOP: 0.35,
  SAFE_BOTTOM: 5.275,
  CONTENT_LEFT: 0.50,
  CONTENT_RIGHT: 9.50,
  CONTENT_WIDTH: 9.00,
  HEADER_Y: 0.35,
  TITLE_Y: 0.65,
  CONTENT_Y: 1.15,
  FOOTER_Y: 5.28,
  LOGO_X: 8.50,
  LOGO_Y: 0.25,
  LOGO_W: 1.00,
  LOGO_H: 0.365
} as const;

export const PDF_LAYOUT = {
  PAGE_W: 960,
  PAGE_H: 540,
  SAFE_LEFT: 48,
  SAFE_RIGHT: 912,
  SAFE_TOP: 33.6,
  SAFE_BOTTOM: 506.4,
  CONTENT_LEFT: 48,
  CONTENT_RIGHT: 912,
  CONTENT_WIDTH: 864,
  HEADER_Y: 34,
  TITLE_Y: 62,
  CONTENT_Y: 108,
  FOOTER_Y: 512,
  LOGO_X: 816,
  LOGO_Y: 24,
  LOGO_W: 96,
  LOGO_H: 35
} as const;

export const MOJIBAKE_PATTERNS = ['â†', 'âˆ', 'â€“', 'â€”', 'â€¢', 'Â', 'Ã', 'ï¿½'] as const;

export function containsMojibake(str: string): boolean {
  return MOJIBAKE_PATTERNS.some((pat) => str.includes(pat));
}

export function toAsciiSafePresentationString(str: string): string {
  if (!str) {
    return '';
  }
  return str
    .replace(/₹/g, 'Rs. ')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↓/g, 'v')
    .replace(/↑/g, '^')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/•/g, '-')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[✓✔]/g, '[OK]')
    .replace(/[✕✗]/g, '[X]')
    .replace(/…/g, '...')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/â†’/g, '->')
    .replace(/â†/g, '->')
    .replace(/âˆ−/g, '-')
    .replace(/âˆ/g, '-')
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/â€¢/g, '-')
    .replace(/â‰¥/g, '>=')
    .replace(/â‰¤/g, '<=')
    .replace(/Â/g, '')
    .replace(/Ã/g, '')
    .replace(/ï¿½/g, '');
}

export const BRAND_COLORS = {
  canvas: '#F7F9FC',
  primaryText: '#172033',
  secondaryText: '#5B6472',
  procucevBlue: '#1769E0',
  aiCevBlue: '#2563EB',
  accentGreen: '#17A673',
  accentAmber: '#F2A900',
  lightCard: '#FFFFFF',
  border: '#DCE3EC'
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'Aptos',
  fallbackFont: 'Arial',
  coverTitleSize: 32,
  executiveTitleSize: 22,
  sectionLabelSize: 9.5,
  heroNumberSize: 32,
  keyNumberSize: 24,
  cardLabelSize: 9.5,
  bodySize: 11,
  tableSize: 9.5,
  footerSize: 7.5
} as const;
