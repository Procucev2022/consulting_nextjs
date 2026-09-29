/**
 * Frontend PCBI Commodity Data Lab — Constants
 */

import type { CommodityWorkspaceTabKey } from '../types/pcbiCommodityDataLab';

export const COMMODITY_DATA_UPLOAD_BANNER = 'COMMODITY DATA UPLOAD — NOT PCBI MASTER';

export const DATA_LAB_SUPPORTED_FORMATS = ['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT'] as const;

export const COMMODITY_WORKSPACE_TABS: Array<{ key: CommodityWorkspaceTabKey; label: string; description: string }> = [
  { key: 'OVERVIEW', label: '1. Overview', description: 'Commodity specification, spend exposure, and PCBI metadata' },
  { key: 'RESEARCH_QUEUE', label: '2. Research Queue', description: 'Priority status, backlog positioning, and assignment' },
  { key: 'UPLOAD_DATA', label: '3. Upload Data', description: 'Stage new commodity research evidence files (XLSX, CSV, PDF, JSON, TXT)' },
  { key: 'SOURCE_REGISTER', label: '4. Source Register', description: 'Coexisting evidence objects, publishers, and publication metadata' },
  { key: 'EXTRACTED_OBSERVATIONS', label: '5. Extracted Observations', description: 'Granular extracted raw data points and normalization states' },
  { key: 'STANDARDIZATION_PREVIEW', label: '6. Standardization Preview', description: 'Unit conversion, currency alignment, and frequency harmonization' },
  { key: 'SOURCE_COMPARISON', label: '7. Source Comparison', description: 'Multi-source variance matrices and cross-publisher correlation' },
  { key: 'METHODOLOGY', label: '8. Methodology', description: 'Formal mathematical formulation and proxy transformation rules' },
  { key: 'VALIDATION', label: '9. Validation', description: 'Completeness checks, anomaly filters, and gap assessments' },
  { key: 'APPROVAL', label: '10. Approval', description: 'Admin governance sign-off and promotion gate to PCBI catalog' },
  { key: 'VERSION_HISTORY', label: '11. Version History', description: 'Audit log of staged research iterations and revisions' },
  { key: 'PCBI_HISTORY', label: '12. PCBI History', description: 'Historical index trajectory across official baseline releases' }
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
