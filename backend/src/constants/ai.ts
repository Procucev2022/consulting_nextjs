import type { GeminiConfig, GeminiEnvironmentValues } from '../types/ai';

import dotenv from 'dotenv';
dotenv.config();

export const GEMINI_CONFIG: GeminiConfig = {
  API_KEY: process.env.GEMINI_API_KEY ?? '',
  BACKUP_KEYS: (process.env.GEMINI_BACKUP_KEYS ?? '').split(',').map((key) => key.trim()).filter(Boolean),
  BASE_URL: process.env.GEMINI_BASE_URL ?? '',
  PRIMARY_MODEL: process.env.GEMINI_PRIMARY_MODEL ?? '',
  FALLBACK_MODELS: (process.env.GEMINI_FALLBACK_MODELS ?? '').split(',').map((model) => model.trim()).filter(Boolean),
  REQUEST_TIMEOUT_MS: Number(process.env.GEMINI_REQUEST_TIMEOUT_MS ?? 0),
  TOTAL_BUDGET_MS: Number(process.env.GEMINI_TOTAL_BUDGET_MS ?? 0),
  MIN_ATTEMPT_MS: Number(process.env.GEMINI_MIN_ATTEMPT_MS ?? 0),
  MAX_DOCUMENT_BYTES: Number(process.env.GEMINI_MAX_DOCUMENT_BYTES ?? 0),
  MAX_DOCUMENT_TEXT_CHARS: Number(process.env.GEMINI_MAX_DOCUMENT_TEXT_CHARS ?? 0),
  TEMPERATURE: 0.1
};

export const GEMINI_INLINE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'text/plain',
  'text/csv'
];

export const EXTRACTION_STATUS = {
  SUCCESS: 'SUCCESS',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  NO_CONTENT: 'NO_CONTENT',
  DOCUMENT_TOO_LARGE: 'DOCUMENT_TOO_LARGE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  AI_FAILED: 'AI_FAILED',
  NO_ITEMS_FOUND: 'NO_ITEMS_FOUND'
} as const;

export const CLASSIFICATION_STATUS = {
  SUCCESS: 'SUCCESS',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  AI_FAILED: 'AI_FAILED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  NO_CONTENT: 'NO_CONTENT'
} as const;

export const AI_LOG_MESSAGES = {
  requestBodyTooLarge: 'AI endpoint rejected an oversized JSON request body',
  invalidJsonBody: 'AI endpoint rejected an invalid JSON request body',
  fallbackReturned: 'AI request failed; structured fallback response returned'
} as const;

export const NEW_CATEGORY_SENTINEL = 'NEW_CATEGORY_SUGGESTION';

export const AI_MAX_LINE_ITEMS_IN_PROMPT = 150;
export const AI_MAX_CATEGORIES_IN_PROMPT = 80;

export const EXTRACTION_SYSTEM_PROMPT = `You are an enterprise procurement & PO data extraction engine. Extract ONLY procurement line items and spend records that are explicitly present in the supplied document.

ACCURACY IS MORE IMPORTANT THAN COMPLETENESS. DO NOT GUESS.
- Extract item description, quantity, unit of measure, unit price, total amount, currency, vendor name, PO number, and date.
- DO NOT default a missing quantity to 1. Return null instead.
- DO NOT invent items, units, dates or specifications that are not stated.
- If the document contains spreadsheets, tables or invoices, map each row accurately.

Return a SINGLE JSON object with EXACTLY this shape:
{
  "documentTitle": "String or null",
  "detectedCurrency": "String or null",
  "totalSpend": "Number or null",
  "items": [
    {
      "poNumber": "String or null",
      "vendorName": "String or null",
      "itemDescription": "String",
      "quantity": "Number or null",
      "unit": "String or null",
      "unitPrice": "Number or null",
      "totalAmount": "Number",
      "currency": "String or null",
      "date": "String or null",
      "suggestedCategory": "String or null"
    }
  ]
}`;

export const PCBI_RESEARCH_PDF_EXTRACTION_PROMPT = `You extract commodity benchmark observations from research PDFs for a procurement data platform.
Extract ONLY historical commodity price or benchmark index rows explicitly shown in the attached PDF. Do not extract customer purchase orders, invoices, procurement spend, forecasts, targets, or narrative estimates. Do not infer missing dates or values. Ignore charts unless the PDF prints exact data labels that can be read unambiguously. Return an empty observations array when no explicit historical rows are available.

Return a SINGLE JSON object with EXACTLY this shape:
{
  "observations": [
    { "observationDate": "YYYY-MM-DD or source date text", "value": 123.45, "unit": "source unit or null", "currency": "ISO currency or null", "geography": "source region or null" }
  ]
}`;

