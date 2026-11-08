import type { CloudflareD1Database } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import type { ProcurementComplianceResult } from './types/module2ProcurementCompliance';
import { MODULE2_D1_COMPLIANCE } from './constants/module2ProcurementComplianceD1';
import { MODULE2_D1_ROUTE_MESSAGES } from './constants/module2D1Scoped';
import { buildProcurementComplianceWorkbook } from './services/workerD1ProcurementComplianceWorkbook';
import {
  handleProcurementComplianceReview,
  procurementComplianceReport
} from './workerD1Module2ReviewRoutes';

export const handleProcurementComplianceRoute = async (
  db: CloudflareD1Database,
  normalizedPath: string,
  request: Request,
  url: URL,
  authSecret?: string
): Promise<WorkerD1Result | null> => {
  if (!normalizedPath.startsWith('/procurement-compliance')) return null;

  if (normalizedPath === '/procurement-compliance/review') {
    if (request.method !== 'POST') return {
      status: 405,
      data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.postRequired }
    };
    return handleProcurementComplianceReview(db, request, url, authSecret);
  }

  if (normalizedPath !== '/procurement-compliance' &&
      normalizedPath !== '/procurement-compliance/export-excel') {
    return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
  }

  if (request.method !== 'GET') return {
    status: 405,
    data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.method }
  };

  const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
  if (!assessmentId) return {
    status: 409,
    data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.complianceScopeRequired }
  };

  const report = await procurementComplianceReport(db, request, url, assessmentId);
  if (!report || (report.status && report.status >= 400)) return report || {
    status: 404,
    data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown }
  };
  if (normalizedPath === '/procurement-compliance') return report;

  const file = buildProcurementComplianceWorkbook(report.data as ProcurementComplianceResult);
  const filename = `${MODULE2_D1_COMPLIANCE.EXPORT.FILENAME_PREFIX}` +
    `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  return {
    data: null,
    response: new Response(file, { status: 200, headers: {
      'Content-Type': MODULE2_D1_COMPLIANCE.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } })
  };
};
