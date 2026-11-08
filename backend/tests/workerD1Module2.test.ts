import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { handleModule2Route as handleModule2RouteImpl } from '../src/workerD1Module2';
import { handleProcurementComplianceRoute } from '../src/workerD1Module2ComplianceRoutes';
import { handleEAuctionPlanningAssumptionsRoute } from '../src/workerD1Module2EAuctionRoutes';
import type { CloudflareD1Database } from '../src/types/cloudflare';
import { MODULE2_D1_PENDING_ROUTES, MODULE2_D1_ROUTE_MESSAGES } from '../src/constants/module2D1Scoped';
import { MODULE2_D1_SPECIFICATION_RATIONALISATION } from '../src/constants/module2SpecificationRationalisationD1';
import { createWorkerDatabase, WORKER_CORE_SECRET } from './helpers/workerCoreFixtures';
import { issueEvidenceToken } from './helpers/evidenceSqlite';

const mockDb = (records: {
  categories?: any[];
  opportunities?: any[];
  vendors?: any[];
  tenant?: any;
  funnel?: any[];
  transactions?: any[];
  assessment?: Record<string, unknown>;
} = {}): CloudflareD1Database => {
  const categories = records.categories || [{ id: 'CAT-1', name: 'Packaging', spend_inr_crores: 50 }];
  const opportunities = records.opportunities || [{ opp_id: 'OPP-1', lever: 'Direct Price Improvement', est_savings_inr_cr: 10 }];
  const vendors = records.vendors || [{ vendor_name: 'Supplier A', total_3yr_spend_inr_cr: 25 }];
  const tenant = records.tenant || { total_spend_evaluated_inr: 556.5347 };
  const funnel = records.funnel || [{ phase_num: 1, phase_name: 'Ingestion' }];
  const transactions = records.transactions || [{ transaction_id: 'TX-1', supplier_name: 'Supplier A' }];
  const assessment = records.assessment || null;

  const prepare = vi.fn((sql: string) => ({
    bind: vi.fn((...args: unknown[]) => ({
      all: vi.fn(async () => {
        if (sql.includes('SpendCategorySummary')) return { results: categories };
        if (sql.includes('SavingsOpportunity')) return { results: opportunities };
        if (sql.includes('VendorYearDetail')) return { results: vendors };
        if (sql.includes('ConversionFunnelPhase')) return { results: funnel };
        if (sql.includes('AssessmentRecord') && sql.includes('WHERE assessment_id = ? AND tenant_id = ?')) {
          return { results: [{ assessment_id: args[0], tenant_id: args[1] }] };
        }
        if (sql.includes('ProcurementTransaction')) return { results: transactions };
        return { results: [] };
      }),
      first: vi.fn(async () => {
        if (sql.includes('SELECT 1')) return { ok: 1 };
        if (sql.includes('SpendCategorySummary')) return categories[0] || null;
        if (sql.includes('TenantMaster')) return tenant;
        if (sql.includes('AssessmentRecord') && sql.includes('WHERE assessment_id = ? AND tenant_id = ?')) {
          return { assessment_id: args[0], tenant_id: args[1] };
        }
        if (sql.includes('AssessmentRecord')) return assessment;
        return null;
      })
    })),
    all: vi.fn(async () => {
      if (sql.includes('SpendCategorySummary')) return { results: categories };
      if (sql.includes('SavingsOpportunity')) return { results: opportunities };
      if (sql.includes('VendorYearDetail')) return { results: vendors };
      if (sql.includes('ConversionFunnelPhase')) return { results: funnel };
      if (sql.includes('ProcurementTransaction')) return { results: transactions };
      return { results: [] };
    }),
    first: vi.fn(async () => {
      if (sql.includes('SELECT 1')) return { ok: 1 };
      if (sql.includes('SpendCategorySummary')) return categories[0] || null;
      if (sql.includes('TenantMaster')) return tenant;
      if (sql.includes('AssessmentRecord') && sql.includes('WHERE assessment_id = ? AND tenant_id = ?')) {
        return { assessment_id: args[0], tenant_id: args[1] };
      }
      if (sql.includes('AssessmentRecord')) return assessment;
      return null;
    })
  }));

  return { prepare } as unknown as CloudflareD1Database;
};

const assessmentIdFromBody = (value: unknown): string | undefined => {
  if (value === null || typeof value !== 'object' || !('assessmentId' in value)) return undefined;
  return typeof value.assessmentId === 'string' ? value.assessmentId : undefined;
};

const req = (path: string, options: RequestInit = {}): Request => {
  const url = new URL(`https://consulting.edge/api/module2${path}`);
  const headers = new Headers(options.headers);
  let bodyAssessmentId: string | undefined;
  if (typeof options.body === 'string') {
    try { bodyAssessmentId = assessmentIdFromBody(JSON.parse(options.body)); } catch { bodyAssessmentId = undefined; }
  }
  const assessmentScoped = url.searchParams.has('assessmentId') || headers.has('x-assessment-id') || Boolean(bodyAssessmentId);
  const tenantId = url.searchParams.get('tenantId') || headers.get('x-tenant-id') ||
    (assessmentScoped ? 'T1' : undefined);
  if (tenantId) {
    headers.set('x-resolved-tenant-id', tenantId);
    headers.set('x-tenant-id', tenantId);
  }
  return new Request(url, { ...options, headers });
};

const handleModule2Route = async (
  db: CloudflareD1Database | undefined,
  path: string,
  request: Request,
  url: URL,
  secret?: string
) => {
  let bodyAssessmentId: string | undefined;
  try { bodyAssessmentId = assessmentIdFromBody(await request.clone().json()); } catch { bodyAssessmentId = undefined; }
  const assessmentId = url.searchParams.get('assessmentId') || request.headers.get('x-assessment-id') || bodyAssessmentId;
  const tenantId = request.headers.get('x-resolved-tenant-id');
  if (db && assessmentId && tenantId && assessmentId.length <= 120) {
    const statement = db.prepare(`INSERT OR IGNORE INTO AssessmentRecord (
      assessment_id, tenant_id, customer_id, customer_name, industry, assessment_owner, status
      ) VALUES (?, ?, ?, ?, 'Test industry', 'test@example.test', 'COMPLETED')`)
      .bind(assessmentId, tenantId, `CUSTOMER-${assessmentId}`, assessmentId);
    if (typeof statement.run === 'function') await statement.run();
  }
  return handleModule2RouteImpl(db, path, request, url, secret);
};