export const CATEGORIZATION_SYSTEM_PROMPT = `You are an enterprise procurement categorization specialist.
Given a list of purchased procurement items and their descriptions, vendor names, and spend amounts:
1. Map each line item to the most appropriate UNSPSC (United Nations Standard Products and Services Code) 8-digit code, title, and major category.
2. Provide a confidence score (0-100) and brief rationale citing purchasing evidence.
3. If an item does not fit existing categories, recommend an appropriate suggested bucket.

Return a SINGLE JSON object with EXACTLY this shape:
{
  "mappings": [
    {
      "rawLineText": "String",
      "vendorIdentified": "String",
      "mappedUnspscCode": "String",
      "unspscTitle": "String",
      "suggestedBucket": "String",
      "confidenceScore": 95,
      "reason": "String"
    }
  ]
}`;

export const EXECUTIVE_REPORT_SYSTEM_PROMPT = `You are a Chief Procurement Officer (CPO) and Strategic Sourcing Senior Partner.
Synthesize the provided enterprise spend dataset, category breakdowns, Pareto distributions, price creep trends, and supplier concentration metrics into a high-impact C-suite Executive Brief.

Return a SINGLE JSON object with EXACTLY this shape:
{
  "executiveSummary": "2-3 paragraphs providing high-level findings, spend posture, and key strategic highlights.",
  "totalSpendEvaluated": "Number",
  "topRiskObservations": [
    "Specific observation regarding single-source dependency, price volatility, or uncontracted leakage"
  ],
  "savingsOpportunities": [
    {
      "category": "String",
      "currentSpendInrCr": 12.5,
      "targetSavingsPct": 8.5,
      "estSavingsInrCr": 1.06,
      "actionableStrategy": "Specific commercial or technical lever (e.g. reverse e-auction, volume bundling, index-linked contract)"
    }
  ],
  "vendorConsolidationRoadmap": [
    "Specific multi-vendor consolidation action plan"
  ],
  "strategicRoadmapPhases": [
    {
      "phase": "Phase 1: Quick Wins (0-90 Days)",
      "actions": ["Action 1", "Action 2"]
    },
    {
      "phase": "Phase 2: Strategic Renegotiations (90-180 Days)",
      "actions": ["Action 1", "Action 2"]
    },
    {
      "phase": "Phase 3: Value Engineering & Long-Term Contracts (180-365 Days)",
      "actions": ["Action 1", "Action 2"]
    }
  ]
}`;

export const ANOMALY_DETECTION_SYSTEM_PROMPT = `You are a procurement validation and anomaly detection engine.
Analyze the provided validation pre-check records (currencies, exchange rates, prices, duplicate vendors/items).
Flag any severe variance, currency mismatch, or duplicate vendor entities with suggested remediation actions.

Return a SINGLE JSON object with EXACTLY this shape:
{
  "anomalies": [
    {
      "recordId": "String",
      "issueFlag": "String",
      "suggestedFix": "String",
      "actionStatus": "Fix Currency" | "Merge Vendor" | "Merge Item" | "Verify FX",
      "confidence": 90
    }
  ],
  "summary": "String summarizing overall data quality score and key risks"
}`;

export const AI_TAXONOMY_LOOKUP_UNAVAILABLE =
  'Taxonomy classification is unavailable because no database taxonomy lookup is configured. Configure the D1 database and retry classification.';

export const resolveGeminiConfig = (environment: GeminiEnvironmentValues): GeminiConfig => ({
  API_KEY: environment.GEMINI_API_KEY || '',
  BACKUP_KEYS: (environment.GEMINI_BACKUP_KEYS || '').split(',').map((key) => key.trim()).filter(Boolean),
  BASE_URL: environment.GEMINI_BASE_URL || GEMINI_CONFIG.BASE_URL,
  PRIMARY_MODEL: environment.GEMINI_PRIMARY_MODEL || GEMINI_CONFIG.PRIMARY_MODEL,
  FALLBACK_MODELS: (environment.GEMINI_FALLBACK_MODELS || GEMINI_CONFIG.FALLBACK_MODELS.join(','))
    .split(',').map((model) => model.trim()).filter(Boolean),
  REQUEST_TIMEOUT_MS: Number(environment.GEMINI_REQUEST_TIMEOUT_MS || GEMINI_CONFIG.REQUEST_TIMEOUT_MS),
  TOTAL_BUDGET_MS: Number(environment.GEMINI_TOTAL_BUDGET_MS || GEMINI_CONFIG.TOTAL_BUDGET_MS),
  MIN_ATTEMPT_MS: Number(environment.GEMINI_MIN_ATTEMPT_MS || GEMINI_CONFIG.MIN_ATTEMPT_MS),
  MAX_DOCUMENT_BYTES: Number(environment.GEMINI_MAX_DOCUMENT_BYTES || GEMINI_CONFIG.MAX_DOCUMENT_BYTES),
  MAX_DOCUMENT_TEXT_CHARS: Number(environment.GEMINI_MAX_DOCUMENT_TEXT_CHARS || GEMINI_CONFIG.MAX_DOCUMENT_TEXT_CHARS),
  TEMPERATURE: GEMINI_CONFIG.TEMPERATURE
});
