/**
 * Constants & Column Aliases for Commodity PCBI Observation Workbook Parser & Quality Engine
 */

export const WORKBOOK_DATE_COLUMN_CANDIDATES = [
  'observation date',
  'observation_date',
  'obs_date',
  'date',
  'week start',
  'week_start',
  'period',
  'source date',
  'source_date',
  'date of observation'
] as const;

export const WORKBOOK_PRICE_COLUMN_CANDIDATES = [
  'index value',
  'index_value',
  'value',
  'price',
  'raw value',
  'raw_value',
  'index',
  'value (inr)',
  'normalized value',
  'unit price'
] as const;

export const WORKBOOK_INDEX_COLUMN_KEYWORDS = [
  'index value',
  'index_value',
  'index',
  'pts',
  'points',
  'index points'
] as const;

export const WORKBOOK_SERIES_ID_CANDIDATES = [
  'pcbi id',
  'pcbi_id',
  'series id',
  'series_id',
  'pcbi series id',
  'benchmark id'
] as const;

export const WORKBOOK_SOURCE_CANDIDATES = [
  'source',
  'source name',
  'source_name',
  'publisher',
  'url'
] as const;

export const WORKBOOK_METRIC_INDEX_POINTS = 'INDEX_POINTS';
export const WORKBOOK_UNDERLYING_PRICE_UNIT_DEFAULT = 'INR/MT';

export const WORKBOOK_PARSER_DEFAULTS = {
  defaultUnit: 'INR/MT',
  defaultIndexUnit: 'INDEX_POINTS',
  defaultCurrency: 'INR',
  maxPreviewCount: 10,
  minConfidence: 0.0,
  fullConfidence: 100.0
} as const;
