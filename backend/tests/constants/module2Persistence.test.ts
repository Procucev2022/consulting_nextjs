import { describe, it, expect } from 'vitest';
import {
  MODULE2_TAXONOMY_VERSION,
  MODULE2_PERSISTENCE_ERRORS,
  MODULE2_PERSISTENCE_SQL,
  categoryVendorRecordSchema,
  updateMaterialMappingSchema,
  persistedMaterialMappingSchema
} from '../../src/constants/module2Persistence';
import { D1_TABLES } from '../../src/constants/d1';

const validCategoryRecord = {
  categoryName: 'Bearings',
  distinctVendorCount: 12,
  stateCounts: { MH: 5, KA: 7 },
  topCities: [{ city: 'Pune', count: 4 }],
  contactMetrics: {
    hasWebsiteCount: 3,
    hasEmailCount: 8,
    hasPhoneCount: 9,
    missingContactCount: 1
  }
};

const validMappingInput = {
  sourceMaterialId: 'MAT-001',
  unspscCode: '31161501',
  reviewStatus: 'APPROVED',
  reviewedBy: 'analyst',
  auditNotes: 'Verified against taxonomy'
};

describe('Module 2 Persistence Constants (constants/module2Persistence.ts)', () => {
  describe('taxonomy version and error messages', () => {
    it('should pin the taxonomy version used for persisted mappings', () => {
      expect(MODULE2_TAXONOMY_VERSION).toBe('UNv260801');
    });

    it('should provide actionable messages for each persistence error', () => {
      expect(Object.keys(MODULE2_PERSISTENCE_ERRORS).sort()).toEqual(['invalidCategory', 'invalidMapping', 'missingDatabase']);
      expect(MODULE2_PERSISTENCE_ERRORS.missingDatabase).toContain('npm run db:seed:d1');
      expect(MODULE2_PERSISTENCE_ERRORS.invalidCategory).toContain('Reapply the verified D1 reference seed');
      expect(MODULE2_PERSISTENCE_ERRORS.invalidMapping).toContain('Restore the verified material mapping data');
    });
  });

  describe('MODULE2_PERSISTENCE_SQL', () => {
    it('should read the alternate vendor index and vendor company tables', () => {
      expect(MODULE2_PERSISTENCE_SQL.vendorIndex).toBe(
        `SELECT category_key, payload_json FROM ${D1_TABLES.alternateVendors}`
      );
      expect(MODULE2_PERSISTENCE_SQL.vendorCompanies).toBe(
        `SELECT category_key, vendor_norm FROM ${D1_TABLES.alternateVendorCompany}`
      );
    });

    it('should read the material mapping register and upsert by source material id', () => {
      expect(MODULE2_PERSISTENCE_SQL.mappings).toBe(
        `SELECT source_material_id, payload_json FROM ${D1_TABLES.materialMappings}`
      );
      expect(MODULE2_PERSISTENCE_SQL.upsertMapping).toContain(`INSERT INTO ${D1_TABLES.materialMappings}`);
      expect(MODULE2_PERSISTENCE_SQL.upsertMapping).toContain('ON CONFLICT(source_material_id) DO UPDATE SET');
      expect(MODULE2_PERSISTENCE_SQL.upsertMapping).toContain('payload_json = excluded.payload_json');
      expect(MODULE2_PERSISTENCE_SQL.upsertMapping).toContain('updated_at = CURRENT_TIMESTAMP');
    });
  });

  describe('categoryVendorRecordSchema', () => {
    it('should accept a complete category record and default company norms to an empty list', () => {
      const result = categoryVendorRecordSchema.safeParse(validCategoryRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyNorms).toEqual([]);
      }
    });

    it('should keep provided company norms', () => {
      const result = categoryVendorRecordSchema.safeParse({ ...validCategoryRecord, companyNorms: ['ACME LTD'] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyNorms).toEqual(['ACME LTD']);
      }
    });

    it('should reject a blank category name and negative counts', () => {
      expect(categoryVendorRecordSchema.safeParse({ ...validCategoryRecord, categoryName: '' }).success).toBe(false);
      expect(categoryVendorRecordSchema.safeParse({ ...validCategoryRecord, distinctVendorCount: -1 }).success).toBe(false);
      expect(categoryVendorRecordSchema.safeParse({ ...validCategoryRecord, stateCounts: { MH: -2 } }).success).toBe(false);
      expect(
        categoryVendorRecordSchema.safeParse({
          ...validCategoryRecord,
          contactMetrics: { ...validCategoryRecord.contactMetrics, missingContactCount: -1 }
        }).success
      ).toBe(false);
    });
  });

  describe('updateMaterialMappingSchema', () => {
    it('should trim identifiers and accept an eight-digit UNSPSC code', () => {
      const result = updateMaterialMappingSchema.safeParse({
        ...validMappingInput,
        sourceMaterialId: '  MAT-001  ',
        reviewedBy: ' analyst '
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sourceMaterialId).toBe('MAT-001');
        expect(result.data.reviewedBy).toBe('analyst');
      }
    });

    it('should reject UNSPSC codes that are not exactly eight digits', () => {
      expect(updateMaterialMappingSchema.safeParse({ ...validMappingInput, unspscCode: '3116150' }).success).toBe(false);
      expect(updateMaterialMappingSchema.safeParse({ ...validMappingInput, unspscCode: 'ABCDEFGH' }).success).toBe(false);
    });

    it('should reject unknown review statuses and blank identifiers', () => {
      expect(updateMaterialMappingSchema.safeParse({ ...validMappingInput, reviewStatus: 'REJECTED' }).success).toBe(false);
      expect(updateMaterialMappingSchema.safeParse({ ...validMappingInput, sourceMaterialId: '   ' }).success).toBe(false);
      expect(updateMaterialMappingSchema.safeParse({ ...validMappingInput, reviewedBy: '' }).success).toBe(false);
    });
  });

  describe('persistedMaterialMappingSchema', () => {
    it('should accept a persisted mapping and keep extra stored fields (passthrough)', () => {
      const result = persistedMaterialMappingSchema.safeParse({
        sourceMaterialId: 'MAT-001',
        assignedUnspscCode: '31161501',
        reviewStatus: 'PROVISIONAL',
        extra: 'kept'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({ extra: 'kept' });
      }
    });

    it('should reject an assigned code that is not eight digits or an unknown review status', () => {
      expect(
        persistedMaterialMappingSchema.safeParse({
          sourceMaterialId: 'MAT-001',
          assignedUnspscCode: '1234',
          reviewStatus: 'PROVISIONAL'
        }).success
      ).toBe(false);
      expect(
        persistedMaterialMappingSchema.safeParse({
          sourceMaterialId: 'MAT-001',
          assignedUnspscCode: '31161501',
          reviewStatus: 'DRAFT'
        }).success
      ).toBe(false);
    });
  });
});
