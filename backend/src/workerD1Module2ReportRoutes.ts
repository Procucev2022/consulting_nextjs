import type { CloudflareD1Database } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import {
  MODULE2_D1_DIRECT_PRICE, MODULE2_D1_EAUCTION, MODULE2_D1_ROUTE_MESSAGES, MODULE2_D1_SCOPED_MESSAGES,
  MODULE2_D1_VOLUME_EXPORT
} from './constants/module2D1Scoped';
import { MODULE2_D1_SPECIFICATION_RATIONALISATION } from './constants/module2SpecificationRationalisationD1';
import { MODULE2_D1_CATEGORY_SPECIALISATION } from './constants/module2CategorySpecialisationD1';
import { MODULE2_D1_PAYMENT_TERMS } from './constants/module2PaymentTermsD1';
import { MODULE2_D1_VENDOR_CONSOLIDATION } from './constants/module2VendorConsolidationD1';
import { handleScopedModule2Route } from './services/workerD1Module2Scoped';
import { specificationReport } from './workerD1Module2ReviewRoutes';
import { buildSpecificationRationalisationWorkbook } from './services/workerD1SpecificationRationalisationWorkbook';
import type { SpecificationRationalisationResult } from './types/module2SpecificationRationalisation';
import { buildCategorySpecialisationWorkbook } from './services/workerD1CategorySpecialisationWorkbook';
import type { CategorySpecialisationResult } from './types/module2CategorySpecialisation';
import { buildVolumeAggregationWorkbook } from './services/workerD1VolumeAggregationWorkbook';
import type { VolumeAggregationResult } from './types/module2VolumeAggregation';
import { buildEAuctionWorkbook } from './services/workerD1EAuctionWorkbook';
import type { EAuctionResult } from './types/module2EAuction';
import { loadEAuctionPlanningAssumptions } from './services/workerD1EAuctionPlanningAssumptions';
import { buildDirectPriceWorkbook } from './services/workerD1DirectPriceWorkbook';
import type { DirectPriceImprovementResult } from './types/module2DirectPriceImprovement';
import { buildPaymentTermsWorkbook } from './services/workerD1PaymentTermsWorkbook';
import type { PaymentTermsResult } from './types/module2PaymentTerms';
import { buildVendorConsolidationWorkbook } from './services/workerD1VendorConsolidationWorkbook';
import type { VendorConsolidationResult } from './types/module2VendorConsolidation';

export const handleModule2ReportRoute = async (
  db: CloudflareD1Database,
  normalized: string,
  request: Request,
  url: URL
): Promise<WorkerD1Result | null> => {
  if (normalized.startsWith('/specification-rationalisation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/specification-rationalisation' && normalized !== '/specification-rationalisation/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await specificationReport(db, request, url, assessmentId);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/specification-rationalisation') return report;
    const workbook = buildSpecificationRationalisationWorkbook(
      report.data as SpecificationRationalisationResult
    );
    const filename = `${MODULE2_D1_SPECIFICATION_RATIONALISATION.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_SPECIFICATION_RATIONALISATION.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized.startsWith('/category-specialisation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/category-specialisation' && normalized !== '/category-specialisation/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, '/category-specialisation', request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/category-specialisation') return report;
    const workbook = buildCategorySpecialisationWorkbook(report.data as CategorySpecialisationResult);
    const filename = `${MODULE2_D1_CATEGORY_SPECIALISATION.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_CATEGORY_SPECIALISATION.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized === '/export') {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    return await handleScopedModule2Route(db, normalized, request, url) ?? {
      status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown }
    };
  }
  if (normalized.startsWith('/volume-aggregation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized === '/volume-aggregation/export-excel') {
      const report = await handleScopedModule2Route(db, '/volume-aggregation', request, url);
      if (!report) {
        return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
      }
      if (report.status && report.status >= 400) return report;
      if (typeof report.data !== 'object' || report.data === null) return {
        status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown }
      };
      const file = buildVolumeAggregationWorkbook(report.data as VolumeAggregationResult);
      const filename = `${MODULE2_D1_VOLUME_EXPORT.FILENAME_PREFIX}` +
        `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
      return { data: null, response: new Response(file, { status: 200, headers: {
        'Content-Type': MODULE2_D1_VOLUME_EXPORT.MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`
      } }) };
    }
  }
  if (normalized.startsWith('/e-auction')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized === '/e-auction/export-excel') {
      const report = await handleScopedModule2Route(db, '/e-auction', request, url);
      if (!report || typeof report.data !== 'object' || report.data === null) {
        return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
      }
      if (report.status && report.status >= 400) return report;
      const data = { ...(report.data as EAuctionResult),
        planningAssumptions: await loadEAuctionPlanningAssumptions(db) };
      const file = buildEAuctionWorkbook(data);
      const filename = `${MODULE2_D1_EAUCTION.EXPORT.FILENAME_PREFIX}` +
        `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
      return { data: null, response: new Response(file, { status: 200, headers: {
        'Content-Type': MODULE2_D1_EAUCTION.EXPORT.MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`
      } }) };
    }
  }
  if (normalized.startsWith('/direct-price-improvement')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized === '/direct-price-improvement/export-excel') {
      const report = await handleScopedModule2Route(db, '/direct-price-improvement', request, url);
      if (!report || typeof report.data !== 'object' || report.data === null) {
        return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
      }
      if (report.status && report.status >= 400) return report;
      const file = buildDirectPriceWorkbook(report.data as DirectPriceImprovementResult);
      const filename = `${MODULE2_D1_DIRECT_PRICE.EXPORT.FILENAME_PREFIX}` +
        `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
      return { data: null, response: new Response(file, { status: 200, headers: {
        'Content-Type': MODULE2_D1_DIRECT_PRICE.EXPORT.MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`
      } }) };
    }
  }
  if (normalized.startsWith('/payment-terms')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/payment-terms' && normalized !== '/payment-terms/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, '/payment-terms', request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/payment-terms') return report;
    const workbook = buildPaymentTermsWorkbook(report.data as PaymentTermsResult);
    const filename = `${MODULE2_D1_PAYMENT_TERMS.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_PAYMENT_TERMS.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized.startsWith('/vendor-consolidation')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/vendor-consolidation' && normalized !== '/vendor-consolidation/export-excel') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, '/vendor-consolidation', request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    if (report.status && report.status >= 400) return report;
    if (normalized === '/vendor-consolidation') return report;
    const workbook = buildVendorConsolidationWorkbook(report.data as VendorConsolidationResult);
    const filename = `${MODULE2_D1_VENDOR_CONSOLIDATION.EXPORT.FILENAME_PREFIX}` +
      `${assessmentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    return { data: null, response: new Response(workbook, { status: 200, headers: {
      'Content-Type': MODULE2_D1_VENDOR_CONSOLIDATION.EXPORT.MIME_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`
    } }) };
  }
  if (normalized.startsWith('/alternate-sourcing')) {
    const assessmentId = url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id');
    if (!assessmentId) return { status: 409, data: {
      success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired
    } };
    if (normalized !== '/alternate-sourcing') {
      return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    }
    const report = await handleScopedModule2Route(db, normalized, request, url);
    if (!report) return { status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } };
    return report;
  }
  return null;
};
