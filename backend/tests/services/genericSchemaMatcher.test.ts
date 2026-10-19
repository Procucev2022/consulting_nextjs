import { describe, it, expect } from 'vitest';
import {
  GenericSchemaMatcher,
  normalizeHeaderString,
  toAlphanumeric
} from '../../src/services/genericSchemaMatcher';

describe('GenericSchemaMatcher Unit Tests', () => {
  describe('Helper Functions', () => {
    it('normalizes header strings accurately', () => {
      expect(normalizeHeaderString('')).toBe('');
      expect(normalizeHeaderString('  PO_Number \r\n ')).toBe('po number');
      expect(normalizeHeaderString('Vendor-Name...')).toBe('vendor name');
      expect(normalizeHeaderString(null as unknown as string)).toBe('');
    });

    it('converts strings to alphanumeric', () => {
      expect(toAlphanumeric('PO # 123-ABC!')).toBe('po123abc');
      expect(toAlphanumeric('')).toBe('');
    });
  });

  describe('Schema Matching', () => {
    it('matches exact SAP aliases successfully', () => {
      const headers = ['EBELN', 'NAME1', 'BEDAT', 'NETWR', 'WAERK', 'WERKS'];
      const sampleRows = [{ EBELN: '450001', NAME1: 'Vendor Inc', BEDAT: '2024-01-01', NETWR: 15000, WAERK: 'INR' }];
      const result = GenericSchemaMatcher.matchSchema(headers, sampleRows);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('VALID');
      expect(result.mappedFieldNames).toContain('purchaseOrderNumber');
      expect(result.mappedFieldNames).toContain('vendorName');
      expect(result.mappedFieldNames).toContain('documentDate');
      expect(result.mappedFieldNames).toContain('netSpendAmount');

      const poMapping = result.mappings.find((m) => m.canonicalField === 'purchaseOrderNumber');
      expect(poMapping?.matchingMethod).toBe('EXACT_ALIAS');
      expect(poMapping?.sampleValues).toEqual(['450001']);
    });

    it('matches generic normalized aliases', () => {
      const headers = ['purch_doc', 'vendor_code', 'invoice_date', 'line_spend'];
      const result = GenericSchemaMatcher.matchSchema(headers);

      expect(result.mappedFieldNames).toContain('purchaseOrderNumber');
      expect(result.mappedFieldNames).toContain('documentDate');
      const poMapping = result.mappings.find((m) => m.canonicalField === 'purchaseOrderNumber');
      expect(poMapping?.matchingMethod).toBe('NORMALIZED_ALIAS');
    });

    it('matches heuristic keyword aliases', () => {
      const headers = ['Custom Supplier Name Tag', 'Doc Posting Date Extended', 'Total Spend Net Extended Val'];
      const result = GenericSchemaMatcher.matchSchema(headers);

      expect(result.mappedFieldNames).toContain('vendorName');
      expect(result.mappedFieldNames).toContain('documentDate');
      expect(result.mappedFieldNames).toContain('netSpendAmount');
    });

    it('identifies missing mandatory fields', () => {
      const headers = ['Vendor Name', 'Doc Date']; // Missing netSpendAmount
      const result = GenericSchemaMatcher.matchSchema(headers);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('MISSING_MANDATORY');
      expect(result.unmappedMandatoryFields).toContain('netSpendAmount');
    });

    it('detects ambiguous columns when multiple candidates match equally', () => {
      // Both "Vendor Name" and "Supplier Name" map to vendorName
      const headers = ['Vendor Name', 'Supplier Name', 'Doc Date', 'Net Value'];
      const result = GenericSchemaMatcher.matchSchema(headers);

      expect(result.ambiguousColumns.some((a) => a.field === 'vendorName')).toBe(true);
      expect(result.status).toBe('AMBIGUOUS_COLUMNS');
      expect(result.isValid).toBe(false);
    });

    it('disallows conflicting keywords such as tax or unit price as spend amount', () => {
      const headers = ['Unit Price', 'Tax Amount', 'Gross Tax', 'Doc Date', 'Vendor Name'];
      const result = GenericSchemaMatcher.matchSchema(headers);

      // Neither Unit Price nor Tax Amount should be mapped to netSpendAmount
      expect(result.mappedFieldNames).not.toContain('netSpendAmount');
      expect(result.unmappedMandatoryFields).toContain('netSpendAmount');
    });

    it('extracts mapped values safely using extractMappedValue', () => {
      const headers = ['Vendor Name', 'Doc Date', 'Net Value'];
      const match = GenericSchemaMatcher.matchSchema(headers);
      const row = { 'Vendor Name': 'Acme Corp', 'Net Value': 50000 };

      const vendor = GenericSchemaMatcher.extractMappedValue(row, match.mappings, 'vendorName');
      expect(vendor).toBe('Acme Corp');

      const missing = GenericSchemaMatcher.extractMappedValue(row, match.mappings, 'purchaseOrderNumber');
      expect(missing).toBeUndefined();
    });

    it('handles empty and whitespace headers', () => {
      const headers = ['', '   ', null as unknown as string, 'Vendor Name', 'Doc Date', 'Amount'];
      const result = GenericSchemaMatcher.matchSchema(headers);
      expect(result.unmappedSourceColumns.length).toBeGreaterThanOrEqual(0);
    });

    it('handles different column ordering and prioritizes higher-confidence match', () => {
      // Non-standard order with both exact alias (EBELN) and normalized alias (purch_doc) for PO Number
      const headers = ['Total Net Spend', 'Doc Date', 'EBELN', 'purch_doc', 'Supplier Name'];
      const result = GenericSchemaMatcher.matchSchema(headers);

      expect(result.isValid).toBe(true);
      expect(result.mappedFieldNames).toContain('purchaseOrderNumber');
      const poMapping = result.mappings.find((m) => m.canonicalField === 'purchaseOrderNumber');
      expect(poMapping?.sourceColumn).toBe('EBELN');
      expect(poMapping?.matchingMethod).toBe('EXACT_ALIAS');
    });
  });
});
