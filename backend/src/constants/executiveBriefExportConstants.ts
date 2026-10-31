import type { ExecutiveBriefFormat } from '../types/executiveBriefServices';

export const EXECUTIVE_BRIEF_STORAGE_PREFIX = 'executive-brief';

export const EXECUTIVE_BRIEF_CONTENT_TYPES = {
  PDF: 'application/pdf',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  JSON: 'application/json; charset=utf-8',
  MARKDOWN: 'text/markdown; charset=utf-8'
} as const;

export const EXECUTIVE_BRIEF_ARTIFACT_FILENAMES = {
  AUDIT: 'EXECUTIVE_BRIEF_AUDIT.md'
} as const;

export const EXECUTIVE_BRIEF_PUBLISHED_FORMATS: readonly ExecutiveBriefFormat[] = ['pdf', 'pptx', 'json', 'markdown'];
export const JSON_INDENT_SPACES = 2;
export const FILENAME_SEPARATOR = '_';
export const STORAGE_UNSAFE_CHARACTERS = /[^A-Za-z0-9_-]+/gu;
export const FILENAME_EDGE_UNDERSCORES = /^_|_$/gu;
export const FILENAME_FALLBACK_PART = 'Tenant';
