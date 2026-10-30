/**
 * File naming for Executive Brief downloads and R2 storage. Download names follow the HEAD sanitizer. Storage keys
 * use a stricter alphabet so a client name cannot introduce path separators into the object key.
 */
import {
  EXECUTIVE_BRIEF_STORAGE_PREFIX,
  FILENAME_EDGE_UNDERSCORES,
  FILENAME_FALLBACK_PART,
  FILENAME_REPEATED_UNDERSCORES,
  FILENAME_SEPARATOR,
  FILENAME_UNSAFE_CHARACTERS,
  FILENAME_WHITESPACE_RUN,
  REPORT_FILENAME_PREFIX,
  STORAGE_UNSAFE_CHARACTERS
} from '../constants/executiveBriefExportConstants';

const UNDERSCORE = FILENAME_SEPARATOR;

export const sanitizeFilenamePart = (input: string): string => {
  const cleaned = input
    .replace(FILENAME_UNSAFE_CHARACTERS, UNDERSCORE)
    .replace(FILENAME_WHITESPACE_RUN, UNDERSCORE)
    .replace(FILENAME_REPEATED_UNDERSCORES, UNDERSCORE)
    .replace(FILENAME_EDGE_UNDERSCORES, '');
  return cleaned.length > 0 ? cleaned : FILENAME_FALLBACK_PART;
};

export const buildOfficialExecutiveBriefFilename = (
  clientName: string,
  extension: 'pdf' | 'pptx',
  reportDate: string
): string => `${REPORT_FILENAME_PREFIX}${sanitizeFilenamePart(clientName)}_${reportDate}.${extension}`;

export const buildExecutiveBriefStorageKey = (clientName: string, filename: string): string => {
  const clientSegment = clientName
    .replace(STORAGE_UNSAFE_CHARACTERS, UNDERSCORE)
    .replace(FILENAME_EDGE_UNDERSCORES, '');
  const safeSegment = clientSegment.length > 0 ? clientSegment : FILENAME_FALLBACK_PART;
  return `${EXECUTIVE_BRIEF_STORAGE_PREFIX}/${safeSegment}/${filename}`;
};
