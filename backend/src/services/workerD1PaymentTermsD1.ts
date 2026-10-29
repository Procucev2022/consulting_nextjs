import { D1_TABLES } from '../constants/d1';
import { MODULE2_D1_PAYMENT_TERMS_MESSAGES } from '../constants/module2PaymentTermsD1';
import { MODULE2_D1_VALID_TRANSACTION_FILTER } from '../constants/module2D1Scoped';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { PaymentTermsResult } from '../types/module2PaymentTerms';
import type { PaymentTermsD1SourceRow } from '../types/module2PaymentTermsD1';
import type { ProcurementTransactionScope } from '../types/procurementTransactionD1';
import { queryD1Rows } from './workerD1Query';
import { buildPaymentTermsResult } from './workerD1PaymentTerms';
import logger from '../utils/logger';

export const loadPaymentTermsResultFromD1 = async (
  db: CloudflareD1Database, scope: ProcurementTransactionScope, requestId: string
): Promise<PaymentTermsResult> => {
  if (!scope.assessmentId) throw new Error(MODULE2_D1_PAYMENT_TERMS_MESSAGES.SCOPE_REQUIRED);
  const filters = ['assessment_id = ?', MODULE2_D1_VALID_TRANSACTION_FILTER];
  const params: string[] = [scope.assessmentId];
  if (scope.tenantId) {
    filters.push('tenant_id = ?');
    params.push(scope.tenantId);
  }
  const rows = await queryD1Rows<PaymentTermsD1SourceRow>(db,
    'SELECT transaction_id AS record_id, po_number, document_date_raw AS po_date, supplier_code, supplier_name, ' +
    'material_group AS spend_category, total_inr_raw AS spend_inr, raw_json ' +
    `FROM ${D1_TABLES.transactions} WHERE ${filters.join(' AND ')} ORDER BY source_row_number ASC`,
    params, requestId);
  const result = buildPaymentTermsResult(scope.assessmentId, rows);
  logger.info('Calculated assessment-scoped payment-terms evidence from D1', {
    assessmentId: scope.assessmentId, tenantId: scope.tenantId, requestId,
    recordCount: rows.length, verifiedRecordCount: result.coverageSummary.completeRecordsCount
  });
  return result;
};
