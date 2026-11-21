import { describe, it, expect } from 'vitest';
import {
  D1_SCHEMA_VERSION,
  D1_DEMO_TENANT_ID,
  TENANT_DATA_CLASSIFICATION,
  PCBI_DATA_LAB_UPLOAD_MAX_BYTES,
  D1_TABLES,
  D1_TABLE_COUNT,
  D1_ROUTE_MESSAGES,
  D1_LOG_MESSAGES,
  D1_LOG_ACTIONS,
  D1_LOG_FALLBACKS,
  D1_LEVERS
} from '../../src/constants/d1';

describe('D1 Constants', () => {
  it('exports valid schema and upload limits', () => {
    expect(D1_SCHEMA_VERSION).toBe('2026-11-05-006');
    expect(D1_DEMO_TENANT_ID).toBe('TNT-GLOBAL-8902');
    expect(TENANT_DATA_CLASSIFICATION.customer).toBe('CUSTOMER_DATA');
    expect(PCBI_DATA_LAB_UPLOAD_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(D1_TABLE_COUNT).toBe(Object.keys(D1_TABLES).length);
    expect(D1_LEVERS.eauction.test('e-auction')).toBe(true);
    expect(D1_LOG_FALLBACKS.failClosed).toBe('fail-closed');
    expect(D1_LOG_ACTIONS.ingestionDelete).toBe('d1.ingestion.delete');
    expect(D1_LOG_MESSAGES.ingestionDeleteWithoutDocumentId).toBeDefined();
  });

  it('formats all parameterized route messages correctly', () => {
    expect(D1_ROUTE_MESSAGES.tenantUnavailable('TNT-99'))
      .toBe('Assigned tenant TNT-99 is unavailable. Ask an administrator to review the tenant assignment.');
    expect(D1_ROUTE_MESSAGES.requestBodyTooLarge(2048))
      .toBe('Request body exceeds the 2048-byte limit. Reduce the payload size and retry.');
    expect(D1_ROUTE_MESSAGES.supplierMasterNotFound('SUPP-101'))
      .toBe('Supplier master SUPP-101 was not found for this tenant. Refresh the supplier list and choose an existing supplier.');
    expect(D1_ROUTE_MESSAGES.ingestionDocumentNotFound('DOC-ING-001'))
      .toBe('Ingestion document DOC-ING-001 was not found.');
    expect(D1_ROUTE_MESSAGES.missingCanonical('ASS-2026'))
      .toBe('D1 has no canonical Module 1 dataset for assessment ASS-2026. Run Module 1 for this assessment and retry.');
    expect(D1_ROUTE_MESSAGES.pcbiDataLabDomainRejected('DIRECT'))
      .toBe('This file is not compatible with the DIRECT upload area.');
    expect(D1_ROUTE_MESSAGES.pcbiAdminMethod('GET'))
      .toBe('PCBI administration route does not support this request. Use the supported GET operation.');
    expect(D1_ROUTE_MESSAGES.currencyNotFound('XYZ'))
      .toBe('Currency XYZ is not present in D1 reference data.');
    expect(D1_ROUTE_MESSAGES.currencyRateUnavailable('EUR', '2026-03-01'))
      .toBe('No D1 exchange rate for EUR is available on or before 2026-03-01.');
    expect(D1_ROUTE_MESSAGES.ingestionDocumentUnauthorized)
      .toBe("You are not authorized to delete another user's dataset.");
  });
});
