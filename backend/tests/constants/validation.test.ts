import { describe, it, expect } from 'vitest';
import {
  requestHeadersSchema,
  tenantUpdateSchema,
  addIngestionFileSchema,
  updateValidationRecordSchema,
  mergeVendorSchema,
  deployOpportunitySchema,
  calculateConversionMetricsSchema,
  categoryQuerySchema,
  currencyQuerySchema,
  taxonomyQuerySchema,
  logsSearchQuerySchema,
  logsPurgeSchema,
  graphQLRequestSchema,
  encryptRequestSchema,
  decryptRequestSchema,
  registerUserSchema,
  loginUserSchema,
  adminUserQuerySchema,
  adminUpdateUserTierSchema
} from '../../src/constants/validation';

describe('Backend Validation Schemas (constants/validation.ts)', () => {
  describe('requestHeadersSchema', () => {
    it('should validate valid request headers', () => {
      const valid = {
        'x-request-id': 'req-12345',
        'content-type': 'application/json',
        authorization: 'Bearer token123',
        'custom-header': 'passed'
      };
      const result = requestHeadersSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should pass with empty headers', () => {
      const result = requestHeadersSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('tenantUpdateSchema', () => {
    it('should validate valid tenant update payload', () => {
      const valid = {
        enterprise_name: 'Test Corp',
        region: 'APAC',
        base_currency: 'INR',
        financial_year: 'FY25-26',
        total_spend_evaluated_inr: 500,
        target_savings_rate_pct: 10.5
      };
      const result = tenantUpdateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty update object', () => {
      const result = tenantUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid types', () => {
      const result = tenantUpdateSchema.safeParse({ total_spend_evaluated_inr: -10 });
      expect(result.success).toBe(false);
    });
  });

  describe('addIngestionFileSchema', () => {
    it('should validate valid ingestion file', () => {
      const valid = {
        file_name: 'test_spend.xlsx',
        file_type: 'Excel Spreadsheet',
        file_size_mb: 4.5,
        records_count: 1000
      };
      const result = addIngestionFileSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate valid ingestion file with optional extended fields', () => {
      const valid = {
        doc_id: 'DOC-1234',
        tenant_id: 'TNT-001',
        file_name: 'test_spend.xlsx',
        file_type: 'XLSX',
        file_size_mb: 4.5,
        ocr_status: 'Completed',
        progress: 100,
        uploaded_at: '2026-09-09 12:00:00',
        records_count: 1000,
        detected_currencies: ['INR', 'USD'],
        converted_inr_crores: 120.5,
        unique_items_count: 150,
        unique_vendors_count: 40,
        material_groups_count: 12,
        plants_count: 4
      };
      const result = addIngestionFileSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing or invalid fields', () => {
      expect(addIngestionFileSchema.safeParse({}).success).toBe(false);
      expect(addIngestionFileSchema.safeParse({ file_name: '', file_type: 'CSV', file_size_mb: 2, records_count: 10 }).success).toBe(false);
      expect(addIngestionFileSchema.safeParse({ file_name: 'test.csv', file_type: 'CSV', file_size_mb: -1, records_count: 10 }).success).toBe(false);
      expect(addIngestionFileSchema.safeParse({ file_name: 'test.csv', file_type: 'CSV', file_size_mb: 1, records_count: -5 }).success).toBe(false);
    });
  });

  describe('updateValidationRecordSchema', () => {
    it('should validate valid record update', () => {
      const valid = {
        record_id: 'REC-001',
        resolved: true,
        notes: 'Verified supplier details'
      };
      const result = updateValidationRecordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing record_id', () => {
      const result = updateValidationRecordSchema.safeParse({ resolved: true });
      expect(result.success).toBe(false);
    });
  });

  describe('mergeVendorSchema', () => {
    it('should validate valid vendor merge input', () => {
      const valid = {
        targetName: 'Acme Corp Ltd',
        masterId: 'VEND-ACME',
        canonicalName: 'Acme Global Inc'
      };
      const result = mergeVendorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty or missing fields', () => {
      expect(mergeVendorSchema.safeParse({}).success).toBe(false);
      expect(mergeVendorSchema.safeParse({ targetName: '', masterId: '1', canonicalName: '1' }).success).toBe(false);
    });
  });

  describe('deployOpportunitySchema', () => {
    it('should validate valid deployment targets', () => {
      expect(deployOpportunitySchema.safeParse({ opp_id: 'OPP-1', targetModule: 'proCPX' }).success).toBe(true);
      expect(deployOpportunitySchema.safeParse({ opp_id: 'OPP-2', targetModule: 'DPS NXT' }).success).toBe(true);
    });

    it('should reject invalid deployment targets or missing opp_id', () => {
      expect(deployOpportunitySchema.safeParse({ opp_id: '', targetModule: 'proCPX' }).success).toBe(false);
      expect(deployOpportunitySchema.safeParse({ opp_id: 'OPP-1', targetModule: 'OtherModule' }).success).toBe(false);
    });
  });

  describe('calculateConversionMetricsSchema', () => {
    it('should validate with defaults and custom numbers', () => {
      const defaultResult = calculateConversionMetricsSchema.safeParse({});
      expect(defaultResult.success).toBe(true);
      if (defaultResult.success) {
        expect(defaultResult.data.annualSpendCr).toBe(428.5);
        expect(defaultResult.data.savingsRate).toBe(9.4);
      }

      const custom = {
        annualSpendCr: 500,
        savingsRate: 12.0,
        saasFeeRate: 1.0
      };
      expect(calculateConversionMetricsSchema.safeParse(custom).success).toBe(true);
    });

    it('should reject non-positive annual spend or negative rates', () => {
      expect(calculateConversionMetricsSchema.safeParse({ annualSpendCr: -10 }).success).toBe(false);
      expect(calculateConversionMetricsSchema.safeParse({ savingsRate: -1 }).success).toBe(false);
    });
  });

  describe('categoryQuerySchema', () => {
    it('should validate category query', () => {
      expect(categoryQuerySchema.safeParse({}).success).toBe(true);
      expect(categoryQuerySchema.safeParse({ id: 'CAT-1' }).success).toBe(true);
    });
  });

  describe('currencyQuerySchema', () => {
    it('should validate currency query', () => {
      expect(currencyQuerySchema.safeParse({}).success).toBe(true);
      expect(currencyQuerySchema.safeParse({ from: 'USD', amount: '100', year: '2024' }).success).toBe(true);
      expect(currencyQuerySchema.safeParse({ from: 'EUR', amount: 50, year: 2025 }).success).toBe(true);
    });
  });

  describe('taxonomyQuerySchema', () => {
    it('should validate taxonomy query', () => {
      expect(taxonomyQuerySchema.safeParse({}).success).toBe(true);
      expect(taxonomyQuerySchema.safeParse({ q: 'bearing', category: 'Direct', lookup: '41112400' }).success).toBe(true);
    });
  });

  describe('logsSearchQuerySchema', () => {
    it('should validate log search query', () => {
      expect(logsSearchQuerySchema.safeParse({}).success).toBe(true);
      expect(logsSearchQuerySchema.safeParse({ level: 'info', keyword: 'tenant', limit: '50' }).success).toBe(true);
    });

    it('should reject invalid log level', () => {
      expect(logsSearchQuerySchema.safeParse({ level: 'critical' }).success).toBe(false);
    });
  });

  describe('logsPurgeSchema', () => {
    it('should validate log purge parameters', () => {
      expect(logsPurgeSchema.safeParse({}).success).toBe(true);
      expect(logsPurgeSchema.safeParse({ retentionDays: 30 }).success).toBe(true);
    });

    it('should reject negative or non-integer retention days', () => {
      expect(logsPurgeSchema.safeParse({ retentionDays: -5 }).success).toBe(false);
      expect(logsPurgeSchema.safeParse({ retentionDays: 2.5 }).success).toBe(false);
    });
  });

  describe('graphQLRequestSchema', () => {
    it('should validate valid GraphQL query requests', () => {
      const valid = {
        query: 'query { tenant { enterprise_name } }',
        variables: { id: '1' },
        operationName: 'GetTenant'
      };
      const result = graphQLRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate requests with null or undefined optional fields', () => {
      const valid = {
        query: 'query { tenant { enterprise_name } }',
        variables: null,
        operationName: null
      };
      const result = graphQLRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing or empty query strings', () => {
      expect(graphQLRequestSchema.safeParse({}).success).toBe(false);
      expect(graphQLRequestSchema.safeParse({ query: '' }).success).toBe(false);
    });
  });

  describe('encryptRequestSchema', () => {
    it('should validate valid encryption requests', () => {
      expect(encryptRequestSchema.safeParse({ data: 'Confidential' }).success).toBe(true);
      expect(encryptRequestSchema.safeParse({ data: 'Confidential', passphrase: 'pass', associatedData: 'aad' }).success).toBe(true);
    });

    it('should reject empty or missing data', () => {
      expect(encryptRequestSchema.safeParse({}).success).toBe(false);
      expect(encryptRequestSchema.safeParse({ data: '' }).success).toBe(false);
    });
  });

  describe('decryptRequestSchema', () => {
    it('should validate valid decryption requests with string payload', () => {
      expect(decryptRequestSchema.safeParse({ payload: 'aes256gcm:iv:tag:cipher' }).success).toBe(true);
      expect(decryptRequestSchema.safeParse({ payload: 'aes256gcm:iv:tag:cipher', passphrase: 'pass' }).success).toBe(true);
    });

    it('should validate valid decryption requests with object payload', () => {
      const objPayload = {
        algorithm: 'aes-256-gcm',
        iv: 'iv123',
        tag: 'tag123',
        ciphertext: 'cipher123'
      };
      expect(decryptRequestSchema.safeParse({ payload: objPayload }).success).toBe(true);
    });

    it('should reject empty or missing payload', () => {
      expect(decryptRequestSchema.safeParse({}).success).toBe(false);
      expect(decryptRequestSchema.safeParse({ payload: '' }).success).toBe(false);
    });
  });

  describe('Auth & Tier Schemas', () => {
    it('should validate registerUserSchema with and without tier', () => {
      const valid = {
        name: 'Jane Doe',
        mobile_number: '+91 99999 88888',
        email: 'jane@enterprise.com',
        company_name: 'Enterprise Inc',
        company_address: '123 Main St, Tech City',
        password: 'Password@123',
        subscription_tier: 'BRONZE'
      };
      expect(registerUserSchema.safeParse(valid).success).toBe(true);
      const withoutTier = { ...valid };
      delete (withoutTier as any).subscription_tier;
      expect(registerUserSchema.safeParse(withoutTier).success).toBe(true);
      expect(registerUserSchema.safeParse({ ...valid, subscription_tier: 'INVALID' }).success).toBe(false);
    });

    it('should validate loginUserSchema', () => {
      expect(loginUserSchema.safeParse({ email: 'valid@test.com', password: 'pass' }).success).toBe(true);
      expect(loginUserSchema.safeParse({ email: 'BUYER-101', password: 'pass' }).success).toBe(true);
      expect(loginUserSchema.safeParse({ email: '', password: 'pass' }).success).toBe(false);
      expect(loginUserSchema.safeParse({ email: 'valid@test.com', password: '' }).success).toBe(false);
    });

    it('should validate adminUserQuerySchema with and without tier filter', () => {
      expect(adminUserQuerySchema.safeParse({ tier: 'SILVER', role: 'USER', status: 'ACTIVE' }).success).toBe(true);
      expect(adminUserQuerySchema.safeParse({ tier: 'GOLD' }).success).toBe(true);
      expect(adminUserQuerySchema.safeParse({ tier: 'INVALID' }).success).toBe(false);
    });

    it('should validate adminUpdateUserTierSchema', () => {
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'BRONZE' }).success).toBe(true);
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'SILVER' }).success).toBe(true);
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'GOLD' }).success).toBe(true);
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'PLATINUM' }).success).toBe(false);
    });
  });
});
