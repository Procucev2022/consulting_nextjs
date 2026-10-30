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
  adminUpdateUserTierSchema,
  pcbiReferenceQuerySchema,
  d1DatasetScopeSchema,
  changePasswordSchema,
  aiExtractSchema,
  aiCategorizeSchema,
  aiExecutiveSummarySchema,
  aiAnalyzeAnomaliesSchema,
  adminUpdateUserStatusSchema,
  updateActionPlanSchema,
  updateOpportunityStatusSchema,
  detectUploadDomainSchema,
  uploadCommoditySourceSchema,
  approveCommodityDataSchema,
  vendorConsolidationQuerySchema,
  directPriceQuerySchema,
  alternateSourcingQuerySchema,
  specificationReviewSchema,
  procurementComplianceReviewSchema,
  eAuctionPlanningAssumptionSchema
} from '../../src/constants/validation';
import { D1_REPORTING, D1_TAXONOMY_DEFAULT_LIMIT, D1_TAXONOMY_MAX_LIMIT } from '../../src/constants/d1';
import { MODULE2_D1_VENDOR_CONSOLIDATION } from '../../src/constants/module2VendorConsolidationD1';

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
        raw_currency: 'USD',
        amount_inr: 125000
      };
      const result = updateValidationRecordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing record_id', () => {
      const result = updateValidationRecordSchema.safeParse({ resolved: true });
      expect(result.success).toBe(false);
    });

    it('rejects invalid currency, negative values and empty updates', () => {
      expect(updateValidationRecordSchema.safeParse({ record_id: 'REC-1', raw_currency: 'US' }).success).toBe(false);
      expect(updateValidationRecordSchema.safeParse({ record_id: 'REC-1', amount_inr: -1 }).success).toBe(false);
      expect(updateValidationRecordSchema.safeParse({ record_id: 'REC-1' }).success).toBe(false);
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
      expect(currencyQuerySchema.safeParse({ from: 'usd', amount: '100.25', date: '2024-05-10' }).success).toBe(true);
      expect(currencyQuerySchema.safeParse({ from: 'US', amount: '-1' }).success).toBe(false);
      expect(currencyQuerySchema.safeParse({ from: 'USD', date: 'not-a-date' }).success).toBe(false);
    });
  });

  describe('taxonomyQuerySchema', () => {
    it('should validate taxonomy query', () => {
      expect(taxonomyQuerySchema.safeParse({}).success).toBe(true);
      expect(taxonomyQuerySchema.safeParse({ q: 'bearing', category: 'Direct Materials', lookup: '41112400' }).success).toBe(true);
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

describe('Backend Validation Schemas: remaining schemas (constants/validation.ts)', () => {
  describe('pcbiReferenceQuerySchema', () => {
    it('should apply the weekly index limit by default and trim text filters', () => {
      const result = pcbiReferenceQuerySchema.safeParse({ sector: '  Metals  ', pcbiId: 'PCBI-1', limit: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ sector: 'Metals', pcbiId: 'PCBI-1', limit: 25 });
      }

      const defaults = pcbiReferenceQuerySchema.safeParse({});
      expect(defaults.success).toBe(true);
      if (defaults.success) {
        expect(defaults.data.limit).toBe(D1_REPORTING.weeklyIndexLimit);
      }
    });

    it('should reject limits outside the allowed range and blank filters', () => {
      expect(pcbiReferenceQuerySchema.safeParse({ limit: D1_REPORTING.maxIndexLimit + 1 }).success).toBe(false);
      expect(pcbiReferenceQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
      expect(pcbiReferenceQuerySchema.safeParse({ sector: '   ' }).success).toBe(false);
    });
  });

  describe('d1DatasetScopeSchema', () => {
    it('should apply the dataset limit by default and accept scoped identifiers', () => {
      const defaults = d1DatasetScopeSchema.safeParse({});
      expect(defaults.success).toBe(true);
      if (defaults.success) {
        expect(defaults.data.limit).toBe(D1_REPORTING.datasetLimit);
      }

      const scoped = d1DatasetScopeSchema.safeParse({ assessmentId: 'AIC-1', tenantId: 'TNT-1', limit: '50' });
      expect(scoped.success).toBe(true);
      if (scoped.success) {
        expect(scoped.data).toEqual({ assessmentId: 'AIC-1', tenantId: 'TNT-1', limit: 50 });
      }
    });

    it('should reject dataset limits above the maximum and blank identifiers', () => {
      expect(d1DatasetScopeSchema.safeParse({ limit: D1_REPORTING.maxDatasetLimit + 1 }).success).toBe(false);
      expect(d1DatasetScopeSchema.safeParse({ assessmentId: '   ' }).success).toBe(false);
    });
  });

  describe('addIngestionFileSchema defaults', () => {
    it('should fill ingestion defaults when optional fields are omitted', () => {
      const result = addIngestionFileSchema.safeParse({ file_name: 'spend.csv', file_type: 'CSV', file_size_mb: 1 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          ocr_status: 'Completed',
          progress: 100,
          records_count: 0,
          detected_currencies: ['INR'],
          converted_inr_crores: 0
        });
      }
    });

    it('should reject unknown OCR statuses and progress outside 0 to 100', () => {
      const base = { file_name: 'spend.csv', file_type: 'CSV', file_size_mb: 1 };
      expect(addIngestionFileSchema.safeParse({ ...base, ocr_status: 'Unknown' }).success).toBe(false);
      expect(addIngestionFileSchema.safeParse({ ...base, progress: 101 }).success).toBe(false);
    });
  });

  describe('taxonomyQuerySchema limits', () => {
    it('should apply the default taxonomy page size and offset', () => {
      const result = taxonomyQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ q: '', category: '', lookup: '', limit: D1_TAXONOMY_DEFAULT_LIMIT, offset: 0 });
      }
    });

    it('should reject page sizes above the maximum and unknown categories', () => {
      expect(taxonomyQuerySchema.safeParse({ limit: D1_TAXONOMY_MAX_LIMIT + 1 }).success).toBe(false);
      expect(taxonomyQuerySchema.safeParse({ category: 'Unknown Category' }).success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept a valid password change', () => {
      expect(changePasswordSchema.safeParse({ currentPassword: 'old-pass', newPassword: 'new-pass' }).success).toBe(true);
    });

    it('should reject a missing current password and a short new password', () => {
      expect(changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'new-pass' }).success).toBe(false);
      expect(changePasswordSchema.safeParse({ currentPassword: 'old-pass', newPassword: '12345' }).success).toBe(false);
    });
  });

  describe('registerUserSchema name rule', () => {
    it('should reject a name shorter than two characters', () => {
      const result = registerUserSchema.safeParse({
        name: 'J',
        mobile_number: '+91 99999 88888',
        email: 'j@enterprise.com',
        company_name: 'Enterprise Inc',
        company_address: '123 Main St',
        password: 'Password@123'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('aiExtractSchema', () => {
    it('should require documentText or inlineData', () => {
      const missing = aiExtractSchema.safeParse({});
      expect(missing.success).toBe(false);
      if (!missing.success) {
        expect(missing.error.issues.map((issue) => issue.message)).toContain(
          'Either documentText or inlineData must be provided'
        );
      }
      expect(aiExtractSchema.safeParse({ documentText: '' }).success).toBe(false);
    });

    it('should accept either document text or inline file data', () => {
      expect(aiExtractSchema.safeParse({ documentText: 'PO 1001 valve 5 Nos' }).success).toBe(true);
      expect(aiExtractSchema.safeParse({ inlineData: 'SGVsbG8=', mimeType: 'application/pdf' }).success).toBe(true);
    });
  });

  describe('aiCategorizeSchema', () => {
    it('should require at least one item with raw line text', () => {
      expect(aiCategorizeSchema.safeParse({ items: [] }).success).toBe(false);
      expect(aiCategorizeSchema.safeParse({ items: [{ rawLineText: '' }] }).success).toBe(false);
      expect(
        aiCategorizeSchema.safeParse({ items: [{ rawLineText: 'Bearing 6204', vendorIdentified: 'SKF', amount: 1200 }] })
          .success
      ).toBe(true);
    });
  });

  describe('aiExecutiveSummarySchema', () => {
    it('should default categories and vendors to empty lists', () => {
      const result = aiExecutiveSummarySchema.safeParse({ totalSpendInrCr: 10 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toEqual([]);
        expect(result.data.vendors).toEqual([]);
      }
    });

    it('should reject negative totals and malformed category rows', () => {
      expect(aiExecutiveSummarySchema.safeParse({ totalSpendInrCr: -1 }).success).toBe(false);
      expect(
        aiExecutiveSummarySchema.safeParse({
          totalSpendInrCr: 5,
          categories: [{ name: 'Valves', spendInrCr: '5', targetReductionPct: 1 }]
        }).success
      ).toBe(false);
    });
  });

  describe('aiAnalyzeAnomaliesSchema', () => {
    it('should require at least one record and accept nullable currency fields', () => {
      const empty = aiAnalyzeAnomaliesSchema.safeParse({ records: [] });
      expect(empty.success).toBe(false);
      if (!empty.success) {
        expect(empty.error.issues.map((issue) => issue.message)).toContain(
          'At least one record is required for anomaly analysis'
        );
      }

      const nullable = aiAnalyzeAnomaliesSchema.safeParse({
        records: [{ recordId: 'REC-1', poNumber: 'PO-1', vendorName: 'V1', rawCurrency: null, amount: 100, amountInr: null }]
      });
      expect(nullable.success).toBe(true);
    });

    it('should reject records without an identifier', () => {
      expect(
        aiAnalyzeAnomaliesSchema.safeParse({
          records: [{ recordId: '', poNumber: 'PO-1', vendorName: 'V1', amount: 100 }]
        }).success
      ).toBe(false);
    });
  });

  describe('admin user schemas', () => {
    it('should reject unknown role and status filters', () => {
      expect(adminUserQuerySchema.safeParse({}).success).toBe(true);
      expect(adminUserQuerySchema.safeParse({ role: 'OWNER' }).success).toBe(false);
      expect(adminUserQuerySchema.safeParse({ status: 'DELETED' }).success).toBe(false);
    });

    it('should accept only ACTIVE, SUSPENDED, or PENDING for status updates', () => {
      expect(adminUpdateUserStatusSchema.safeParse({ status: 'SUSPENDED' }).success).toBe(true);
      expect(adminUpdateUserStatusSchema.safeParse({ status: 'DELETED' }).success).toBe(false);
    });
  });

  describe('updateActionPlanSchema', () => {
    it('should accept a complete action plan update', () => {
      const result = updateActionPlanSchema.safeParse({
        actionId: 'ACT-1',
        status: 'Completed',
        owner: 'SCM',
        priority: 'HIGH',
        comments: 'Done'
      });
      expect(result.success).toBe(true);
    });

    it('should reject a missing action identifier and unknown enum values', () => {
      const missing = updateActionPlanSchema.safeParse({ actionId: '' });
      expect(missing.success).toBe(false);
      if (!missing.success) {
        expect(missing.error.issues.map((issue) => issue.message)).toContain('actionId is required');
      }
      expect(updateActionPlanSchema.safeParse({ actionId: 'ACT-2', status: 'Cancelled' }).success).toBe(false);
      expect(updateActionPlanSchema.safeParse({ actionId: 'ACT-3', owner: 'Legal' }).success).toBe(false);
    });
  });

  describe('updateOpportunityStatusSchema', () => {
    it('should accept known opportunity statuses only', () => {
      expect(updateOpportunityStatusSchema.safeParse({ opp_id: 'OPP-1', status: 'APPROVED' }).success).toBe(true);
      expect(updateOpportunityStatusSchema.safeParse({ opp_id: 'OPP-1', status: 'DONE' }).success).toBe(false);
      expect(updateOpportunityStatusSchema.safeParse({ opp_id: '', status: 'APPROVED' }).success).toBe(false);
    });
  });

  describe('detectUploadDomainSchema', () => {
    it('should default the target area to the commodity data lab', () => {
      const result = detectUploadDomainSchema.safeParse({ fileName: 'metals.csv' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetArea).toBe('COMMODITY_DATA_LAB');
      }
    });

    it('should reject an empty file name and unknown target areas', () => {
      expect(detectUploadDomainSchema.safeParse({ fileName: '' }).success).toBe(false);
      expect(detectUploadDomainSchema.safeParse({ fileName: 'x.csv', targetArea: 'OTHER' }).success).toBe(false);
    });
  });

  describe('uploadCommoditySourceSchema', () => {
    const validSource = {
      commodityId: 'C-1',
      pcbiId: 'P-1',
      sourceName: 'Metals Index',
      publisher: 'Index Publisher',
      documentName: 'metals.xlsx',
      fileType: 'XLSX'
    };

    it('should accept a minimal valid source and a known frequency', () => {
      expect(uploadCommoditySourceSchema.safeParse(validSource).success).toBe(true);
      expect(uploadCommoditySourceSchema.safeParse({ ...validSource, frequency: 'MONTHLY' }).success).toBe(true);
    });

    it('should reject unsupported file types, frequencies, and missing publishers', () => {
      expect(uploadCommoditySourceSchema.safeParse({ ...validSource, fileType: 'DOCX' }).success).toBe(false);
      expect(uploadCommoditySourceSchema.safeParse({ ...validSource, frequency: 'HOURLY' }).success).toBe(false);
      expect(uploadCommoditySourceSchema.safeParse({ ...validSource, publisher: '' }).success).toBe(false);
    });
  });

  describe('approveCommodityDataSchema', () => {
    it('should accept an approval with an approver name and reject a blank one', () => {
      expect(
        approveCommodityDataSchema.safeParse({ commodityId: 'C-1', pcbiId: 'P-1', approverName: 'Asha' }).success
      ).toBe(true);
      expect(
        approveCommodityDataSchema.safeParse({ commodityId: 'C-1', pcbiId: 'P-1', approverName: '' }).success
      ).toBe(false);
    });
  });

  describe('vendorConsolidationQuerySchema', () => {
    it('accepts supported assessment filters and trims their values', () => {
      expect(vendorConsolidationQuerySchema.safeParse({
        category: ' Resin ',
        status: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL,
        materialCode: ' MAT-1 ',
        supplierCode: ' SUP-1 '
      })).toMatchObject({ success: true, data: {
        category: 'Resin', materialCode: 'MAT-1', supplierCode: 'SUP-1'
      } });
    });

    it('rejects blank, oversized, and unsupported filter values', () => {
      expect(vendorConsolidationQuerySchema.safeParse({ category: '' }).success).toBe(false);
      expect(vendorConsolidationQuerySchema.safeParse({ category: 'x'.repeat(201) }).success).toBe(false);
      expect(vendorConsolidationQuerySchema.safeParse({ status: 'APPROVED' }).success).toBe(false);
      expect(vendorConsolidationQuerySchema.safeParse({ materialCode: 'x'.repeat(121) }).success).toBe(false);
      expect(vendorConsolidationQuerySchema.safeParse({ supplierCode: '' }).success).toBe(false);
    });
  });

  describe('alternateSourcingQuerySchema', () => {
    it('defaults to all locations and accepts trimmed supported filters', () => {
      expect(alternateSourcingQuerySchema.parse({ materialCode: ' MAT-1 ' })).toMatchObject({
        materialCode: 'MAT-1', geographicPreference: 'ALL_LOCATIONS'
      });
      expect(alternateSourcingQuerySchema.safeParse({
        geographicPreference: 'SAME_STATE', preferredState: ' Gujarat ', matchType: 'EXACT'
      })).toMatchObject({ success: true, data: { preferredState: 'Gujarat', matchType: 'EXACT' } });
      expect(alternateSourcingQuerySchema.safeParse({
        geographicPreference: 'SAME_CITY', preferredCity: 'Mumbai', matchType: 'UNMATCHED'
      }).success).toBe(true);
    });

    it('requires location values for regional filters and rejects unsupported inputs', () => {
      expect(alternateSourcingQuerySchema.safeParse({ geographicPreference: 'SAME_STATE' }).success).toBe(false);
      expect(alternateSourcingQuerySchema.safeParse({ geographicPreference: 'OTHER_STATES' }).success).toBe(false);
      expect(alternateSourcingQuerySchema.safeParse({
        geographicPreference: 'SAME_CITY', preferredCity: 'ALL_CITIES'
      }).success).toBe(false);
      expect(alternateSourcingQuerySchema.safeParse({ matchType: 'RELATED' }).success).toBe(false);
      expect(alternateSourcingQuerySchema.safeParse({ materialCode: 'x'.repeat(121) }).success).toBe(false);
      expect(alternateSourcingQuerySchema.safeParse({ spendCategory: '' }).success).toBe(false);
    });
  });

  describe('module 2 review and direct-price schemas', () => {
    it('requires documented evidence when a specification review is rejected', () => {
      const review = {
        assessmentId: 'ASSESSMENT-1',
        candidateId: 'CANDIDATE-1',
        status: 'REJECTED',
        reviewerName: 'Reviewer One',
        technicalJustification: 'The proposed standard does not match the approved application.'
      };
      expect(specificationReviewSchema.safeParse(review).success).toBe(false);
      expect(specificationReviewSchema.safeParse({ ...review, rejectionReason: 'Standard mismatch' }).success)
        .toBe(true);
    });

    it('validates direct-price filters while allowing omitted filters', () => {
      expect(directPriceQuerySchema.safeParse({}).success).toBe(true);
      expect(directPriceQuerySchema.safeParse({ financialYear: 'FY2025-26', category: 'Resin' }).success)
        .toBe(true);
      expect(directPriceQuerySchema.safeParse({ financialYear: '2025', category: '' }).success).toBe(false);
    });
  });

  describe('procurementComplianceReviewSchema', () => {
    const validReview = {
      assessmentId: 'A-1', candidateId: 'CMP-1', status: 'VERIFIED_EXCEPTION',
      reviewerName: 'Reviewer', technicalJustification: 'Confirmed by source purchase order.'
    };

    it('accepts supported review decisions and trims text', () => {
      expect(procurementComplianceReviewSchema.safeParse({
        ...validReview, assessmentId: ' A-1 ', technicalJustification: ' Confirmed by source purchase order. '
      })).toMatchObject({ success: true, data: {
        assessmentId: 'A-1', technicalJustification: 'Confirmed by source purchase order.'
      } });
      expect(procurementComplianceReviewSchema.safeParse({
        ...validReview, status: 'AWAITING_REVIEW'
      }).success).toBe(true);
    });

    it('requires a dismissal reason and rejects invalid or oversized review inputs', () => {
      expect(procurementComplianceReviewSchema.safeParse({ ...validReview, status: 'NOT_AN_EXCEPTION' }).success)
        .toBe(false);
      expect(procurementComplianceReviewSchema.safeParse({ ...validReview, status: 'NOT_AN_EXCEPTION',
        dismissalReason: 'Not a valid exception.' }).success).toBe(true);
      expect(procurementComplianceReviewSchema.safeParse({ ...validReview, technicalJustification: 'short' }).success)
        .toBe(false);
      expect(procurementComplianceReviewSchema.safeParse({ ...validReview, candidateId: 'x'.repeat(121) }).success)
        .toBe(false);
      expect(procurementComplianceReviewSchema.safeParse({ ...validReview, status: 'DATA_INSUFFICIENT' }).success)
        .toBe(false);
    });
  });

  describe('eAuctionPlanningAssumptionSchema', () => {
    const validAssumption = {
      id: 'ASSUMP-1', categoryOrMaterial: 'Packaging', minSavingsRate: 0.02,
      expectedSavingsRate: 0.04, maxSavingsRate: 0.06, rateSource: 'Approved benchmark file',
      referencePeriod: 'FY2024-FY2025', applicability: 'Standard packaging categories',
      approvalStatus: 'Proposed Planning Assumption — Approval Required', confidence: 'MEDIUM',
      isPlanningAssumptionOnly: true
    };

    it('accepts bounded, ordered, planning-only assumptions and trims their text', () => {
      expect(eAuctionPlanningAssumptionSchema.safeParse({
        ...validAssumption, id: ' ASSUMP-1 ', categoryOrMaterial: ' Packaging '
      })).toMatchObject({ success: true, data: { id: 'ASSUMP-1', categoryOrMaterial: 'Packaging' } });
      expect(eAuctionPlanningAssumptionSchema.safeParse({
        ...validAssumption, approvalStatus: 'APPROVED', approvedBy: 'Admin',
        approvedDate: '2026-10-30T00:00:00.000Z'
      }).success).toBe(true);
    });

    it('rejects inverted rates, unsupported states and non-planning records', () => {
      expect(eAuctionPlanningAssumptionSchema.safeParse({
        ...validAssumption, minSavingsRate: 0.05, expectedSavingsRate: 0.04
      }).success).toBe(false);
      expect(eAuctionPlanningAssumptionSchema.safeParse({
        ...validAssumption, expectedSavingsRate: 0.07, maxSavingsRate: 0.06
      }).success).toBe(false);
      expect(eAuctionPlanningAssumptionSchema.safeParse({
        ...validAssumption, approvalStatus: 'APPROVED', approvedDate: 'yesterday'
      }).success).toBe(false);
      expect(eAuctionPlanningAssumptionSchema.safeParse({ ...validAssumption, isPlanningAssumptionOnly: false }).success)
        .toBe(false);
      expect(eAuctionPlanningAssumptionSchema.safeParse({ ...validAssumption, confidence: 'CERTAIN' }).success)
        .toBe(false);
    });
  });
});
