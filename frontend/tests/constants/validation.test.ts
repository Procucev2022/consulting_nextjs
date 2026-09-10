import { describe, it, expect } from 'vitest';
import {
  headerTenantSchema,
  headerCurrencySchema,
  clientIngestionSetupFormSchema,
  fixCurrencyFormSchema,
  mergeVendorFormSchema,
  reassignTaxonomyFormSchema,
  proCPXFormSchema,
  dpsnxtFormSchema,
  executiveReportFormSchema,
  conversionInputsSchema,
  apiUpdateTenantPayloadSchema,
  apiAddIngestionFilePayloadSchema,
  apiUpdateValidationRecordPayloadSchema,
  apiMergeVendorPayloadSchema,
  apiDeployOpportunityPayloadSchema,
  apiCalculateConversionPayloadSchema
} from '../../src/constants/validation';

describe('Frontend Validation Schemas (constants/validation.ts)', () => {
  describe('headerTenantSchema', () => {
    it('should validate non-empty tenant ID', () => {
      expect(headerTenantSchema.safeParse({ tenantId: 'TENANT-1' }).success).toBe(true);
    });

    it('should reject empty or missing tenantId', () => {
      expect(headerTenantSchema.safeParse({ tenantId: '' }).success).toBe(false);
      expect(headerTenantSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('headerCurrencySchema', () => {
    it('should validate supported currencies', () => {
      expect(headerCurrencySchema.safeParse({ currency: 'INR' }).success).toBe(true);
      expect(headerCurrencySchema.safeParse({ currency: 'USD' }).success).toBe(true);
      expect(headerCurrencySchema.safeParse({ currency: 'EUR' }).success).toBe(true);
      expect(headerCurrencySchema.safeParse({ currency: 'GBP' }).success).toBe(true);
    });

    it('should reject unsupported currencies', () => {
      expect(headerCurrencySchema.safeParse({ currency: 'XYZ' }).success).toBe(false);
    });
  });

  describe('clientIngestionSetupFormSchema', () => {
    it('should validate valid client setup form with or without sector overrides', () => {
      const valid = {
        clientName: 'Apex Enterprise',
        datasetType: 'Purchase History',
        spendPeriod: '36 Months Historical (FY23 - FY26)',
        currency: 'INR',
        region: 'GLOBAL',
        estimatedSpend: 1000000,
        majorSector: 'Chemical & Petrochemicals',
        minorSector: 'Specialty Chemicals'
      };
      const parsed = clientIngestionSetupFormSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.majorSector).toBe('Chemical & Petrochemicals');
        expect(parsed.data.minorSector).toBe('Specialty Chemicals');
      }

      // Default fallback
      const withoutSector = {
        clientName: 'Apex Enterprise',
        datasetType: 'Purchase History',
        spendPeriod: '36 Months Historical (FY23 - FY26)',
        currency: 'INR',
        region: 'GLOBAL',
        estimatedSpend: 1000000
      };
      const parsedDefault = clientIngestionSetupFormSchema.safeParse(withoutSector);
      expect(parsedDefault.success).toBe(true);
      if (parsedDefault.success) {
        expect(parsedDefault.data.majorSector).toBe('Chemical & Petrochemicals');
        expect(parsedDefault.data.minorSector).toBe('Specialty Chemicals');
      }
    });

    it('should reject missing or negative fields', () => {
      expect(clientIngestionSetupFormSchema.safeParse({ clientName: '' }).success).toBe(false);
      expect(clientIngestionSetupFormSchema.safeParse({
        clientName: 'Test',
        datasetType: 'Purchase History',
        spendPeriod: 'FY24',
        currency: 'INR',
        region: 'GLOBAL',
        estimatedSpend: -500
      }).success).toBe(false);
    });
  });

  describe('fixCurrencyFormSchema', () => {
    it('should validate valid currency fix input', () => {
      const valid = {
        recordId: 'REC-123',
        selectedCurrency: 'USD',
        convertedAmountINR: 838000
      };
      expect(fixCurrencyFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty recordId or non-positive amount', () => {
      expect(fixCurrencyFormSchema.safeParse({ recordId: '', selectedCurrency: 'USD', convertedAmountINR: 100 }).success).toBe(false);
      expect(fixCurrencyFormSchema.safeParse({ recordId: 'REC-1', selectedCurrency: 'USD', convertedAmountINR: 0 }).success).toBe(false);
    });
  });

  describe('mergeVendorFormSchema', () => {
    it('should validate valid vendor merge input', () => {
      const valid = {
        recordId: 'REC-123',
        masterVendorId: 'VEND-001',
        masterVendorName: 'Tata Steel Global'
      };
      expect(mergeVendorFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject missing master fields', () => {
      expect(mergeVendorFormSchema.safeParse({ recordId: 'REC-1', masterVendorId: '', masterVendorName: '' }).success).toBe(false);
    });
  });

  describe('reassignTaxonomyFormSchema', () => {
    it('should validate valid taxonomy reassignment', () => {
      const valid = {
        mappingId: 'MAP-101',
        newCode: '41112400',
        newName: 'Direct Materials (Industrial Bearings)',
        bucket: 'Direct Materials'
      };
      expect(reassignTaxonomyFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty code or title', () => {
      expect(reassignTaxonomyFormSchema.safeParse({ mappingId: 'M1', newCode: '', newName: '', bucket: '' }).success).toBe(false);
    });
  });

  describe('proCPXFormSchema', () => {
    it('should validate valid ProCPX parameters', () => {
      const valid = {
        oppId: 'OPP-001',
        eventType: 'Reverse Auction',
        baselineSpendCr: 12.5,
        targetSavingsPct: 15.0,
        invitedSuppliers: ['Supplier A', 'Supplier B'],
        auctionEndDate: '2026-10-01'
      };
      expect(proCPXFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty suppliers list or invalid eventType', () => {
      expect(proCPXFormSchema.safeParse({
        oppId: 'OPP-1',
        eventType: 'InvalidType',
        baselineSpendCr: 10,
        targetSavingsPct: 10,
        invitedSuppliers: [],
        auctionEndDate: '2026-10-01'
      }).success).toBe(false);
    });
  });

  describe('dpsnxtFormSchema', () => {
    it('should validate valid DPS NXT configuration', () => {
      const valid = {
        oppId: 'OPP-002',
        indexPegging: 'WPI Metal Index (Monthly)',
        contractTermMonths: 36,
        maxPriceCreepCapPct: 3.5,
        rateCardCurrency: 'INR'
      };
      expect(dpsnxtFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject non-positive contractTermMonths or invalid percentage', () => {
      expect(dpsnxtFormSchema.safeParse({
        oppId: 'OPP-1',
        indexPegging: 'Index',
        contractTermMonths: -12,
        maxPriceCreepCapPct: 150,
        rateCardCurrency: 'INR'
      }).success).toBe(false);
    });
  });

  describe('executiveReportFormSchema', () => {
    it('should validate valid report configuration', () => {
      const valid = {
        reportTitle: 'Executive Procurement Audit',
        audience: 'C-Suite & Board',
        dateRange: 'FY23-FY26',
        format: 'pdf'
      };
      expect(executiveReportFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject unsupported format', () => {
      expect(executiveReportFormSchema.safeParse({
        reportTitle: 'Report',
        audience: 'Team',
        dateRange: 'FY24',
        format: 'txt'
      }).success).toBe(false);
    });
  });

  describe('conversionInputsSchema', () => {
    it('should validate positive annual spend and valid rates', () => {
      const valid = {
        annualSpendCr: 732.41,
        savingsRate: 16.4,
        saasFeeRate: 0.85
      };
      expect(conversionInputsSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject negative rates', () => {
      expect(conversionInputsSchema.safeParse({
        annualSpendCr: 100,
        savingsRate: -5,
        saasFeeRate: 0.85
      }).success).toBe(false);
    });
  });

  describe('API Outgoing Schemas', () => {
    it('should validate updateTenant payload', () => {
      expect(apiUpdateTenantPayloadSchema.safeParse({ enterprise_name: 'Corp' }).success).toBe(true);
    });

    it('should validate addIngestionFile payload', () => {
      expect(apiAddIngestionFilePayloadSchema.safeParse({
        file_name: 'spend.xlsx',
        file_type: 'Excel',
        file_size_mb: 2.5
      }).success).toBe(true);
    });

    it('should validate updateValidationRecord payload', () => {
      expect(apiUpdateValidationRecordPayloadSchema.safeParse({
        record_id: 'REC-1',
        resolved: true
      }).success).toBe(true);
    });

    it('should validate mergeVendor payload', () => {
      expect(apiMergeVendorPayloadSchema.safeParse({
        targetName: 'Old Corp',
        masterId: 'M-1',
        canonicalName: 'New Corp'
      }).success).toBe(true);
    });

    it('should validate deployOpportunity payload', () => {
      expect(apiDeployOpportunityPayloadSchema.safeParse({
        opp_id: 'OPP-1',
        targetModule: 'proCPX'
      }).success).toBe(true);
    });

    it('should validate calculateConversion payload', () => {
      expect(apiCalculateConversionPayloadSchema.safeParse({
        annualSpendCr: 100,
        savingsRate: 10,
        saasFeeRate: 1
      }).success).toBe(true);
    });
  });
});
