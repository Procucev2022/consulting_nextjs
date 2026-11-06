import { D1_TABLES } from './d1';

export const PCBI_HISTORICAL_QUERY_DEFAULT_LIMIT = 100;
export const PCBI_HISTORICAL_QUERY_MAX_LIMIT = 500;
export const PCBI_HISTORICAL_FREQUENCY = 'MONTHLY';
export const PCBI_HISTORICAL_ARCHIVE_ONLY = true;
export const PCBI_PUBLISHED_PAYLOAD_QUERY =
  `SELECT version, upload_id, payload_json FROM ${D1_TABLES.pcbiMasterVersions} WHERE status = 'PUBLISHED' ORDER BY published_at DESC LIMIT 1`;
export const PCBI_HISTORICAL_OBSERVATION_QUERY_FIELDS = [
  'pcbi_id', 'observation_date', 'value_inr', 'original_value', 'original_currency',
  'fx_rate', 'unit', 'source', 'status', 'observation_frequency'
] as const;
