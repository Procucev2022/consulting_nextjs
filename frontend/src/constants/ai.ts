export const AI_STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
} as const;

export const AI_ENDPOINTS = {
  CONFIG: '/api/ai/config',
  EXTRACT: '/api/ai/extract',
  CATEGORIZE: '/api/ai/categorize',
  EXECUTIVE_SUMMARY: '/api/ai/executive-summary',
  ANOMALIES: '/api/ai/analyze-anomalies'
} as const;
