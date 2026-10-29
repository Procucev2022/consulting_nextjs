export const MODULE2_D1_AUDIT_DOSSIER = {
  schemaVersion: '1.0',
  sourceSystem: 'Cloudflare D1',
  sourceTable: 'ProcurementTransaction',
  includedRecordsDisclosure: 'Includes only valid transaction rows stored for the selected assessment.',
  excludedRecordsDisclosure: 'Excluded or rejected rows are not included in this dossier.',
  savingsDisclosure: 'Savings are analytical estimates and are not verified or realised commercial savings.'
} as const;
