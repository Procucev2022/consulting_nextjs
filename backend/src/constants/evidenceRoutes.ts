/**
 * Evidence API routing constants served by the Cloudflare Worker under /api/evidence.
 */

export const EVIDENCE_API_PREFIX = '/api/evidence';

export const EVIDENCE_JOB_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export const EVIDENCE_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export const EVIDENCE_BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

export const EVIDENCE_ROUTE_PATTERNS = {
  inventory: /^\/api\/evidence\/jobs\/([^/]+)\/inventory$/,
  parity: /^\/api\/evidence\/jobs\/([^/]+)\/parity$/,
  workbookDownload: /^\/api\/evidence\/jobs\/([^/]+)\/workbooks\/([^/]+)\/download$/,
  packageDownload: /^\/api\/evidence\/jobs\/([^/]+)\/package\/download$/,
  savingsInventory: /^\/api\/evidence\/jobs\/([^/]+)\/savings\/inventory$/,
  savingsTypeInventory: /^\/api\/evidence\/jobs\/([^/]+)\/savings\/([^/]+)\/inventory$/,
  savingsDownload: /^\/api\/evidence\/jobs\/([^/]+)\/savings\/([^/]+)\/download$/
} as const;

export const EVIDENCE_ACTIONS = {
  INVENTORY: 'INVENTORY',
  PARITY: 'PARITY',
  WORKBOOK_DOWNLOAD: 'WORKBOOK_DOWNLOAD',
  PACKAGE_DOWNLOAD: 'PACKAGE_DOWNLOAD',
  SAVINGS_INVENTORY: 'SAVINGS_INVENTORY',
  SAVINGS_DOWNLOAD: 'SAVINGS_DOWNLOAD'
} as const;

export const EVIDENCE_TRANSACTION_SHEET_ROW_LIMIT = 5000;

export const EVIDENCE_GROUP_ROW_LIMIT = 2000;
