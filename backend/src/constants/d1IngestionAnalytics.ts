import { D1_INGESTION_PAGE_QUERY_LIMIT, D1_REPORTING, D1_TABLES } from './d1';

export const D1_INGESTION_ANALYTICS_LIMITS = {
  maxGroupedRows: 100,
  monthKeyLength: 7,
  pageLimit: D1_INGESTION_PAGE_QUERY_LIMIT,
  inrPerCrore: D1_REPORTING.inrPerCrore,
  usdFallbackRate: 83.8,
  defaultPlantRegion: 'India',
  defaultPlantLocation: 'Multi-Plant ERP Facility',
  defaultMaterialSegment: 'Direct Materials',
  unspecifiedGroupCode: 'UNSPECIFIED',
  unspecifiedGroupLabel: 'Unspecified Material Group',
  unspecifiedPlantCode: 'UNSPECIFIED',
  unspecifiedPlantLabel: 'Unspecified Plant',
  fiscalYearStartMonth: 4
} as const;

export const D1_INGESTION_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

export const D1_INGESTION_ANALYTICS_SQL = {
  availableDocuments: `SELECT * FROM ${D1_TABLES.ingestion} WHERE tenant_id = ? ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?`,
  availableDocumentsByUser: `SELECT * FROM ${D1_TABLES.ingestion} WHERE tenant_id = ? AND user_id = ? ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?`,
  documentValidationSummary: `
    SELECT
      COUNT(*) AS totalRecords,
      COALESCE(SUM(CASE WHEN COALESCE(resolved, 0) = 1 OR issue_flag = 'Passed Clean' THEN 1 ELSE 0 END), 0) AS cleanCount,
      COALESCE(SUM(CASE WHEN NOT (COALESCE(resolved, 0) = 1 OR issue_flag = 'Passed Clean') THEN 1 ELSE 0 END), 0) AS anomaliesCount,
      COALESCE(SUM(CASE WHEN COALESCE(resolved, 0) = 1 THEN 1 ELSE 0 END), 0) AS allResolvedCount,
      COALESCE(SUM(CASE WHEN COALESCE(resolved, 0) = 0 THEN 1 ELSE 0 END), 0) AS pendingActionsCount,
      COALESCE(SUM(CASE WHEN issue_flag LIKE '%Currency%' THEN 1 ELSE 0 END), 0) AS conversionCount,
      COALESCE(SUM(CASE WHEN issue_flag LIKE '%Vendor%' OR issue_flag LIKE '%Supplier%' THEN 1 ELSE 0 END), 0) AS vendorDuplicationCount,
      COALESCE(SUM(CASE WHEN issue_flag LIKE '%Item%' THEN 1 ELSE 0 END), 0) AS itemDuplicationCount,
      COALESCE(SUM(COALESCE(inr_crores, CASE WHEN amount_inr IS NOT NULL THEN amount_inr / ${D1_REPORTING.inrPerCrore}.0 ELSE 0 END)), 0) AS totalSpendCr,
      COALESCE(SUM(CASE WHEN COALESCE(resolved, 0) = 0 THEN COALESCE(inr_crores, CASE WHEN amount_inr IS NOT NULL THEN amount_inr / ${D1_REPORTING.inrPerCrore}.0 ELSE 0 END) ELSE 0 END), 0) AS pendingSpendCr
    FROM ${D1_TABLES.validation}
    WHERE tenant_id = ? AND record_id >= ? AND record_id < ?
  `,
  documentValidationRows: `
    SELECT * FROM ${D1_TABLES.validation}
    WHERE tenant_id = ? AND record_id >= ? AND record_id < ?
    ORDER BY created_at DESC, record_id DESC LIMIT ?
  `,
  documentValidationRowsAfterCursor: `
    SELECT * FROM ${D1_TABLES.validation}
    WHERE tenant_id = ? AND record_id >= ? AND record_id < ?
      AND (created_at < ? OR (created_at = ? AND record_id < ?))
    ORDER BY created_at DESC, record_id DESC LIMIT ?
  `,
  documentEntityCounts: `
    SELECT
      COUNT(*) AS transactionCount,
      COUNT(DISTINCT COALESCE(NULLIF(TRIM(material_code), ''), NULLIF(TRIM(short_text), ''))) AS uniqueItemsCount,
      COUNT(DISTINCT NULLIF(TRIM(supplier_name), '')) AS uniqueVendorsCount,
      COALESCE(SUM(COALESCE(total_in_cr_raw, total_inr_raw / ${D1_REPORTING.inrPerCrore}.0, 0)), 0) AS totalSpendCr
    FROM ${D1_TABLES.transactions}
    WHERE tenant_id = ? AND source_document_id = ?
  `,
  documentMaterialGroups: `
    SELECT
      COALESCE(NULLIF(TRIM(material_group), ''), '${D1_INGESTION_ANALYTICS_LIMITS.unspecifiedGroupCode}') AS group_code,
      COUNT(*) AS records_count,
      COUNT(DISTINCT NULLIF(TRIM(po_number), '')) AS po_count,
      COUNT(DISTINCT COALESCE(NULLIF(TRIM(material_code), ''), NULLIF(TRIM(short_text), ''))) AS unique_items_count,
      COUNT(DISTINCT NULLIF(TRIM(supplier_name), '')) AS unique_vendors_count,
      MIN(NULLIF(TRIM(short_text), '')) AS sample_item,
      MIN(NULLIF(TRIM(supplier_name), '')) AS top_supplier,
      COALESCE(SUM(COALESCE(total_in_cr_raw, total_inr_raw / ${D1_REPORTING.inrPerCrore}.0, 0)), 0) AS spend_inr_cr
    FROM ${D1_TABLES.transactions}
    WHERE tenant_id = ? AND source_document_id = ?
    GROUP BY COALESCE(NULLIF(TRIM(material_group), ''), '${D1_INGESTION_ANALYTICS_LIMITS.unspecifiedGroupCode}')
    ORDER BY spend_inr_cr DESC
    LIMIT ?
  `,
  documentPlants: `
    SELECT
      COALESCE(NULLIF(TRIM(plant), ''), '${D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantCode}') AS plant_code,
      COUNT(*) AS records_count,
      COUNT(DISTINCT NULLIF(TRIM(po_number), '')) AS po_count,
      COUNT(DISTINCT COALESCE(NULLIF(TRIM(material_code), ''), NULLIF(TRIM(short_text), ''))) AS unique_items_count,
      COUNT(DISTINCT NULLIF(TRIM(supplier_name), '')) AS unique_vendors_count,
      MIN(NULLIF(TRIM(material_group), '')) AS top_material_group,
      COALESCE(SUM(COALESCE(total_in_cr_raw, total_inr_raw / ${D1_REPORTING.inrPerCrore}.0, 0)), 0) AS spend_inr_cr
    FROM ${D1_TABLES.transactions}
    WHERE tenant_id = ? AND source_document_id = ?
    GROUP BY COALESCE(NULLIF(TRIM(plant), ''), '${D1_INGESTION_ANALYTICS_LIMITS.unspecifiedPlantCode}')
    ORDER BY spend_inr_cr DESC
    LIMIT ?
  `,
  documentMonths: `
    SELECT
      substr(TRIM(COALESCE(document_date_raw, '')), 1, ${D1_INGESTION_ANALYTICS_LIMITS.monthKeyLength}) AS month_key,
      COUNT(*) AS records_count,
      COUNT(DISTINCT NULLIF(TRIM(po_number), '')) AS po_count,
      COUNT(DISTINCT COALESCE(NULLIF(TRIM(material_code), ''), NULLIF(TRIM(short_text), ''))) AS unique_items_count,
      COUNT(DISTINCT NULLIF(TRIM(supplier_name), '')) AS unique_vendors_count,
      MIN(NULLIF(TRIM(material_group), '')) AS top_material_group,
      MIN(NULLIF(TRIM(plant), '')) AS top_plant,
      COALESCE(SUM(COALESCE(total_in_cr_raw, total_inr_raw / ${D1_REPORTING.inrPerCrore}.0, 0)), 0) AS spend_inr_cr
    FROM ${D1_TABLES.transactions}
    WHERE tenant_id = ? AND source_document_id = ?
      AND TRIM(COALESCE(document_date_raw, '')) GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]*'
    GROUP BY substr(TRIM(COALESCE(document_date_raw, '')), 1, ${D1_INGESTION_ANALYTICS_LIMITS.monthKeyLength})
    ORDER BY month_key ASC
    LIMIT ?
  `
} as const;
