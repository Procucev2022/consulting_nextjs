import { z } from 'zod';
import { D1_TABLES } from './d1';

export const MODULE2_TAXONOMY_VERSION = 'UNv260801';

export const MODULE2_PERSISTENCE_ERRORS = {
  missingDatabase: 'The local D1 database is unavailable. Run npm run db:seed:d1 in backend before starting the Node service.',
  invalidCategory: 'The D1 alternate vendor index contains an invalid category. Reapply the verified D1 reference seed.',
  invalidMapping: 'The D1 material mapping register contains an invalid record. Restore the verified material mapping data.'
} as const;

export const MODULE2_PERSISTENCE_SQL = {
  vendorIndex: `SELECT category_key, payload_json FROM ${D1_TABLES.alternateVendors}`,
  vendorCompanies: `SELECT category_key, vendor_norm FROM ${D1_TABLES.alternateVendorCompany}`,
  mappings: `SELECT source_material_id, payload_json FROM ${D1_TABLES.materialMappings}`,
  upsertMapping: `INSERT INTO ${D1_TABLES.materialMappings} (source_material_id, payload_json, taxonomy_version)
    VALUES (?, ?, ?) ON CONFLICT(source_material_id) DO UPDATE SET
    payload_json = excluded.payload_json, taxonomy_version = excluded.taxonomy_version,
    updated_at = CURRENT_TIMESTAMP`
} as const;

export const categoryVendorRecordSchema = z.object({
  categoryName: z.string().min(1),
  distinctVendorCount: z.number().int().nonnegative(),
  stateCounts: z.record(z.string(), z.number().int().nonnegative()),
  topCities: z.array(z.object({ city: z.string(), count: z.number().int().nonnegative() })),
  contactMetrics: z.object({
    hasWebsiteCount: z.number().int().nonnegative(),
    hasEmailCount: z.number().int().nonnegative(),
    hasPhoneCount: z.number().int().nonnegative(),
    missingContactCount: z.number().int().nonnegative()
  }),
  companyNorms: z.array(z.string()).optional().default([])
});

export const updateMaterialMappingSchema = z.object({
  sourceMaterialId: z.string().trim().min(1),
  unspscCode: z.string().regex(/^\d{8}$/),
  reviewStatus: z.enum(['TAXONOMY_VERIFIED', 'PROVISIONAL', 'AWAITING_REVIEW', 'CLIENT_APPROVED', 'APPROVED']),
  reviewedBy: z.string().trim().min(1),
  auditNotes: z.string().optional()
});

export const persistedMaterialMappingSchema = z.object({
  sourceMaterialId: z.string().min(1),
  assignedUnspscCode: z.string().regex(/^\d{8}$/),
  reviewStatus: updateMaterialMappingSchema.shape.reviewStatus
}).passthrough();
