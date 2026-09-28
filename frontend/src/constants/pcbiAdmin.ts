/**
 * PCBI Master Admin Constants & Field Mapping Schema
 */

import type { PCBIWorksheetType } from '../types/pcbiAdmin';

export const PCBI_SUPPORTED_FILE_EXTENSIONS = ['.xlsx', '.csv'];
export const PCBI_MAX_PREVIEW_RECORDS = 50;

export interface PCBITargetFieldDefinition {
  field: string;
  label: string;
  isRequired: boolean;
  aliases: string[];
}

export const PCBI_TARGET_FIELDS: Record<Exclude<PCBIWorksheetType, 'OTHER' | 'IGNORE'>, PCBITargetFieldDefinition[]> = {
  PCBI_MASTER: [
    {
      field: 'pcbi_id',
      label: 'PCBI ID',
      isRequired: true,
      aliases: ['pcbi id', 'pcbi_id', 'pcbiid', 'technical id', 'unique benchmark id', 'benchmark id', 'id']
    },
    {
      field: 'canonical_key',
      label: 'Canonical Benchmark Key',
      isRequired: false,
      aliases: ['canonical benchmark key', 'canonical key', 'commodity key', 'commodity code']
    },
    {
      field: 'category',
      label: 'Benchmark Category',
      isRequired: false,
      aliases: ['pcbi category', 'category', 'benchmark category', 'procurement category', 'commodity group']
    },
    {
      field: 'benchmark_name',
      label: 'Benchmark Name (PCBI Name)',
      isRequired: true,
      aliases: ['benchmark', 'benchmark name', 'benchmark_name', 'pcbi name', 'pcbi_name', 'name']
    },
    {
      field: 'sub_category',
      label: 'Sub Category',
      isRequired: false,
      aliases: ['sub category', 'sub_category', 'subcategory', 'item group']
    },
    {
      field: 'benchmark_type',
      label: 'Benchmark Type',
      isRequired: true,
      aliases: ['benchmark type', 'benchmark_type', 'type', 'single/composite']
    },
    {
      field: 'quality_rating',
      label: 'Quality Rating',
      isRequired: false,
      aliases: ['quality rating', 'quality_rating', 'quality', 'rating', 'grade']
    },
    {
      field: 'benchmarkability_percent',
      label: 'Benchmarkability %',
      isRequired: false,
      aliases: ['benchmarkability %', 'benchmarkability_percent', 'benchmarkability', 'benchmarkable %', 'bench %']
    },
    {
      field: 'residual_percent',
      label: 'Residual %',
      isRequired: false,
      aliases: ['residual %', 'residual_percent', 'residual', 'non-benchmarkable %']
    },
    {
      field: 'benchmark_source',
      label: 'Benchmark Source',
      isRequired: false,
      aliases: ['source', 'benchmark source', 'benchmark_source', 'publisher', 'index source']
    },
    {
      field: 'currency',
      label: 'Currency',
      isRequired: false,
      aliases: ['currency', 'curr', 'benchmark currency', 'iso currency']
    },
    {
      field: 'benchmark_unit',
      label: 'Unit of Measure',
      isRequired: false,
      aliases: ['unit', 'uom', 'benchmark_unit', 'unit of measure', 'geography unit']
    },
    {
      field: 'geography',
      label: 'Geography',
      isRequired: false,
      aliases: ['geography', 'region', 'country', 'market']
    },
    {
      field: 'sector',
      label: 'Sectors Covered',
      isRequired: false,
      aliases: ['sectors covered', 'sector', 'industry', 'applicable sectors']
    },
    {
      field: 'start_date',
      label: 'Start Date',
      isRequired: false,
      aliases: ['start date', 'start_date', 'historical start date', 'effective from']
    },
    {
      field: 'end_date',
      label: 'End Date',
      isRequired: false,
      aliases: ['end date', 'end_date', 'historical end date', 'effective to']
    }
  ],

  WEEKLY_INDEX: [
    {
      field: 'pcbi_id',
      label: 'PCBI ID',
      isRequired: true,
      aliases: ['pcbi id', 'pcbi_id', 'pcbiid', 'benchmark id', 'canonical benchmark key']
    },
    {
      field: 'week_start',
      label: 'Week Start Date',
      isRequired: true,
      aliases: ['week start', 'week_start', 'date', 'week start date', 'start date', 'period start']
    },
    {
      field: 'index_value',
      label: 'Index Value',
      isRequired: true,
      aliases: ['index value', 'index_value', 'index', 'value', 'price index', 'level']
    },
    {
      field: 'quality_rating',
      label: 'Quality Rating',
      isRequired: false,
      aliases: ['quality rating', 'quality_rating', 'quality']
    },
    {
      field: 'source',
      label: 'Index Source',
      isRequired: false,
      aliases: ['source', 'data status', 'series source']
    },
    {
      field: 'currency',
      label: 'Currency',
      isRequired: false,
      aliases: ['currency', 'curr']
    },
    {
      field: 'note',
      label: 'Notes / Data Status',
      isRequired: false,
      aliases: ['note', 'notes', 'data status', 'comment']
    }
  ],

  CONSTITUENTS: [
    {
      field: 'pcbi_id',
      label: 'PCBI ID',
      isRequired: true,
      aliases: ['pcbi id', 'pcbi_id', 'pcbiid', 'benchmark id']
    },
    {
      field: 'constituent_name',
      label: 'Constituent / Cost Driver',
      isRequired: true,
      aliases: ['constituent / cost driver', 'constituent', 'constituent_name', 'cost driver', 'component']
    },
    {
      field: 'weight_percent',
      label: 'Constituent Weight %',
      isRequired: false,
      aliases: ['weight %', 'weight_percent', 'constituent weight %', 'share %', 'weight']
    },
    {
      field: 'benchmarkability_percent',
      label: 'Benchmarkability %',
      isRequired: false,
      aliases: ['benchmarkability %', 'benchmarkability_percent', 'benchmarkability']
    },
    {
      field: 'residual_percent',
      label: 'Residual %',
      isRequired: false,
      aliases: ['residual %', 'residual_percent', 'residual']
    },
    {
      field: 'methodology',
      label: 'Methodology',
      isRequired: false,
      aliases: ['methodology', 'formula', 'calculation method']
    }
  ],

  SOURCES: [
    {
      field: 'source_name',
      label: 'Source Family / Name',
      isRequired: true,
      aliases: ['source family', 'source_name', 'source', 'publisher', 'provider']
    },
    {
      field: 'application',
      label: 'Application / Scope',
      isRequired: false,
      aliases: ['application', 'scope', 'pcbi use', 'use case']
    },
    {
      field: 'access',
      label: 'Access Level',
      isRequired: false,
      aliases: ['access', 'license', 'access level', 'tier']
    }
  ],

  UNSPSC_MAPPING: [
    {
      field: 'unspsc_code',
      label: 'UNSPSC Code / Key',
      isRequired: true,
      aliases: ['unspsc', 'unspsc code', 'unspsc_code', 'canonical benchmark key', 'commodity code']
    },
    {
      field: 'pcbi_id',
      label: 'PCBI ID',
      isRequired: true,
      aliases: ['pcbi id', 'pcbi_id', 'pcbiid', 'benchmark id']
    },
    {
      field: 'category',
      label: 'Category',
      isRequired: false,
      aliases: ['category', 'pcbi category', 'sector']
    },
    {
      field: 'quality_rating',
      label: 'Quality Rating',
      isRequired: false,
      aliases: ['quality rating', 'quality']
    }
  ]
};

