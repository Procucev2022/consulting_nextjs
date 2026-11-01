import {
  EXECUTIVE_BRIEF_STORAGE_PREFIX,
  FILENAME_EDGE_UNDERSCORES,
  FILENAME_FALLBACK_PART,
  FILENAME_SEPARATOR,
  STORAGE_UNSAFE_CHARACTERS
} from '../constants/executiveBriefExportConstants';

export const buildExecutiveBriefStorageKey = (tenantName: string, filename: string): string => {
  const tenantSegment = tenantName
    .replace(STORAGE_UNSAFE_CHARACTERS, FILENAME_SEPARATOR)
    .replace(FILENAME_EDGE_UNDERSCORES, '');
  const safeSegment = tenantSegment || FILENAME_FALLBACK_PART;
  return `${EXECUTIVE_BRIEF_STORAGE_PREFIX}/${safeSegment}/${filename}`;
};