describe('workerD1Module2 handler', () => {
  it('models D1 batch execution as an atomic SQLite transaction', async () => {
    const fixture = createWorkerDatabase();
    try {
      const first = fixture.d1.prepare(`INSERT INTO AssessmentMaterialMapping (
        assessment_id, source_material_id, payload_json, reviewed_by, updated_at
      ) VALUES (?, ?, ?, ?, ?)`)
        .bind('A1', 'MAT-ROLLBACK', '{}', 'reviewer@example.test', '2026-11-07T00:00:00Z');
      const invalid = fixture.d1.prepare(`INSERT INTO AssessmentMaterialMapping (
        assessment_id, source_material_id, payload_json, reviewed_by, updated_at
      ) VALUES (?, ?, ?, ?, ?)`)
        .bind('A1', 'MAT-INVALID', null, 'reviewer@example.test', '2026-11-07T00:00:00Z');

      const batch = fixture.d1.batch;
      if (!batch) throw new Error('SQLite D1 fixture does not provide batch execution.');
      await expect(batch([first, invalid])).rejects.toThrow();
      expect(fixture.db.prepare(
        'SELECT COUNT(*) AS count FROM AssessmentMaterialMapping WHERE assessment_id = ?'
      ).get('A1')).toMatchObject({ count: 0 });
    } finally {
      fixture.close();
    }
  });

  it('scopes uploaded transaction reads to bound assessment and tenant identifiers', async () => {
    const statement = { bind: vi.fn().mockReturnThis(), first: vi.fn().mockResolvedValue({ ok: 1 }),
      all: vi.fn().mockResolvedValue({ results: [{ transaction_id: 'DB-ROW', total_inr_raw: 10000000 }] }) };
    const db = { prepare: vi.fn().mockReturnValue(statement) };
    const request = req('/line-items?assessmentId=AIC-2026-0002&tenantId=TNT-1&limit=20');
    const result = await handleModule2Route(db as unknown as CloudflareD1Database, '/line-items', request, new URL(request.url));
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id = ? AND tenant_id = ?'));
    expect(statement.bind).toHaveBeenCalledWith('AIC-2026-0002', 'TNT-1', 20);
    expect(result.data).toMatchObject({ lineItems: [{ mapping_id: 'DB-ROW', inr_crores: 1 }] });
    const headerRequest = req('/line-items', { headers: { 'x-assessment-id': 'AIC-2026-0003', 'x-tenant-id': 'TNT-2' } });
    await handleModule2Route(db as unknown as CloudflareD1Database, '/line-items', headerRequest, new URL(headerRequest.url));
    expect(statement.bind).toHaveBeenCalledWith('AIC-2026-0003', 'TNT-2', 100);
    const legacy = req('/canonical-input', { headers: { 'x-tenant-id': 'T1' } });
    await handleModule2Route(db as unknown as CloudflareD1Database, '/canonical-input', legacy, new URL(legacy.url));
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id IS NULL'));
    const invalid = req('/line-items?limit=0');
    expect(await handleModule2Route(db as unknown as CloudflareD1Database, '/line-items', invalid, new URL(invalid.url)))
      .toMatchObject({ status: 400, data: { success: false } });
  });

  it('rejects untrusted, mismatched, and unowned canonical input scopes', async () => {
    const fixture = createWorkerDatabase();
    try {
      const missingUrl = new URL('https://consulting.edge/api/module2/canonical-input?assessmentId=A1&tenantId=T1');
      const missingTrustedTenant = await handleModule2RouteImpl(
        fixture.d1, '/canonical-input', new Request(missingUrl), missingUrl
      );
      expect(missingTrustedTenant).toMatchObject({ status: 403, data: { success: false } });

      const mismatchUrl = new URL('https://consulting.edge/api/module2/canonical-input?assessmentId=A1&tenantId=T2');
      const mismatchRequest = new Request(mismatchUrl, { headers: {
        'x-resolved-tenant-id': 'T1', 'x-tenant-id': 'T2'
      } });
      expect(await handleModule2RouteImpl(fixture.d1, '/canonical-input', mismatchRequest, mismatchUrl))
        .toMatchObject({ status: 403, data: { success: false } });

      const unownedUrl = new URL('https://consulting.edge/api/module2/canonical-input?assessmentId=UNKNOWN&tenantId=T1');
      const unownedRequest = new Request(unownedUrl, { headers: {
        'x-resolved-tenant-id': 'T1', 'x-tenant-id': 'T1'
      } });
      expect(await handleModule2RouteImpl(fixture.d1, '/canonical-input', unownedRequest, unownedUrl))
        .toMatchObject({ status: 404, data: { success: false } });
    } finally {
      fixture.close();
    }
  });

  it('uses persisted overlap and net savings values from the assessment', async () => {
    const db = mockDb({ assessment: { overlap_deductions_cr: 2, net_defensible_opportunity_cr: 8 } });
    expect((await handleModule2Route(db, '/dashboard', req('/dashboard'), new URL(req('/dashboard').url))).data)
      .toMatchObject({ totalOverlappingOpportunityInrCr: 2, netQuantifiableOpportunityInrCr: 8 });
  });

  it('uses persisted spend and lever amounts without fabricated percentages or baseline fallbacks', async () => {
    const opportunities = [
      { lever: 'E-Auction', current_spend_inr_cr: 40, est_savings_inr_cr: 4 },
      { lever: 'Vendor Consolidation', current_spend_inr_cr: 30, est_savings_inr_cr: 3 },
      { lever: 'Volume Bundling', current_spend_inr_cr: 20, est_savings_inr_cr: '2' },
      { lever: 'Other', current_spend_inr_cr: 10, est_savings_inr_cr: 'invalid' }
    ];
    const db = mockDb({ tenant: { total_spend_evaluated_inr: 100 }, opportunities });
    const result = await handleModule2Route(db, '/dashboard', req('/dashboard'), new URL(req('/dashboard').url));
    expect(result.data).toMatchObject({
      totalEvaluatedSpendCr: 100, totalIdentifiedSavingsCr: 9,
      eauctionAddressableSpendInrCr: 40, totalPotentialEAuctionOpportunityInrCr: 4,
      vendorConsolidationAddressableSpendInrCr: 30, totalPotentialConsolidationOpportunityInrCr: 3,
      volumeBundlingAddressableSpendInrCr: 20, volumeBundlingQuantifiableBenefitInrCr: 2
    });
    const empty = mockDb({ tenant: {}, opportunities: [] });
    const emptyResult = await handleModule2Route(empty, '/dashboard', req('/dashboard'), new URL(req('/dashboard').url));
    expect(emptyResult.data).toMatchObject({ totalEvaluatedSpendCr: 0, savingsYieldPct: 0, overallDataConfidence: 'INSUFFICIENT_DATA' });
  });

  it('throws error when DB is undefined', async () => {
    await expect(handleModule2Route(undefined, '/dashboard', req('/dashboard'), new URL('https://consulting.edge/api/module2/dashboard'))).rejects.toThrow(
      'Cloudflare D1 binding DB is not configured'
    );
  });

  it('serves assessment-scoped Lever 6 results and a D1-backed workbook export', async () => {
    const fixture = createWorkerDatabase();
    try {
      fixture.db.prepare(`INSERT INTO ProcurementTransaction (
        transaction_id, tenant_id, assessment_id, supplier_name, short_text, material_group,
        order_quantity, order_unit, net_price, currency, total_inr_raw, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'LEVER6-TX-1', 'T1', 'A1', 'Supplier A', 'Paper roll', 'Packaging', 10, 'KG', 100, 'INR', 1000, '{}'
      );
      const dataRequest = req('/sourcing/category-specialisation?assessmentId=A1&tenantId=T1');
      const data = await handleModule2Route(fixture.d1, '/sourcing/category-specialisation', dataRequest,
        new URL(dataRequest.url));
      expect(data.data).toMatchObject({
        assessmentId: 'A1', summary: { tenantId: 'T1', totalProcurementSpendInr: 1000 },
        categories: [expect.objectContaining({ categoryName: 'Packaging', transactionCount: 1 })],
        opportunityHeadAssumptions: []
      });

      const exportRequest = req('/sourcing/category-specialisation/export-excel?assessmentId=A1&tenantId=T1');
      const exported = await handleModule2Route(fixture.d1, '/sourcing/category-specialisation/export-excel',
        exportRequest, new URL(exportRequest.url));
      expect(exported.response?.headers.get('Content-Disposition')).toContain('Category_Specialisation_A1.xlsx');
      const workbook = XLSX.read(await exported.response?.arrayBuffer(), { type: 'array' });
      expect(workbook.SheetNames).toEqual(['Summary', 'Categories', 'Methodology']);
      expect(MODULE2_D1_PENDING_ROUTES.has('/category-specialisation/export-excel')).toBe(false);

      const headerRequest = req('/sourcing/category-specialisation', {
        headers: { 'x-assessment-id': 'A1', 'x-tenant-id': 'T1' }
      });
      expect((await handleModule2Route(fixture.d1, '/sourcing/category-specialisation', headerRequest,
        new URL(headerRequest.url))).data).toMatchObject({ assessmentId: 'A1' });
    } finally {
      fixture.close();
    }
  });

  it('rejects missing, invalid, and unsupported Lever 6 request scopes', async () => {
    const db = mockDb();
    const missing = req('/sourcing/category-specialisation');
    expect(await handleModule2Route(db, '/sourcing/category-specialisation', missing, new URL(missing.url)))
      .toMatchObject({ status: 409 });

    const unsupported = req('/sourcing/category-specialisation/unsupported?assessmentId=A1');
    expect(await handleModule2Route(db, '/sourcing/category-specialisation/unsupported', unsupported,
      new URL(unsupported.url))).toMatchObject({ status: 404 });

    const invalidScope = req(`/sourcing/category-specialisation?assessmentId=${'A'.repeat(121)}`);
    expect(await handleModule2Route(db, '/sourcing/category-specialisation', invalidScope,
      new URL(invalidScope.url))).toMatchObject({ status: 400 });
  });

  it('serves read-only specification candidates and D1 workbook exports from the selected assessment', async () => {
    const fixture = createWorkerDatabase();
    try {
      const insert = fixture.db.prepare(`INSERT INTO ProcurementTransaction (
        transaction_id, tenant_id, assessment_id, supplier_name, supplier_code, short_text, material_group,
        material_code, order_quantity, order_unit, net_price, currency, total_inr_raw, plant, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      insert.run('SPEC-A', 'T1', 'A1', 'Supplier A', 'SUP-A', 'Bolt M12', 'Hardware',
        'MAT-A', 2, 'EA', 10, 'INR', 20, 'Plant 1', '{}');
      insert.run('SPEC-B', 'T1', 'A1', 'Supplier B', 'SUP-B', ' bolt   m12 ', 'hardware',
        'MAT-B', 3, 'EA', 15, 'INR', 45, 'Plant 2', '{}');
      fixture.db.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)').run('T1', 'Tenant 1');
      fixture.db.prepare(`INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'usr-reviewer', 'Asha Reviewer', '+910000000010', 'reviewer@example.test', 'Example', 'Pune',
        'unused-test-hash', 'USER', 'ACTIVE', 'GOLD', 'T1'
      );

      const dataRequest = req('/sourcing/specification-rationalisation?assessmentId=A1&tenantId=T1');
      const data = await handleModule2Route(fixture.d1, '/sourcing/specification-rationalisation', dataRequest,
        new URL(dataRequest.url));
      expect(data.data).toMatchObject({
        assessmentId: 'A1', reviewWorkflowAvailable: true,
        summary: {
          totalMaterialsAssessedCount: 2, totalCandidatesIdentifiedCount: 1,
          totalExpenditureUnderReviewInr: 65, commercialSavingsQuantifiedInr: 0
        },
        candidates: [expect.objectContaining({
          primaryItem: expect.objectContaining({ code: 'MAT-A' }),
          comparisonItem: expect.objectContaining({ code: 'MAT-B' }),
          reviewStatus: 'POTENTIAL_MATCH'
        })]
      });

      const exportRequest = req('/sourcing/specification-rationalisation/export-excel?assessmentId=A1&tenantId=T1');
      const exported = await handleModule2Route(fixture.d1, '/sourcing/specification-rationalisation/export-excel',
        exportRequest, new URL(exportRequest.url));
      expect(exported.response?.headers.get('Content-Disposition'))
        .toContain(`${MODULE2_D1_SPECIFICATION_RATIONALISATION.EXPORT.FILENAME_PREFIX}A1.xlsx`);
      const workbook = XLSX.read(await exported.response?.arrayBuffer(), { type: 'array' });
      expect(workbook.SheetNames).toEqual([...MODULE2_D1_SPECIFICATION_RATIONALISATION.EXPORT.SHEETS]);
      expect(MODULE2_D1_PENDING_ROUTES.has('/specification-rationalisation')).toBe(false);
      expect(MODULE2_D1_PENDING_ROUTES.has('/specification-rationalisation/export-excel')).toBe(false);
      expect(MODULE2_D1_PENDING_ROUTES.has('/specification-rationalisation/review')).toBe(false);
      const token = await issueEvidenceToken({ userId: 'usr-reviewer' }, WORKER_CORE_SECRET);
      const review = req('/sourcing/specification-rationalisation/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A1', candidateId: 'SPEC-1', status: 'TECHNICALLY_VERIFIED',
          reviewerName: 'Untrusted UI name', technicalJustification: 'Compared approved engineering drawings.',
          proposedStandard: 'Bolt M12', applicationScope: 'Line 1 assembly', rejectionReason: 'Not applicable' })
      });
      const savedReview = await handleModule2Route(fixture.d1, '/sourcing/specification-rationalisation/review', review,
        new URL(review.url), WORKER_CORE_SECRET);
      expect(savedReview.data).toMatchObject({
        reviewWorkflowAvailable: true,
        summary: { technicallyVerifiedCount: 1, commercialSavingsQuantifiedInr: 0 },
        candidates: [expect.objectContaining({
          candidateId: 'SPEC-1', reviewStatus: 'TECHNICALLY_VERIFIED',
          reviewHistory: [expect.objectContaining({ reviewerName: 'Asha Reviewer' })]
        })]
      });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM Module2SpecificationReview')
        .get()).toMatchObject({ count: 1 });
    } finally {
      fixture.close();
    }
  });

  it('persists authenticated assessment-scoped UNSPSC mapping decisions and reuses them in D1 reports', async () => {
    const fixture = createWorkerDatabase();
    try {
      fixture.db.prepare(`INSERT INTO ProcurementTransaction (
        transaction_id, tenant_id, assessment_id, supplier_name, short_text, material_group, material_code,
        order_quantity, order_unit, net_price, currency, total_inr_raw, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('MAP-TX-1', 'T1', 'A1', 'Supplier A', 'Resin grade 1', 'Chemicals', 'MAT-1', 2, 'KG', 50, 'INR', 100, '{}');
      fixture.db.prepare(`INSERT INTO UNSPSCCommodity (
        commodity_code, commodity_title, class_code, class_title, family_code, family_title,
        segment_code, segment_title, taxonomy_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('12345678', 'Resins', '123456', 'Chemical Products', '1234', 'Materials', '12', 'Chemicals', 'v1');
      fixture.db.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)').run('T1', 'Tenant 1');
      fixture.db.prepare(`INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('usr-mapper', 'Mapping Reviewer', '+910000000011', 'mapper@example.test', 'Example', 'Pune',
          'unused-test-hash', 'USER', 'ACTIVE', 'GOLD', 'T1');
      const token = await issueEvidenceToken({ userId: 'usr-mapper' }, WORKER_CORE_SECRET);
      const update = req('/sourcing/vendor-consolidation/mappings/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A1', sourceMaterialId: 'MAT-1', unspscCode: '12345678',
          reviewStatus: 'CLIENT_APPROVED', auditNotes: 'Engineering reviewed.' })
      });
      const saved = await handleModule2Route(fixture.d1, '/sourcing/vendor-consolidation/mappings/update', update,
        new URL(update.url), WORKER_CORE_SECRET);
      expect(saved.data).toMatchObject({ success: true, mapping: {
        sourceMaterialId: 'MAT-1', assignedUnspscCode: '12345678', reviewStatus: 'CLIENT_APPROVED',
        reviewedBy: 'Mapping Reviewer'
      } });
      const reportRequest = req('/sourcing/vendor-consolidation?assessmentId=A1&tenantId=T1');
      const report = await handleModule2Route(fixture.d1, '/sourcing/vendor-consolidation', reportRequest,
        new URL(reportRequest.url));
      expect(report.data).toMatchObject({
        mappingRegister: [expect.objectContaining({ sourceMaterialId: 'MAT-1', reviewStatus: 'CLIENT_APPROVED' })],
        mappingExceptions: []
      });

      const badTaxonomyRequest = req('/sourcing/vendor-consolidation/mappings/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A1', sourceMaterialId: 'MAT-1', unspscCode: '99999999',
          reviewStatus: 'CLIENT_APPROVED' })
      });
      expect(await handleModule2Route(fixture.d1, '/sourcing/vendor-consolidation/mappings/update', badTaxonomyRequest,
        new URL(badTaxonomyRequest.url), WORKER_CORE_SECRET)).toMatchObject({ status: 400 });

      const missingTargetRequest = req('/sourcing/vendor-consolidation/mappings/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A1', sourceMaterialId: 'MISSING', unspscCode: '12345678',
          reviewStatus: 'CLIENT_APPROVED' })
      });
      expect(await handleModule2Route(fixture.d1, '/sourcing/vendor-consolidation/mappings/update', missingTargetRequest,
        new URL(missingTargetRequest.url), WORKER_CORE_SECRET)).toMatchObject({ status: 404 });
    } finally {
      fixture.close();
    }
  });

  it('bulk-saves provisional material suggestions and overlays them on D1 line-item reads', async () => {
    const fixture = createWorkerDatabase();
    try {
      fixture.d1.batch = async (statements) => Promise.all(statements.map((statement) => statement.run()));
      fixture.db.prepare(`INSERT INTO ProcurementTransaction (
        transaction_id, tenant_id, assessment_id, supplier_name, short_text, material_group, material_code,
        order_quantity, order_unit, net_price, currency, total_inr_raw, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('BULK-MAP-TX-1', 'T1', 'A-BULK', 'Supplier A', 'Resin grade 1', 'Chemicals', 'MAT-BULK', 2, 'KG', 50, 'INR', 100, '{}');
      fixture.db.prepare(`INSERT INTO UNSPSCCommodity (
        commodity_code, commodity_title, class_code, class_title, family_code, family_title,
        segment_code, segment_title, core_bucket, taxonomy_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('12345678', 'Resins', '123456', 'Chemical Products', '1234', 'Materials', '12', 'Chemicals',
          'Direct Materials', 'v1');
      fixture.db.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)').run('T1', 'Tenant 1');
      fixture.db.prepare(`INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('usr-bulk-mapper', 'Bulk Reviewer', '+910000000013', 'bulk@example.test', 'Example', 'Pune',
          'unused-test-hash', 'USER', 'ACTIVE', 'GOLD', 'T1');
      const token = await issueEvidenceToken({ userId: 'usr-bulk-mapper' }, WORKER_CORE_SECRET);
      const update = req('/sourcing/vendor-consolidation/mappings/bulk-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A-BULK', mappings: [{ sourceMaterialId: 'MAT-BULK',
          unspscCode: '12345678', reviewStatus: 'PROVISIONAL', confidenceScore: 0.87,
          mappingMethod: 'CONTEXTUAL_HEURISTIC', auditNotes: 'Suggested by the classifier; requires review.' }] })
      });
      const saved = await handleModule2Route(fixture.d1, '/sourcing/vendor-consolidation/mappings/bulk-update', update,
        new URL(update.url), WORKER_CORE_SECRET);
      expect(saved.data).toMatchObject({ success: true, mappings: [expect.objectContaining({
        sourceMaterialId: 'MAT-BULK', reviewStatus: 'PROVISIONAL', confidenceScore: 0.87,
        coreBucket: 'Direct Materials'
      })] });

      const read = req('/sourcing/line-items?assessmentId=A-BULK&tenantId=T1');
      const result = await handleModule2Route(fixture.d1, '/sourcing/line-items', read, new URL(read.url));
      expect(result.data).toMatchObject({ lineItems: [expect.objectContaining({
        material_code: 'MAT-BULK', unspsc_code: '12345678', core_bucket: 'Direct Materials', status: 'Pending Review'
      })] });

      const duplicate = req('/sourcing/vendor-consolidation/mappings/bulk-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A-BULK', mappings: [
          { sourceMaterialId: 'MAT-BULK', unspscCode: '12345678', reviewStatus: 'PROVISIONAL' },
          { sourceMaterialId: 'MAT-BULK', unspscCode: '12345678', reviewStatus: 'PROVISIONAL' }
        ] })
      });
      expect(await handleModule2Route(fixture.d1, '/sourcing/vendor-consolidation/mappings/bulk-update', duplicate,
        new URL(duplicate.url), WORKER_CORE_SECRET)).toMatchObject({ status: 400 });
    } finally {
      fixture.close();
    }
  });

  it('loads, reviews, and exports procurement compliance exclusively from assessment D1 evidence', async () => {
    const fixture = createWorkerDatabase();
    try {
      const insert = fixture.db.prepare(`INSERT INTO ProcurementTransaction (
        transaction_id, tenant_id, assessment_id, po_number, po_line, document_date_raw, supplier_code,
        supplier_name, material_code, short_text, material_group, order_quantity, order_unit, net_price,
        currency, total_inr_raw, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      insert.run('COMPLIANCE-TX-1', 'T1', 'A1', 'PO-1', '10', '2026-04-01', 'SUP-1', 'Supplier One',
        'MAT-1', 'Resin Grade A', 'Chemicals', 10, 'KG', 100, 'INR', 1000, '{}');
      insert.run('COMPLIANCE-TX-2', 'T1', 'A1', 'PO-2', '20', '2026-04-02', 'SUP-2', 'Supplier Two',
        'MAT-1', 'Resin Grade A', 'Chemicals', 10, 'KG', 140, 'INR', 1400, '{}');
      fixture.db.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)').run('T1', 'Tenant 1');
      fixture.db.prepare(`INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'usr-compliance-reviewer', 'Compliance Reviewer', '+910000000012', 'compliance@example.test', 'Example',
        'Pune', 'unused-test-hash', 'USER', 'ACTIVE', 'GOLD', 'T1'
      );
      const token = await issueEvidenceToken({ userId: 'usr-compliance-reviewer' }, WORKER_CORE_SECRET);
      const get = req('/sourcing/procurement-compliance?assessmentId=A1&tenantId=T1');
      expect(await handleProcurementComplianceRoute(fixture.d1, '/dashboard', get, new URL(get.url)))
        .toBeNull();
      const untrustedRequest = new Request(
        'https://consulting.edge/api/module2/sourcing/procurement-compliance?assessmentId=A1'
      );
      expect(await handleProcurementComplianceRoute(fixture.d1, '/procurement-compliance', untrustedRequest,
        new URL(untrustedRequest.url))).toMatchObject({ status: 403 });
      const report = await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance', get, new URL(get.url));
      const result = report.data as { assessmentId: string; summary: Record<string, unknown>;
        exceptions: Array<{ exceptionId: string; checkType: string }> };
      expect(result).toMatchObject({ assessmentId: 'A1', summary: {
        tenantId: 'T1', customerName: 'A1', totalTransactionsReviewedCount: 2,
        totalExceptionsIdentifiedCount: 1, totalPotentialFinancialExposureInr: 200
      }, exceptions: [expect.objectContaining({ checkType: 'PRICE_INCONSISTENCY' })] });
      expect(MODULE2_D1_PENDING_ROUTES.has('/procurement-compliance')).toBe(false);

      const headerScoped = req('/sourcing/procurement-compliance', {
        headers: { 'x-assessment-id': 'A1', 'x-tenant-id': 'T1' }
      });
      expect((await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance', headerScoped,
        new URL(headerScoped.url))).data).toMatchObject({ assessmentId: 'A1' });

      const exportRequest = req('/sourcing/procurement-compliance/export-excel?assessmentId=A1&tenantId=T1');
      const exported = await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance/export-excel',
        exportRequest, new URL(exportRequest.url));
      expect(exported.response?.headers.get('Content-Disposition')).toContain('Procurement_Compliance_A1.xlsx');
      expect(XLSX.read(await exported.response?.arrayBuffer(), { type: 'array' }).SheetNames)
        .toEqual(['Summary', 'Exceptions', 'Control Checks', 'Methodology']);

      const review = req('/sourcing/procurement-compliance/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A1', candidateId: result.exceptions[0].exceptionId,
          status: 'VERIFIED_EXCEPTION', reviewerName: 'Untrusted UI reviewer',
          technicalJustification: 'Confirmed against the source purchase orders and specifications.',
          correctiveActionPlan: 'Reconcile the price against the contract.' })
      });
      const saved = await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance/review', review,
        new URL(review.url), WORKER_CORE_SECRET);
      expect(saved.data).toMatchObject({ summary: { verifiedExceptionsCount: 1, verifiedFinancialImpactInr: 0 },
        exceptions: [expect.objectContaining({ reviewStatus: 'VERIFIED_EXCEPTION', reviewHistory: [
          expect.objectContaining({ reviewerName: 'Compliance Reviewer', status: 'VERIFIED_EXCEPTION' })
        ] })] });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM Module2ComplianceReview').get())
        .toMatchObject({ count: 1 });

      const dismissedReview = req('/sourcing/procurement-compliance/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A1', candidateId: result.exceptions[0].exceptionId,
          status: 'NOT_AN_EXCEPTION', technicalJustification: 'Confirmed against the signed contract.',
          dismissalReason: 'The contract supports the observed difference.' })
      });
      const dismissed = await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance/review', dismissedReview,
        new URL(dismissedReview.url), WORKER_CORE_SECRET);
      expect(dismissed.data).toMatchObject({ summary: { dismissedCount: 1 }, exceptions: [
        expect.objectContaining({ reviewStatus: 'NOT_AN_EXCEPTION', reviewHistory: [
          expect.objectContaining({ status: 'VERIFIED_EXCEPTION' }),
          expect.objectContaining({ dismissalReason: 'The contract supports the observed difference.' })
        ] })
      ] });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM Module2ComplianceReview').get())
        .toMatchObject({ count: 2 });

      const invalidReview = req('/sourcing/procurement-compliance/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessmentId: 'A1', candidateId: 'MISSING', status: 'NOT_AN_EXCEPTION',
          technicalJustification: 'This source row is valid.', dismissalReason: '' })
      });
      expect(await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance/review', invalidReview,
        new URL(invalidReview.url), WORKER_CORE_SECRET)).toMatchObject({ status: 400 });

      const noScope = req('/sourcing/procurement-compliance');
      expect(await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance', noScope, new URL(noScope.url)))
        .toMatchObject({ status: 409 });
      const wrongMethod = req('/sourcing/procurement-compliance', { method: 'POST' });
      expect(await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance', wrongMethod,
        new URL(wrongMethod.url))).toMatchObject({ status: 405 });
      const unknown = req('/sourcing/procurement-compliance/unknown?assessmentId=A1');
      expect(await handleModule2Route(fixture.d1, '/sourcing/procurement-compliance/unknown', unknown,
        new URL(unknown.url))).toMatchObject({ status: 404 });
    } finally {
      fixture.close();
    }
  });

  it('validates all D1 review routes before authentication and rejects unsupported methods', async () => {
    const db = mockDb();
    const requests = [
      {
        path: '/sourcing/specification-rationalisation/review',
        body: { assessmentId: 'A1', candidateId: 'SPEC-1', status: 'TECHNICALLY_VERIFIED',
          reviewerName: 'Reviewer', technicalJustification: 'Reviewed the source specification.' }
      },
      {
        path: '/sourcing/vendor-consolidation/mappings/update',
        body: { assessmentId: 'A1', sourceMaterialId: 'MAT-1', unspscCode: '12345678',
          reviewStatus: 'CLIENT_APPROVED' }
      },
      {
        path: '/sourcing/procurement-compliance/review',
        body: { assessmentId: 'A1', candidateId: 'CMP-1', status: 'AWAITING_REVIEW',
          technicalJustification: 'Reviewed the source purchase orders.' }
      }
    ];

    for (const { path, body } of requests) {
      const wrongMethod = req(path);
      expect(await handleModule2Route(db, path, wrongMethod, new URL(wrongMethod.url), WORKER_CORE_SECRET))
        .toMatchObject({ status: 405 });

      const malformed = req(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
      expect(await handleModule2Route(db, path, malformed, new URL(malformed.url), WORKER_CORE_SECRET))
        .toMatchObject({ status: 400 });

      const unauthenticated = req(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      expect(await handleModule2Route(db, path, unauthenticated, new URL(unauthenticated.url), WORKER_CORE_SECRET))
        .toMatchObject({ status: 401 });
    }
  });

  it('returns scoped D1 validation errors instead of building invalid workbooks', async () => {
    const db = mockDb();
    const invalidAssessmentId = 'A'.repeat(121);
    const paths = [
      '/sourcing/volume-aggregation/export-excel',
      '/sourcing/e-auction/export-excel',
      '/sourcing/direct-price-improvement/export-excel',
      '/sourcing/payment-terms',
      '/sourcing/vendor-consolidation',
      '/sourcing/alternate-sourcing'
    ];
    for (const path of paths) {
      const request = req(`${path}?assessmentId=${invalidAssessmentId}`);
      expect(await handleModule2Route(db, path, request, new URL(request.url))).toMatchObject({
        status: 400, data: { success: false }
      });
    }
  });

  it('validates specification route scopes and rejects unsupported paths', async () => {
    const db = mockDb();
    const missingScope = req('/sourcing/specification-rationalisation');
    expect(await handleModule2Route(db, '/sourcing/specification-rationalisation', missingScope,
      new URL(missingScope.url))).toMatchObject({ status: 409 });

    const fixture = createWorkerDatabase();
    try {
      const headerScope = req('/sourcing/specification-rationalisation', {
        headers: { 'x-assessment-id': 'A1', 'x-tenant-id': 'T1' }
      });
      expect((await handleModule2Route(fixture.d1, '/sourcing/specification-rationalisation', headerScope,
        new URL(headerScope.url))).data).toMatchObject({ assessmentId: 'A1' });
    } finally {
      fixture.close();
    }

    const unsupported = req('/sourcing/specification-rationalisation/unsupported?assessmentId=A1');
    expect(await handleModule2Route(db, '/sourcing/specification-rationalisation/unsupported', unsupported,
      new URL(unsupported.url))).toMatchObject({ status: 404 });

    const invalidScope = req(`/sourcing/specification-rationalisation?assessmentId=${'A'.repeat(121)}`);
    expect(await handleModule2Route(db, '/sourcing/specification-rationalisation', invalidScope,
      new URL(invalidScope.url))).toMatchObject({ status: 400 });
  });

  it('handles /dashboard and /overview with /sourcing prefix', async () => {
    const db = mockDb();
    const dash = await handleModule2Route(db, '/sourcing/dashboard', req('/sourcing/dashboard'), new URL('https://consulting.edge/api/module2/sourcing/dashboard'));
    expect(dash.data).toHaveProperty('totalEvaluatedSpendCr');
    expect(dash.data).toHaveProperty('totalAddressableSpendInrCr');
    expect(dash.data).toHaveProperty('overallDataConfidence', 'HIGH');

    const overview = await handleModule2Route(db, '/overview', req('/overview'), new URL('https://consulting.edge/api/module2/overview'));
    expect(overview.data).toHaveProperty('totalIdentifiedSavingsCr');
  });

  it('handles /categories, /profiles, and /category/:id', async () => {
    const db = mockDb();
    const cats = await handleModule2Route(db, '/sourcing/categories', req('/sourcing/categories'), new URL('https://consulting.edge/api/module2/sourcing/categories'));
    expect((cats.data as any).profiles).toHaveLength(1);

    const singleCat = await handleModule2Route(db, '/sourcing/category/CAT-1', req('/sourcing/category/CAT-1'), new URL('https://consulting.edge/api/module2/sourcing/category/CAT-1'));
    expect(singleCat.data).toHaveProperty('id', 'CAT-1');
  });

  it('handles /suppliers and /top50-vendors', async () => {
    const db = mockDb();
    const sups = await handleModule2Route(db, '/sourcing/suppliers', req('/sourcing/suppliers'), new URL('https://consulting.edge/api/module2/sourcing/suppliers'));
    expect((sups.data as any).suppliers).toHaveLength(1);

    const top50 = await handleModule2Route(db, '/top-50-vendors', req('/top-50-vendors'), new URL('https://consulting.edge/api/module2/top-50-vendors'));
    expect((top50.data as any).suppliers).toHaveLength(1);
  });

  it('handles /opportunities, /waterfall, and /bridge', async () => {
    const db = mockDb();
    const opps = await handleModule2Route(db, '/opportunities', req('/opportunities'), new URL('https://consulting.edge/api/module2/opportunities'));
    expect(opps.data).toHaveLength(1);

    const waterfall = await handleModule2Route(db, '/waterfall', req('/waterfall'), new URL('https://consulting.edge/api/module2/waterfall'));
    expect(waterfall.data).toHaveLength(1);
  });

  it('handles lever endpoints: direct-price-improvement, e-auction, vendor-consolidation', async () => {
    const db = mockDb();
    const dpiRequest = req('/sourcing/direct-price-improvement');
    const dpi = await handleModule2Route(db, '/sourcing/direct-price-improvement', dpiRequest, new URL(dpiRequest.url));
    expect(dpi).toMatchObject({ status: 409, data: { success: false } });

    const eauctRequest = req('/sourcing/e-auction');
    const eauct = await handleModule2Route(db, '/sourcing/e-auction', eauctRequest, new URL(eauctRequest.url));
    expect(eauct).toMatchObject({ status: 409, data: { success: false } });

    const vconRequest = req('/sourcing/vendor-consolidation');
    const vcon = await handleModule2Route(db, '/sourcing/vendor-consolidation', vconRequest, new URL(vconRequest.url));
    expect(vcon).toMatchObject({ status: 409, data: { success: false } });
    expect(vi.mocked(db.prepare).mock.calls.some(([sql]) => sql.includes('SavingsOpportunity'))).toBe(false);
  });

  it('serves assessment-scoped volume aggregation from imported D1 transactions', async () => {
    const rows = [
      { id: 'TX-1', po_number: 'PO-1', po_line: '1', po_date: '2026-01-01', vendor_code: 'SUP-1',
        vendor_name: 'Supplier A', material_code: 'MAT-1', material_desc: 'Resin', quantity: 4,
        uom: 'KG', unit_price: 10, total_spend_inr: 40, currency: 'INR', plant: 'P1', spend_category: 'Resin' },
      { id: 'TX-2', po_number: 'PO-2', po_line: '1', po_date: '2026-02-01', vendor_code: 'SUP-2',
        vendor_name: 'Supplier B', material_code: 'MAT-1', material_desc: 'Resin', quantity: 6,
        uom: 'KG', unit_price: 10, total_spend_inr: 60, currency: 'INR', plant: 'P2', spend_category: 'Resin' }
    ];
    const statement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ ok: 1 }),
      all: vi.fn().mockImplementation(async () => ({ results: rows }))
    };
    const db = { prepare: vi.fn().mockReturnValue(statement) } as unknown as CloudflareD1Database;
    const request = req('/sourcing/volume-aggregation?assessmentId=AIC-2026-0001');
    const result = await handleModule2Route(db, '/sourcing/volume-aggregation', request, new URL(request.url));
    expect(result.data).toMatchObject({
      assessmentId: 'AIC-2026-0001',
      coverageSummary: { totalTransactionsCount: 2, potentiallyAggregatableSpendInr: 100 },
      tier1Opportunities: [{ materialCode: 'MAT-1', plants: ['P1', 'P2'] }]
    });
    expect(statement.bind).toHaveBeenCalledWith('AIC-2026-0001', 'T1');
    const exportRequest = req('/sourcing/volume-aggregation/export-excel?assessmentId=AIC-2026-0001');
    const exportResult = await handleModule2Route(db, '/sourcing/volume-aggregation/export-excel', exportRequest, new URL(exportRequest.url));
    expect(exportResult.response?.headers.get('Content-Type')).toContain('spreadsheetml.sheet');
    expect(exportResult.response?.headers.get('Content-Disposition')).toContain('Volume_Aggregation_AIC-2026-0001.xlsx');
    const bytes = new Uint8Array(await exportResult.response!.arrayBuffer());
    expect([...bytes.slice(0, 2)]).toEqual([0x50, 0x4b]);
  });

  it('serves D1-backed e-auction analysis and a real assessment-scoped XLSX export', async () => {
    const transactions = [
      { id: 'EA-1', po_number: 'PO-1', po_date: '2025-04-01', vendor_code: 'S1', vendor_name: 'Supplier 1',
        material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 10,
        total_spend_inr: 500000, plant: 'P1', spend_category: 'Resin' },
      { id: 'EA-2', po_number: 'PO-2', po_date: '2025-05-01', vendor_code: 'S2', vendor_name: 'Supplier 2',
        material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 11,
        total_spend_inr: 400000, plant: 'P2', spend_category: 'Resin' },
      { id: 'EA-3', po_number: 'PO-3', po_date: '2025-06-01', vendor_code: 'S1', vendor_name: 'Supplier 1',
        material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 12,
        total_spend_inr: 300000, plant: 'P1', spend_category: 'Resin' }
    ];
    const db = mockDb({ transactions });
    const request = req('/sourcing/e-auction?assessmentId=A-1&financialYear=FY2025-26');
    const result = await handleModule2Route(db, '/sourcing/e-auction', request, new URL(request.url));
    expect(result.data).toMatchObject({
      assessmentId: 'A-1', totalSpendReviewedInr: 1200000,
      candidateCategoriesCount: 1, commerciallyValidatedSavingsInr: 0
    });

    const exportRequest = req('/sourcing/e-auction/export-excel?assessmentId=A-1');
    const exportResult = await handleModule2Route(
      db, '/sourcing/e-auction/export-excel', exportRequest, new URL(exportRequest.url)
    );
    const workbook = XLSX.read(new Uint8Array(await exportResult.response!.arrayBuffer()), { type: 'array' });
    expect(exportResult.response?.headers.get('Content-Type')).toContain('spreadsheetml.sheet');
    expect(exportResult.response?.headers.get('Content-Disposition')).toContain('EAuction_Candidates_A-1.xlsx');
    expect(workbook.SheetNames).toEqual(['Summary', 'Categories', 'Materials', 'Limitations', 'Planning Assumptions']);

    const invalid = req('/sourcing/e-auction?assessmentId=A-1&financialYear=FY2025');
    expect(await handleModule2Route(db, '/sourcing/e-auction', invalid, new URL(invalid.url)))
      .toMatchObject({ status: 400, data: { success: false } });
    const unscoped = req('/sourcing/e-auction');
    expect(await handleModule2Route(db, '/sourcing/e-auction', unscoped, new URL(unscoped.url)))
      .toMatchObject({ status: 409, data: { success: false } });
  });

  it('loads, updates, and exports D1 planning assumptions with authenticated approval history', async () => {
    const fixture = createWorkerDatabase();
    try {
      fixture.db.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)')
        .run('TNT-GLOBAL-8902', 'Global Tenant');
      fixture.db.prepare(`INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'auction-admin', 'Auction Admin', '+910000000021', 'auction-admin@example.test', 'Example', 'Pune',
        'unused-test-hash', 'ADMIN', 'ACTIVE', 'GOLD'
      );
      fixture.db.prepare(`INSERT INTO User (
        id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'auction-user', 'Auction User', '+910000000022', 'auction-user@example.test', 'Example', 'Pune',
        'unused-test-hash', 'USER', 'ACTIVE', 'GOLD', 'TNT-GLOBAL-8902'
      );
      const adminToken = await issueEvidenceToken({ userId: 'auction-admin' }, WORKER_CORE_SECRET);
      const userToken = await issueEvidenceToken({ userId: 'auction-user' }, WORKER_CORE_SECRET);
      const list = req('/sourcing/e-auction/planning-assumptions');
      expect(await handleEAuctionPlanningAssumptionsRoute(
        fixture.d1, '/dashboard', list, WORKER_CORE_SECRET
      )).toBeNull();
      expect((await handleModule2Route(fixture.d1, '/sourcing/e-auction/planning-assumptions', list,
        new URL(list.url))).data).toEqual([]);
      expect(MODULE2_D1_PENDING_ROUTES.has('/e-auction/planning-assumptions')).toBe(false);

      const assumption = {
        id: 'ASSUMP-1', categoryOrMaterial: 'Packaging', minSavingsRate: 0.02,
        expectedSavingsRate: 0.04, maxSavingsRate: 0.06, rateSource: 'Approved benchmark',
        referencePeriod: 'FY2024-FY2025', applicability: 'Standard packaging',
        approvalStatus: 'APPROVED', confidence: 'HIGH', isPlanningAssumptionOnly: true
      };
      const invalid = req('/sourcing/e-auction/planning-assumptions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assumption, expectedSavingsRate: 0.07 })
      });
      expect(await handleModule2Route(fixture.d1, '/sourcing/e-auction/planning-assumptions', invalid,
        new URL(invalid.url), WORKER_CORE_SECRET)).toMatchObject({ status: 400 });

      const unauthenticated = req('/sourcing/e-auction/planning-assumptions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assumption)
      });
      expect(await handleModule2Route(fixture.d1, '/sourcing/e-auction/planning-assumptions', unauthenticated,
        new URL(unauthenticated.url), WORKER_CORE_SECRET)).toMatchObject({ status: 401 });

      const nonAdmin = req('/sourcing/e-auction/planning-assumptions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify(assumption)
      });
      expect(await handleModule2Route(fixture.d1, '/sourcing/e-auction/planning-assumptions', nonAdmin,
        new URL(nonAdmin.url), WORKER_CORE_SECRET)).toMatchObject({ status: 403 });

      const update = req('/sourcing/e-auction/planning-assumptions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ ...assumption, approvedBy: 'Forged reviewer',
          approvedDate: '2020-01-01T00:00:00.000Z' })
      });
      const updated = await handleModule2Route(fixture.d1, '/sourcing/e-auction/planning-assumptions', update,
        new URL(update.url), WORKER_CORE_SECRET);
      expect(updated.data).toMatchObject({ success: true, assumption: {
        id: 'ASSUMP-1', approvalStatus: 'APPROVED', approvedBy: 'Auction Admin', isPlanningAssumptionOnly: true
      } });
      expect((updated.data as { assumption: { approvedDate: string } }).assumption.approvedDate)
        .not.toBe('2020-01-01T00:00:00.000Z');

      const reportRequest = req('/sourcing/e-auction?assessmentId=A1');
      const report = await handleModule2Route(fixture.d1, '/sourcing/e-auction', reportRequest,
        new URL(reportRequest.url));
      expect(report.data).toMatchObject({ planningAssumptions: [
        expect.objectContaining({ id: 'ASSUMP-1', expectedSavingsRate: 0.04 })
      ], commerciallyValidatedSavingsInr: 0 });

      const exportRequest = req('/sourcing/e-auction/export-excel?assessmentId=A1');
      const exported = await handleModule2Route(fixture.d1, '/sourcing/e-auction/export-excel', exportRequest,
        new URL(exportRequest.url));
      const workbook = XLSX.read(new Uint8Array(await exported.response?.arrayBuffer()), { type: 'array' });
      expect(XLSX.utils.sheet_to_json(workbook.Sheets['Planning Assumptions'])).toContainEqual(
        expect.objectContaining({ categoryOrMaterial: 'Packaging', approvalStatus: 'APPROVED', approvedBy: 'Auction Admin' })
      );

      const proposedUpdate = req('/sourcing/e-auction/planning-assumptions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ ...assumption, id: 'ASSUMP-2', approvalStatus: 'PENDING_APPROVAL',
          approvedBy: 'Forged reviewer', approvedDate: '2020-01-01T00:00:00.000Z' })
      });
      const proposed = await handleModule2Route(fixture.d1, '/sourcing/e-auction/planning-assumptions',
        proposedUpdate, new URL(proposedUpdate.url), WORKER_CORE_SECRET);
      expect(proposed.data).toMatchObject({ success: true, assumption: {
        id: 'ASSUMP-2', approvalStatus: 'PENDING_APPROVAL', isPlanningAssumptionOnly: true,
        approvedBy: undefined, approvedDate: undefined
      } });

      const wrongMethod = req('/sourcing/e-auction/planning-assumptions', { method: 'POST' });
      expect(await handleModule2Route(fixture.d1, '/sourcing/e-auction/planning-assumptions', wrongMethod,
        new URL(wrongMethod.url), WORKER_CORE_SECRET)).toMatchObject({ status: 405 });
    } finally {
      fixture.close();
    }
  });

  it('serves D1-backed direct-price comparisons and an assessment-scoped XLSX export', async () => {
    const transactions = [
      { id: 'DP-1', po_number: 'PO-1', po_date: '2025-04-01', vendor_code: 'S1', vendor_name: 'Supplier 1',
        material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 0,
        total_spend_inr: 100000, plant: 'P1', spend_category: 'Resin' },
      { id: 'DP-2', po_number: 'PO-2', po_date: '2025-05-01', vendor_code: 'S2', vendor_name: 'Supplier 2',
        material_code: 'M1', material_desc: 'Resin', quantity: 10, uom: 'KG', unit_price: 0,
        total_spend_inr: 200000, plant: 'P2', spend_category: 'Resin' }
    ];
    const db = mockDb({ transactions });
    const request = req('/sourcing/direct-price-improvement?assessmentId=A-2&financialYear=FY2025-26');
    const result = await handleModule2Route(db, '/sourcing/direct-price-improvement', request, new URL(request.url));
    expect(result.data).toMatchObject({
      assessmentId: 'A-2', actualSpendInr: 300000, totalEligibleTransactions: 2,
      historicalLostOpportunityInr: 100000, commerciallyValidatedSavingsInr: 0
    });

    const exportRequest = req('/sourcing/direct-price-improvement/export-excel?assessmentId=A-2');
    const exportResult = await handleModule2Route(
      db, '/sourcing/direct-price-improvement/export-excel', exportRequest, new URL(exportRequest.url)
    );
    const workbook = XLSX.read(new Uint8Array(await exportResult.response!.arrayBuffer()), { type: 'array' });
    expect(exportResult.response?.headers.get('Content-Type')).toContain('spreadsheetml.sheet');
    expect(exportResult.response?.headers.get('Content-Disposition')).toContain('Direct_Price_History_A-2.xlsx');
    expect(workbook.SheetNames).toEqual(['Summary', 'Categories', 'Materials', 'Transactions']);

    const invalid = req('/sourcing/direct-price-improvement?assessmentId=A-2&financialYear=FY2025');
    expect(await handleModule2Route(db, '/sourcing/direct-price-improvement', invalid, new URL(invalid.url)))
      .toMatchObject({ status: 400, data: { success: false } });
    const unscoped = req('/sourcing/direct-price-improvement');
    expect(await handleModule2Route(db, '/sourcing/direct-price-improvement', unscoped, new URL(unscoped.url)))
      .toMatchObject({ status: 409, data: { success: false } });
  });

  it('serves assessment-scoped payment-term coverage and an eight-sheet XLSX audit', async () => {
    const transactions = [
      { record_id: 'PT-1', po_number: 'PO-1', po_date: '2026-01-01', supplier_code: 'SUP-1',
        supplier_name: 'Supplier One', spend_category: 'Resin', spend_inr: 100000,
        raw_json: JSON.stringify({ 'Terms of Payment': 'Net 45 Days' }) },
      { record_id: 'PT-2', po_number: 'PO-2', po_date: '2026-02-01', supplier_code: 'SUP-2',
        supplier_name: 'Supplier Two', spend_category: 'Resin', spend_inr: 50000,
        raw_json: JSON.stringify({ invoiceDate: '2026-02-01' }) }
    ];
    const db = mockDb({ transactions });
    const request = req('/sourcing/payment-terms?assessmentId=PT-ASSESSMENT');
    const result = await handleModule2Route(db, '/sourcing/payment-terms', request, new URL(request.url));
    expect(result.data).toMatchObject({
      assessmentId: 'PT-ASSESSMENT',
      coverageSummary: {
        totalSpendAnalysedInr: 150000, verifiedSpendInr: 100000, missingSpendInr: 50000,
        reconciliationDeltaInr: 0, totalFinancingBenefitCr: 0
      },
      opportunities: []
    });
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id = ?'));
    expect(MODULE2_D1_PENDING_ROUTES.has('/payment-terms')).toBe(false);

    const exportRequest = req('/sourcing/payment-terms/export-excel?assessmentId=PT-ASSESSMENT');
    const exportResult = await handleModule2Route(
      db, '/sourcing/payment-terms/export-excel', exportRequest, new URL(exportRequest.url)
    );
    const workbook = XLSX.read(new Uint8Array(await exportResult.response!.arrayBuffer()), { type: 'array' });
    expect(workbook.SheetNames).toHaveLength(8);
    expect(exportResult.response?.headers.get('Content-Disposition'))
      .toContain('Payment_Terms_PT-ASSESSMENT.xlsx');

    const unscoped = req('/sourcing/payment-terms');
    expect(await handleModule2Route(db, '/sourcing/payment-terms', unscoped, new URL(unscoped.url)))
      .toMatchObject({ status: 409, data: { success: false } });
  });

  it('serves assessment-scoped vendor consolidation from D1 and exports the filtered review workbook', async () => {
    const transactions = [
      { id: 'VC-1', po_number: 'PO-1', po_line: '1', po_date: '2026-01-01', vendor_code: 'SUP-1',
        vendor_name: 'Supplier One', material_code: 'MAT-1', material_desc: 'Resin', quantity: 10,
        uom: 'KG', unit_price: 10, total_spend_inr: 100, currency: 'INR', plant: 'P1',
        spend_category: 'Resin', unspsc_code: '12345678', unspsc_category: 'Resins' },
      { id: 'VC-2', po_number: 'PO-2', po_line: '1', po_date: '2026-02-01', vendor_code: 'SUP-2',
        vendor_name: 'Supplier Two', material_code: 'MAT-1', material_desc: 'Resin', quantity: 10,
        uom: 'KG', unit_price: 12, total_spend_inr: 120, currency: 'INR', plant: 'P2',
        spend_category: 'Resin', unspsc_code: '12345678', unspsc_category: 'Resins' }
    ];
    const db = mockDb({ transactions });
    const request = req('/sourcing/vendor-consolidation?assessmentId=VC-ASSESSMENT&category=Resin');
    const result = await handleModule2Route(db, '/sourcing/vendor-consolidation', request, new URL(request.url));
    expect(result.data).toMatchObject({
      assessmentId: 'VC-ASSESSMENT', totalAssessmentSpendInr: 220,
      sameMaterialMultiSourcingSpendInr: 220, estimatedSavingsInr: null,
      sameMaterialOpportunities: [expect.objectContaining({ materialCode: 'MAT-1', supplierCount: 2 })]
    });
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id = ?'));
    expect(MODULE2_D1_PENDING_ROUTES.has('/vendor-consolidation/export-excel')).toBe(false);

    const exportRequest = req('/sourcing/vendor-consolidation/export-excel?assessmentId=VC-ASSESSMENT&category=Resin');
    const exportResult = await handleModule2Route(
      db, '/sourcing/vendor-consolidation/export-excel', exportRequest, new URL(exportRequest.url)
    );
    const workbook = XLSX.read(new Uint8Array(await exportResult.response!.arrayBuffer()), { type: 'array' });
    expect(workbook.SheetNames).toHaveLength(8);
    expect(workbook.SheetNames).toContain('Transaction Sample');
    expect(exportResult.response?.headers.get('Content-Disposition'))
      .toContain('Vendor_Consolidation_VC-ASSESSMENT.xlsx');

    const invalid = req('/sourcing/vendor-consolidation?assessmentId=VC-ASSESSMENT&status=APPROVED');
    expect(await handleModule2Route(db, '/sourcing/vendor-consolidation', invalid, new URL(invalid.url)))
      .toMatchObject({ status: 400, data: { success: false } });
    const unscoped = req('/sourcing/vendor-consolidation');
    expect(await handleModule2Route(db, '/sourcing/vendor-consolidation', unscoped, new URL(unscoped.url)))
      .toMatchObject({ status: 409, data: { success: false } });
  });

  it('requires an assessment identifier for volume aggregation', async () => {
    const db = mockDb();
    const request = req('/sourcing/volume-aggregation');
    expect(await handleModule2Route(db, '/sourcing/volume-aggregation', request, new URL(request.url)))
      .toMatchObject({ status: 409, data: { success: false, message: expect.stringContaining('Select an assessment') } });
  });

  it('handles /canonical-input, /line-items, /handoff, /export, and /consolidated-savings', async () => {
    const db = mockDb();
    const canonicalRequest = req('/sourcing/canonical-input?tenantId=T1');
    const canonical = await handleModule2Route(db, '/sourcing/canonical-input', canonicalRequest, new URL(canonicalRequest.url));
    expect(canonical.data).toHaveLength(1);

    const unscopedCanonicalRequest = req('/sourcing/canonical-input');
    expect(await handleModule2Route(
      db, '/sourcing/canonical-input', unscopedCanonicalRequest, new URL(unscopedCanonicalRequest.url)
    )).toMatchObject({ status: 403, data: { success: false } });

    const lineItemsRequest = req('/sourcing/line-items?tenantId=T1');
    const lineItems = await handleModule2Route(db, '/sourcing/line-items', lineItemsRequest, new URL(lineItemsRequest.url));
    expect(lineItems.data).toHaveProperty('lineItems', [expect.objectContaining({ mapping_id: 'TX-1' })]);

    const handoff = await handleModule2Route(db, '/sourcing/handoff', req('/sourcing/handoff'), new URL('https://consulting.edge/api/module2/sourcing/handoff'));
    expect(handoff).toEqual({ status: 409, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.handoffScope } });

    const exp = await handleModule2Route(db, '/sourcing/export', req('/sourcing/export'), new URL('https://consulting.edge/api/module2/sourcing/export'));
    expect(exp).toMatchObject({ status: 409, data: { success: false } });

    const savings = await handleModule2Route(db, '/sourcing/consolidated-savings', req('/sourcing/consolidated-savings'), new URL('https://consulting.edge/api/module2/sourcing/consolidated-savings'));
    expect(savings.data).toHaveProperty('success', true);

    const fallback = await handleModule2Route(db, '/unknown-route', req('/unknown-route'), new URL('https://consulting.edge/api/module2/unknown-route'));
    expect(fallback).toEqual({ status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown } });
  });

  it('rethrows unexpected D1 failures after request-body parsing', async () => {
    const database = {
      prepare: () => { throw new Error('D1 query failed unexpectedly'); }
    } as unknown as CloudflareD1Database;
    const request = req('/sourcing/canonical-input?tenantId=T1');

    await expect(handleModule2Route(
      database, '/sourcing/canonical-input', request, new URL(request.url)
    )).rejects.toThrow('D1 query failed unexpectedly');
  });

  it('exports an assessment-scoped audit dossier from persisted transaction evidence', async () => {
    const db = mockDb({ transactions: [{
      id: 'TX-AUDIT-1', vendor_name: 'Supplier A', material_desc: 'Resin', quantity: 2,
      unit_price: 50, total_spend_inr: 100, po_number: 'PO-1', vendor_code: 'SUP-1',
      material_code: 'MAT-1', uom: 'KG', currency: 'INR', plant: 'P1', spend_category: 'Resin'
    }] });
    const request = req('/sourcing/export?assessmentId=A-1&tenantId=T-1');
    const result = await handleModule2Route(db, '/sourcing/export', request, new URL(request.url));

    expect(result.data).toMatchObject({
      success: true,
      dossier: {
        assessmentId: 'A-1', tenantId: 'T-1',
        source: { system: 'Cloudflare D1', table: 'ProcurementTransaction', includedRecords: 1, includedSpendInr: 100 },
        analysis: { summary: { totalSpendAnalyzedInr: 100 }, categoryProfiles: expect.any(Array),
          opportunityLedger: expect.any(Array), handoffPackages: expect.any(Array) }
      }
    });
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id = ? AND tenant_id = ?'));
    expect(vi.mocked(db.prepare).mock.calls.some(([sql]) => sql.includes('SavingsOpportunity'))).toBe(false);
  });

  it('does not return read data as a successful mutation or report an export that was never created', async () => {
    const database = mockDb();
    for (const path of MODULE2_D1_PENDING_ROUTES) {
      const request = req(path, { method: path.includes('update') || path.includes('review') ? 'POST' : 'GET' });
      expect(await handleModule2Route(database, path, request, new URL(request.url))).toEqual({
        status: 501, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.pending }
      });
    }
    const request = req('/dashboard', { method: 'POST' });
    expect(await handleModule2Route(database, '/dashboard', request, new URL(request.url))).toEqual({
      status: 405, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.method }
    });
    for (const path of ['/attribution-ledger', '/supplier-risk', '/po-consolidation', '/recurring-spend']) {
      const unscopedRequest = req(path);
      expect(await handleModule2Route(database, `/sourcing${path}`, unscopedRequest, new URL(unscopedRequest.url)))
        .toEqual({ status: 409, data: { success: false, message: expect.stringContaining('Select an assessment') } });
    }
    expect(database.prepare).not.toHaveBeenCalled();
  });

  it('normalizes the root path and rejects unsupported assessment-scoped lever subroutes', async () => {
    const database = mockDb();
    const rootRequest = req('/');
    expect(await handleModule2Route(database, '', rootRequest, new URL(rootRequest.url))).toEqual({
      status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown }
    });

    for (const path of ['/sourcing/vendor-consolidation/unsupported', '/sourcing/payment-terms/unsupported']) {
      const request = req(`${path}?assessmentId=ASSESSMENT-1`);
      expect(await handleModule2Route(database, path, request, new URL(request.url))).toEqual({
        status: 404, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.unknown }
      });
    }
  });

  it('serves alternate sourcing only from the selected assessment and D1 directory aggregates', async () => {
    const transactionRows = [{
      id: 'TX-1', vendor_name: 'Current Supplier', material_desc: 'Resin component', quantity: 10,
      unit_price: 20, total_spend_inr: 200, po_number: 'PO-1', po_line: '1', po_date: '2026-01-01',
      vendor_code: 'SUP-1', material_code: 'MAT-1', uom: 'KG', currency: 'INR', plant: 'P1',
      spend_category: 'Resin', unspsc_code: '12345678', unspsc_category: 'Resin'
    }];
    const indexRows = [{ category_key: 'resin', payload_json: JSON.stringify({
      categoryName: 'Resin', distinctVendorCount: 3,
      stateCounts: { MAHARASHTRA: 2, GUJARAT: 1 }, topCities: [{ city: 'MUMBAI', count: 1 }],
      contactMetrics: { hasWebsiteCount: 2, hasEmailCount: 2, hasPhoneCount: 3, missingContactCount: 0 }
    }) }];
    const prepare = vi.fn((sql: string) => {
      const allFor = (values: unknown[] = []) => {
        if (sql.includes('AssessmentRecord') && sql.includes('WHERE assessment_id = ? AND tenant_id = ?')) {
          return { results: [{ assessment_id: values[0], tenant_id: values[1] }] };
        }
        if (sql.includes('ProcurementTransaction')) return { results: transactionRows };
        if (sql.includes('AlternateVendorIndex')) return { results: indexRows };
        if (sql.includes('AlternateVendorCompany')) return { results: [{ distinct_vendor_count: 3, record_count: 3 }] };
        if (sql.includes('ProcurementCategoryMapping')) return { results: [
          { material_group_code: 'RESIN', category_name: 'Resin' }
        ] };
        return { results: values.length ? [] : [] };
      };
      const statement = {
        bind: vi.fn((...values: unknown[]) => ({
          all: vi.fn(async () => allFor(values)),
          first: vi.fn(async () => ({ ok: 1 }))
        })),
        all: vi.fn(async () => allFor()),
        first: vi.fn(async () => ({ ok: 1 }))
      };
      return statement;
    });
    const database = { prepare } as unknown as CloudflareD1Database;
    const validRequest = req('/sourcing/alternate-sourcing?assessmentId=A1');
    const result = await handleModule2Route(database, '/sourcing/alternate-sourcing', validRequest,
      new URL(validRequest.url));
    expect(result.data).toMatchObject({
      assessmentId: 'A1', summary: { totalEligibleMaterials: 1, potentialFinancialSavingsInr: 0 },
      opportunities: [expect.objectContaining({
        materialCode: 'MAT-1', currentSuppliers: ['Current Supplier'], potentialVendorsAllLocations: 3,
        qualificationStatus: 'DATA_UNAVAILABLE'
      })]
    });
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id = ?'));
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('FROM AlternateVendorIndex'));
    expect(MODULE2_D1_PENDING_ROUTES.has('/alternate-sourcing')).toBe(false);
    const noScope = req('/sourcing/alternate-sourcing');
    expect(await handleModule2Route(database, '/sourcing/alternate-sourcing', noScope, new URL(noScope.url)))
      .toMatchObject({ status: 409 });
    const invalidFilter = req('/sourcing/alternate-sourcing?assessmentId=A1&geographicPreference=SAME_STATE');
    expect(await handleModule2Route(database, '/sourcing/alternate-sourcing', invalidFilter,
      new URL(invalidFilter.url))).toMatchObject({ status: 400 });
    const unknown = req('/sourcing/alternate-sourcing/export-excel?assessmentId=A1');
    expect(await handleModule2Route(database, '/sourcing/alternate-sourcing/export-excel', unknown,
      new URL(unknown.url))).toMatchObject({ status: 404 });
    const mutation = req('/sourcing/alternate-sourcing?assessmentId=A1', { method: 'POST' });
    expect(await handleModule2Route(database, '/sourcing/alternate-sourcing', mutation,
      new URL(mutation.url))).toMatchObject({ status: 405 });
  });
});
