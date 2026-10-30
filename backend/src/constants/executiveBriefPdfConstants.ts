/**
 * Executive Brief PDF grid and typography. Coordinates are points on the 16:9 page defined by PDF_LAYOUT.
 * Text width is estimated as characters times font size times PDF_CHAR_WIDTH_RATIO, which is conservative for
 * Helvetica and keeps wrapped lines inside their columns.
 */
import { BRAND_COLORS } from './executiveBriefLayoutConstants';
import type { ExecutiveBriefPdfTextStyle } from '../types/executiveBriefPdf';

export const PDF_CHAR_WIDTH_RATIO = 0.52;
export const PDF_LINE_HEIGHT_RATIO = 1.35;
export const PDF_HEADER_BASELINE = 24;
export const PDF_HEADER_RULE_Y = 32;
export const PDF_CONTENT_TOP = 56;
export const PDF_CONTENT_BOTTOM = 484;
export const PDF_FOOTER_RULE_Y = 494;
export const PDF_FOOTER_BASELINE = 510;
export const PDF_HEADER_FONT_SIZE = 8;
export const PDF_FOOTER_FONT_SIZE = 7.5;
export const PDF_BODY_FONT_SIZE = 10;
export const PDF_LABEL_FONT_SIZE = 9;
export const PDF_LEAD_FONT_SIZE = 11;
export const PDF_SUBHEADING_FONT_SIZE = 12;
export const PDF_HEADING_FONT_SIZE = 20;
export const PDF_COVER_TITLE_FONT_SIZE = 28;
export const PDF_COVER_SUBTITLE_FONT_SIZE = 13;
export const PDF_COVER_CLIENT_FONT_SIZE = 18;
export const PDF_KPI_LABEL_FONT_SIZE = 8;
export const PDF_KPI_VALUE_FONT_SIZE = 18;
export const PDF_KPI_DETAIL_FONT_SIZE = 8;
export const PDF_LABEL_COLUMN_WIDTH = 170;
export const PDF_ROW_GAP = 5;
export const PDF_BLOCK_GAP = 12;
export const PDF_KPI_COLUMNS = 3;
export const PDF_KPI_GAP = 16;
export const PDF_KPI_HEIGHT = 104;
export const PDF_KPI_ROW_GAP = 12;
export const PDF_KPI_PADDING = 14;
export const PDF_KPI_DETAIL_LINE_LIMIT = 2;
export const PDF_FAIL_COLOR = '#B42318';
export const PDF_STATUS_COLORS = {
  pass: BRAND_COLORS.accentGreen,
  fail: PDF_FAIL_COLOR
} as const;

/**
 * PDF 1.4 object-writer constants. Object 1 is the catalog and object 2 is the page tree; page objects start at 3.
 */
export const PDF_HEADER_LINE = '%PDF-1.4\n';
export const PDF_BINARY_MARKER: readonly number[] = [0xe2, 0xe3, 0xcf, 0xd3];
export const PDF_FIRST_PAGE_OBJECT_ID = 3;
export const PDF_TRAILER_ROOT_REFERENCE = '1 0 R';
export const PDF_FONT_ENCODING = 'WinAnsiEncoding';
export const PDF_BASE_FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique'
} as const;
export const PDF_FONT_RESOURCE_TAGS = {
  regular: '/F1',
  bold: '/F2',
  italic: '/F3'
} as const;
export const PDF_COORDINATE_DECIMALS = 2;
export const PDF_COLOR_DECIMALS = 3;
export const PDF_COLOR_CHANNEL_MAX = 255;
export const PDF_HEX_RADIX = 16;
export const PDF_SHORT_HEX_LENGTH = 3;
export const PDF_RED_SHIFT = 16;
export const PDF_GREEN_SHIFT = 8;
export const PDF_DEFAULT_LINE_WIDTH = 1;

export const PDF_RULE_WIDTH = 0.75;
export const PDF_KPI_ACCENT_WIDTH = 4;
export const PDF_KPI_LABEL_BASELINE_OFFSET = 18;
export const PDF_KPI_VALUE_BASELINE_OFFSET = 50;
export const PDF_KPI_DETAIL_BASELINE_OFFSET = 72;
export const PDF_VALUE_COLUMN_WIDTH = 694;
export const PDF_STATUS_COLUMN_WIDTH = 120;
export const PDF_COVER_TOP_OFFSET = 24;
export const PDF_CONTENTS_COLUMNS = 2;

export const PDF_TEXT_STYLES: Readonly<Record<string, ExecutiveBriefPdfTextStyle>> = {
  coverTitle: { fontSize: PDF_COVER_TITLE_FONT_SIZE, font: 'bold', color: BRAND_COLORS.primaryText },
  coverSubtitle: { fontSize: PDF_COVER_SUBTITLE_FONT_SIZE, font: 'regular', color: BRAND_COLORS.secondaryText },
  coverClient: { fontSize: PDF_COVER_CLIENT_FONT_SIZE, font: 'bold', color: BRAND_COLORS.procucevBlue },
  heading: { fontSize: PDF_HEADING_FONT_SIZE, font: 'bold', color: BRAND_COLORS.primaryText },
  subheading: { fontSize: PDF_SUBHEADING_FONT_SIZE, font: 'bold', color: BRAND_COLORS.procucevBlue },
  lead: { fontSize: PDF_LEAD_FONT_SIZE, font: 'regular', color: BRAND_COLORS.primaryText },
  body: { fontSize: PDF_BODY_FONT_SIZE, font: 'regular', color: BRAND_COLORS.primaryText }
};
export const PDF_XREF_FREE_ENTRY = '0000000000 65535 f \n';
export const PDF_XREF_OFFSET_WIDTH = 10;
export const PDF_XREF_IN_USE_SUFFIX = ' 00000 n \n';