export const PCBI_WORKSHEET_PURPOSE_LABELS: Record<PCBIWorksheetType, string> = {
  PCBI_MASTER: 'Benchmark Master',
  WEEKLY_INDEX: 'Weekly Index Series',
  CONSTITUENTS: 'Constituent Database',
  SOURCES: 'Benchmark Sources',
  UNSPSC_MAPPING: 'UNSPSC Mapping',
  OTHER: 'Informational / Other',
  IGNORE: 'Ignore Sheet'
};

// ==========================================
// PCBI V1.3.1 ARCHITECTURE QA CONSTANTS
// ==========================================

export const PCBI_DEFINITION_STATUSES = [
  'DEFINED',
  'MISSING',
  'UNDER_REVIEW',
  'NOT_BENCHMARKABLE'
] as const;

export const PCBI_DATA_STATUSES = [
  'COMPLETE',
  'PARTIAL_HISTORY',
  'NO_HISTORY',
  'FREQUENCY_MISMATCH',
  'SPECIFICATION_MISMATCH',
  'SOURCE_UNVERIFIED'
] as const;

export const PCBI_SOURCE_STATUSES = [
  'CANDIDATE',
  'UNDER_VALIDATION',
  'VALIDATED',
  'REJECTED'
] as const;

export const PCBI_METHODOLOGY_STATUSES = [
  'APPROVED',
  'METHODOLOGY_PENDING',
  'REJECTED',
  'NONE_REQUIRED'
] as const;

export const PCBI_READINESS_STATUSES = [
  'READY_FOR_VALIDATION',
  'SOURCE_REQUIRED',
  'HISTORY_REQUIRED',
  'METHODOLOGY_REQUIRED',
  'SPECIFICATION_REVIEW',
  'CLASSIFICATION_CONFLICT',
  'PCBI_MISSING',
  'NOT_BENCHMARKABLE'
] as const;

export const PCBI_PREVIEW_STATUS_BADGES = {
  SIMULATION_ONLY: 'SIMULATION_ONLY',
  NOT_PRODUCTION: 'NOT_PRODUCTION',
  NOT_APPROVED: 'NOT_APPROVED'
} as const;

export const PCBI_PROVENANCE_LINK_KEYS = [
  'observationId',
  'sourceId',
  'sourceDocument',
  'pageTableRow',
  'originalValue',
  'originalUnit',
  'originalFrequency',
  'transformationRuleId',
  'standardizedValue',
  'approvalRecordId'
] as const;

