import { z } from 'zod';
import { PCBI_DATA_LAB_UPLOAD_MAX_BASE64_LENGTH } from './d1';

export const adminUpdateUserTierSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD'])
});

export const updateActionPlanSchema = z.object({
  actionId: z.string().min(1, 'actionId is required'),
  status: z.enum(['Open', 'In Progress', 'Completed', 'Deferred']).optional(),
  owner: z.enum(['Procurement', 'SCM', 'Plant', 'Finance', 'Technical', 'Management', 'Other']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  comments: z.string().optional()
});

export const updateOpportunityStatusSchema = z.object({
  opp_id: z.string().min(1, 'opp_id is required'),
  status: z.enum([
    'IDENTIFIED',
    'UNDER_VALIDATION',
    'VALIDATED',
    'APPROVED',
    'IMPLEMENTING',
    'REALIZED',
    'REJECTED',
    'DEFERRED'
  ])
});

export const detectUploadDomainSchema = z.object({
  fileName: z.string().min(1, 'fileName is required'),
  fileContentSnippet: z.string().optional(),
  targetArea: z.enum(['PCBI_MASTER', 'COMMODITY_DATA_LAB', 'MODULE_1_INGESTION']).default('COMMODITY_DATA_LAB')
});

export const uploadCommoditySourceSchema = z.object({
  commodityId: z.string().min(1, 'commodityId is required'),
  pcbiId: z.string().min(1, 'pcbiId is required'),
  seriesId: z.string().optional(),
  sourceName: z.string().min(1, 'sourceName is required'),
  publisher: z.string().min(1, 'publisher is required'),
  url: z.string().optional(),
  documentName: z.string().min(1, 'documentName is required'),
  fileBase64: z.string().max(PCBI_DATA_LAB_UPLOAD_MAX_BASE64_LENGTH).optional(),
  publicationDate: z.string().optional(),
  fileType: z.enum(['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT']),
  checksum: z.string().optional(),
  geography: z.string().optional(),
  gradeSpecification: z.string().optional(),
  unit: z.string().optional(),
  currency: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  deliveryBasis: z.string().optional(),
  historicalCoverage: z.string().optional()
});

export const approveCommodityDataSchema = z.object({
  commodityId: z.string().min(1, 'commodityId is required'),
  pcbiId: z.string().min(1, 'pcbiId is required'),
  approverName: z.string().min(1, 'approverName is required'),
  comments: z.string().optional()
});
