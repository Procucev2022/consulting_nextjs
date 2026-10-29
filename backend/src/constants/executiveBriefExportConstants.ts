/**
 * Executive Brief export naming, content types, and R2 storage layout.
 * Official download names carry the report date. Published R2 artifacts keep stable names so each regenerate
 * overwrites the previous publication instead of accumulating dated copies.
 */
import type { ExecutiveBriefFormat } from '../types/executiveBriefServices';

export const REPORT_FILENAME_PREFIX = 'Procucev_Procurement_Value_Savings_Diagnostic_';
export const EXECUTIVE_BRIEF_STORAGE_PREFIX = 'executive-brief';

export const EXECUTIVE_BRIEF_CONTENT_TYPES = {
  PDF: 'application/pdf',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  JSON: 'application/json; charset=utf-8',
  MARKDOWN: 'text/markdown; charset=utf-8'
} as const;

export const EXECUTIVE_BRIEF_ARTIFACT_FILENAMES = {
  PDF: 'EXECUTIVE_BRIEF.pdf',
  PPTX: 'EXECUTIVE_BRIEF.pptx',
  JSON: 'EXECUTIVE_BRIEF_REPORT.json',
  AUDIT: 'EXECUTIVE_BRIEF_AUDIT.md'
} as const;

export const FILENAME_FALLBACK_PART = 'Client';
export const FILENAME_UNSAFE_CHARACTERS = /[/\\:*?"<>|]/gu;
export const FILENAME_WHITESPACE_RUN = /\s+/gu;
export const FILENAME_REPEATED_UNDERSCORES = /_+/gu;
export const FILENAME_EDGE_UNDERSCORES = /^_|_$/gu;
export const STORAGE_UNSAFE_CHARACTERS = /[^A-Za-z0-9_-]+/gu;

export const EXECUTIVE_BRIEF_PUBLISHED_FORMATS: readonly ExecutiveBriefFormat[] = ['pdf', 'pptx', 'json', 'markdown'];
export const JSON_INDENT_SPACES = 2;
export const FILENAME_SEPARATOR = '_';
export const REPORT_DATE_SEPARATOR = 'T';
