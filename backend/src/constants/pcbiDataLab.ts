export const PCBI_DATA_LAB_DOMAIN_SIGNATURES = {
  customerPurchase: [
    'purchase order', 'purchase history', 'customer data', 'customer po',
    'supplier', 'invoice', 'net price', 'order quantity'
  ],
  pcbiMaster: ['pcbi master', 'benchmark master', 'unspsc mapping', 'weekly index master'],
  commodityResearch: ['commodity', 'market price', 'benchmark index', 'historical price', 'price index']
} as const;

export const PCBI_DATA_LAB_CUSTOMER_FILE_NAME_PATTERN = /customer.*(?:po|purchase)|purchase history/i;
export const PCBI_DATA_LAB_TOKEN_NORMALIZATION_PATTERN = /[_-]+/gu;

export const PCBI_DATA_LAB_TARGET_NAMES = {
  MODULE_1_INGESTION: 'Module 1',
  PCBI_MASTER: 'PCBI Master',
  COMMODITY_DATA_LAB: 'Commodity Data Lab'
} as const;

export const PCBI_DATA_LAB_DOMAIN_GUIDANCE = {
  customerPurchase: 'Upload customer purchase history through Module 1 ingestion.',
  pcbiMaster: 'Upload PCBI master definitions through the PCBI Master tab.'
} as const;
