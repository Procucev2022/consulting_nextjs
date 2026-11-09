/**
 * Frontend PCBI Commodity Data Lab — Constants
 */

import type { CommodityWorkspaceTabKey } from '../types/pcbiCommodityDataLab';

export const DATA_LAB_SUPPORTED_FORMATS = ['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT'] as const;

export const COMMODITY_WORKSPACE_TABS: CommodityWorkspaceTabKey[] = [
  'OVERVIEW',
  'RESEARCH_QUEUE',
  'UPLOAD_DATA',
  'SOURCE_REGISTER',
  'EXTRACTED_OBSERVATIONS',
  'STANDARDIZATION_PREVIEW',
  'SOURCE_COMPARISON',
  'METHODOLOGY',
  'VALIDATION',
  'APPROVAL',
  'VERSION_HISTORY',
  'PCBI_HISTORY'
];

export const DOMAIN_DETECTION_SIGNATURES = {
  CUSTOMER_PURCHASE_HISTORY: [
    'po number',
    'purchase order',
    'line item',
    'vendor name',
    'buyer id',
    'actual price',
    'invoice',
    'po date',
    'delivery date'
  ],
  PCBI_MASTER_SYSTEM_DATA: [
    'master_catalog',
    'pcbi_master_version',
    'constituent_weights',
    'unspsc_map',
    'benchmark_count',
    'master_authority',
    'commodity_master_definitions',
    'published_pcbi_master'
  ],
  COMMODITY_RESEARCH_EVIDENCE: [
    'raw_observations',
    'source_register',
    'reference_trend',
    'methodology_register',
    'open_gaps',
    'source_candidate',
    'evidence_object',
    'commodity_research'
  ]
} as const;

export const DOMAIN_ERROR_MESSAGES = {
  CUSTOMER_DATA_IN_DATA_LAB: {
    title: 'CUSTOMER DATA DETECTED',
    message: 'Customer purchase history must be uploaded through Module 1.',
    remediation: 'Please navigate to Module 1 (Data Ingestion) to ingest customer transaction records.'
  },
  COMMODITY_RESEARCH_IN_MASTER: {
    title: 'COMMODITY RESEARCH DATA DETECTED',
    message: 'This file belongs in PCBI Commodity Data Lab.',
    remediation: 'Please switch to ADMIN → PCBI COMMODITY DATA LAB to stage and review commodity research evidence.'
  },
  MASTER_DATA_IN_DATA_LAB: {
    title: 'PCBI MASTER DATA DETECTED',
    message: 'System-level PCBI Master files must be managed in ADMIN → PCBI MASTER.',
    remediation: 'Please switch to ADMIN → PCBI MASTER to upload or publish system-level master version catalogs.'
  }
} as const;
