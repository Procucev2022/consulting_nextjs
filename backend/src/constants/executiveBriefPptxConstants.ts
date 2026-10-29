/**
 * Executive Brief PPTX deck settings. The deck is a reduced 10-slide edition built from the certified report data:
 * cover, summary, seven section slides (01-07), and one evidence slide that carries section 08 and the checklist.
 */
export const PPTX_LAYOUT_NAME = 'LAYOUT_16x9';
export const PPTX_AUTHOR = 'Procucev Advisory Services';
export const PPTX_COMPANY = 'Procucev / aiCEV';
export const PPTX_TITLE_PREFIX = 'Procurement Value & Savings Diagnostic - ';
export const PPTX_FONT_FACE = 'Arial';
export const PPTX_EVIDENCE_GROUP_ID = '08';

export const PPTX_THEME = {
  background: 'F7F9FC',
  primaryText: '172033',
  secondaryText: '5B6472',
  accent: '1769E0',
  border: 'DCE3EC',
  headerFill: 'EFF6FF',
  white: 'FFFFFF',
  pass: '17A673',
  fail: 'B42318'
} as const;

export const PPTX_GEOMETRY = {
  SLIDE_WIDTH: 10,
  MARGIN_X: 0.5,
  CONTENT_WIDTH: 9,
  ACCENT_HEIGHT: 0.08,
  TITLE_Y: 0.3,
  TITLE_HEIGHT: 0.6,
  SUBTITLE_Y: 0.9,
  SUBTITLE_HEIGHT: 0.3,
  BODY_Y: 1.35,
  BODY_HEIGHT: 3.7,
  COVER_TITLE_Y: 1.2,
  COVER_TITLE_HEIGHT: 1.0,
  COVER_SUBTITLE_Y: 2.25,
  COVER_CLIENT_Y: 2.9,
  COVER_DETAIL_Y: 3.6,
  COVER_DETAIL_HEIGHT: 1.2,
  FOOTER_Y: 5.2,
  FOOTER_HEIGHT: 0.25,
  FOOTER_LEFT_WIDTH: 7.2,
  FOOTER_RIGHT_X: 7.7,
  FOOTER_RIGHT_WIDTH: 1.8
} as const;

export const PPTX_FONT_SIZES = {
  coverTitle: 30,
  coverSubtitle: 14,
  coverClient: 16,
  title: 24,
  subtitle: 11,
  body: 11,
  table: 10,
  checklistTable: 9,
  footer: 8
} as const;

export const PPTX_SUMMARY_TABLE_COLUMNS = [2.6, 2.0, 1.0, 3.4] as const;
export const PPTX_CHECKLIST_TABLE_COLUMNS = [3.4, 0.9] as const;
export const PPTX_EVIDENCE_LEFT_WIDTH = 4.4;
export const PPTX_EVIDENCE_RIGHT_X = 5.2;
export const PPTX_EVIDENCE_RIGHT_WIDTH = 4.3;
export const PPTX_OUTPUT_ERROR = 'PowerPoint generation did not return a byte array; the export was not written.';

export const PPTX_PARAGRAPH_SPACING = {
  text: 6,
  cover: 4
} as const;
export const PPTX_COVER_SLIDE_NUMBER = 1;
export const PPTX_SUMMARY_SLIDE_NUMBER = 2;
export const PPTX_FIRST_SECTION_SLIDE_NUMBER = 3;
export const PPTX_FRAMING_SLIDE_COUNT = 3;
