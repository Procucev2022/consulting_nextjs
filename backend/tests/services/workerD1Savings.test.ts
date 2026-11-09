import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkerDatabase, insertRows, type WorkerDatabaseFixture } from '../helpers/workerCoreFixtures';
import { loadSavingsFromD1, updateActionPlanInD1, updateOpportunityStatusInD1 } from '../../src/services/workerD1Savings';
import { D1_LOG_FALLBACKS } from '../../src/constants/d1';
import { SAVINGS_D1_LOG_ACTIONS, SAVINGS_D1_LOG_MESSAGES, SAVINGS_D1_MESSAGES } from '../../src/constants/savingsD1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import logger from '../../src/utils/logger';

vi.mock('../../src/utils/logger', () => ({ default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

let fixture: WorkerDatabaseFixture;

beforeEach(() => { fixture = createWorkerDatabase(); });
afterEach(() => { fixture.close(); });

const insertActionPlan = (
  id: string,
  oppId: string,
  owner: string,
  status: string,
  quarter = 'Q4 2026'
): void => {
  insertRows(fixture.db,
    'INSERT INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?) ON CONFLICT(tenant_id) DO NOTHING',
    [['TNT-1', 'TNT-1']]);
  insertRows(fixture.db,
    'INSERT OR IGNORE INTO SavingsOpportunity (opp_id, category) VALUES (?, ?)', [[oppId, 'Chemicals']]);
  insertRows(fixture.db,
    'INSERT OR IGNORE INTO SavingsOpportunityTenantScope (opp_id, tenant_id) VALUES (?, ?)', [[oppId, 'TNT-1']]);
  insertRows(fixture.db,
    'INSERT INTO ActionPlanItem (id, opp_id, title, lever, category, est_savings_inr_cr, owner, quarter, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [[id, oppId, `Action ${id}`, 'Direct Price Renegotiation', 'Chemicals', 0.5, owner, quarter, status, '2026-01-01', '2026-01-02']]);
};

const insertOpportunity = (overrides: Record<string, string | number | null>, tenantId = 'TNT-1'): void => {
  insertRows(fixture.db,
    'INSERT INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?) ON CONFLICT(tenant_id) DO NOTHING',
    [[tenantId, tenantId]]);
  const row = {
    opp_id: 'OPP-1', category: 'Chemicals', title: 'Price alignment', current_spend: 100000000,
    current_spend_inr_cr: 10, target_savings_pct: 5, est_savings: 5000000, est_savings_inr_cr: 0.5,
    lever: 'Direct Price Renegotiation', recommended_action: 'Align the rate', push_to_module: 'proCPX',
    status: 'Identified', contract_leak_type: 'Price variance', ...overrides
  };
  insertRows(fixture.db,
    'INSERT INTO SavingsOpportunity (opp_id, category, title, current_spend, current_spend_inr_cr, target_savings_pct, est_savings, est_savings_inr_cr, lever, recommended_action, push_to_module, status, contract_leak_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [[row.opp_id, row.category, row.title, row.current_spend, row.current_spend_inr_cr, row.target_savings_pct,
      row.est_savings, row.est_savings_inr_cr, row.lever, row.recommended_action, row.push_to_module, row.status,
      row.contract_leak_type]]);
  insertRows(fixture.db, 'INSERT INTO SavingsOpportunityTenantScope (opp_id, tenant_id) VALUES (?, ?)', [[row.opp_id, tenantId]]);
};

describe('D1 savings reads', () => {
  it('returns savings pipeline data, persisted action plans and lifecycle metrics from D1', async () => {
    const workflowStatuses = ['Identified', 'Under Validation', 'Validated', 'Approved', 'Implementing', 'Realized', 'Rejected', 'Deferred'];
    workflowStatuses.forEach((status, index) => insertOpportunity({ opp_id: `OPP-${index + 1}`, status, est_savings_inr_cr: 1, est_savings: 10000000 }));
    insertOpportunity({ opp_id: 'OPP-OTHER', est_savings_inr_cr: 99, est_savings: 990000000 }, 'TNT-OTHER');
    insertActionPlan('ACT-1', 'OPP-1', 'Finance', 'IN_PROGRESS');
    insertRows(fixture.db,
      'INSERT INTO ActionPlanItemDetails (action_id, target_date, priority, comments) VALUES (?, ?, ?, ?)',
      [['ACT-1', '2026-12-15', 'HIGH', 'Benchmark review']]);
    insertActionPlan('ACT-2', 'OPP-2', 'Unknown Owner', 'COMPLETED');
    insertRows(fixture.db,
      'INSERT INTO ActionPlanItemDetails (action_id, target_date, priority, comments) VALUES (?, ?, ?, ?)',
      [['ACT-2', null, 'LOW', null]]);
    insertActionPlan('ACT-3', 'OPP-3', 'SCM', 'unexpected');
    insertRows(fixture.db,
      'INSERT INTO ActionPlanItemDetails (action_id, target_date, priority, comments) VALUES (?, ?, ?, ?)',
      [['ACT-3', null, 'MEDIUM', null]]);
    insertRows(fixture.db,
      'INSERT INTO AssessmentRecord (assessment_id, customer_id, customer_name, industry, assessment_owner, total_spend_cr, addressable_spend_cr, overlap_deductions_cr, proven_opportunity_cr, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [['AIC-1', 'C-1', 'Client', 'Chemicals', 'analyst', 20, 12, 1.5, 3.5, '2026-01-01']]);

    const data = await loadSavingsFromD1(fixture.d1, 'TNT-1') as {
      opportunities: Array<Record<string, unknown>>;
      actionPlans: Array<Record<string, unknown>>;
      waterfallMetrics: Record<string, number>;
    };

    expect(data.opportunities).toHaveLength(8);
    expect(data.opportunities.map((row) => row.opportunity_id)).not.toContain('OPP-OTHER');
    expect(data.opportunities.map((row) => row.status)).toEqual([
      'IDENTIFIED', 'UNDER_VALIDATION', 'VALIDATED', 'APPROVED', 'IMPLEMENTING', 'REALIZED', 'REJECTED', 'DEFERRED'
    ]);
    expect(data.opportunities[0]).toMatchObject({ source_engine: 'PRICE_DISPERSION', owner: 'Finance' });
    expect(data.actionPlans).toHaveLength(3);
    expect(data.actionPlans[0]).toMatchObject({ status: 'In Progress', target_date: '2026-12-15', priority: 'HIGH', comments: 'Benchmark review' });
    expect(data.actionPlans[1]).toMatchObject({ status: 'Completed', owner: 'Procurement', priority: 'LOW', target_date: '' });
    expect(data.actionPlans[2]).toMatchObject({ status: 'Open', priority: 'MEDIUM' });
    expect(data.waterfallMetrics).toMatchObject({
      total_spend_inr_cr: 80, addressable_spend_inr_cr: 80, identified_opportunities_count: 8,
      gross_potential_savings_inr_cr: 8, deduplicated_overlap_inr_cr: 0, net_potential_savings_inr_cr: 8,
      proven_opportunity_inr_cr: 0, discovery_opportunity_inr_cr: 8,
      validated_savings_inr_cr: 4, approved_savings_inr_cr: 3, realized_savings_inr_cr: 1
    });
  });

  it('uses persisted opportunity values when columns are missing and returns zero summaries without seeded rows', async () => {
    insertOpportunity({
      opp_id: 'OPP-EDGE', title: null, current_spend: 10000000, current_spend_inr_cr: null,
      est_savings: 1000000, est_savings_inr_cr: null, lever: 'unrecognized', status: 'future',
      recommended_action: null, contract_leak_type: null
    });
    const populated = await loadSavingsFromD1(fixture.d1, 'TNT-1') as {
      opportunities: Array<Record<string, unknown>>; waterfallMetrics: Record<string, number>;
    };
    expect(populated.opportunities[0]).toMatchObject({
      item: 'Chemicals', source_engine: 'OTHER_STRATEGIC', status: 'IDENTIFIED', spend_inr_cr: 1,
      potential_savings_inr_cr: 0.1, timeline: ''
    });
    expect(populated.opportunities[0]).not.toHaveProperty('validation_notes');
    expect(populated.waterfallMetrics).toMatchObject({ total_spend_inr_cr: 1, addressable_spend_inr_cr: 1 });

    fixture.db.exec('DELETE FROM SavingsOpportunityTenantScope');
    fixture.db.exec('DELETE FROM SavingsOpportunity');
    const empty = await loadSavingsFromD1(fixture.d1, 'TNT-1') as {
      opportunities: unknown[]; actionPlans: unknown[]; overlaps: unknown[]; waterfallMetrics: Record<string, number>;
    };
    expect(empty).toMatchObject({ opportunities: [], actionPlans: [], overlaps: [], totalGrossSavingsCr: 0 });
    expect(empty.waterfallMetrics).toMatchObject({ identified_opportunities_count: 0, net_potential_savings_inr_cr: 0 });
  });
});

describe('D1 savings updates', () => {
  it('rejects invalid, empty and missing action-plan updates', async () => {
    expect(await updateActionPlanInD1(fixture.d1, { actionId: '' }, 'TNT-1')).toMatchObject({ status: 400 });
    expect(await updateActionPlanInD1(fixture.d1, { actionId: 'ACT-1' }, 'TNT-1')).toMatchObject({ status: 400 });
    expect(await updateActionPlanInD1(fixture.d1, { actionId: 'ACT-404', owner: 'Procurement' }, 'TNT-1')).toMatchObject({ status: 404 });
  });

  it('persists owner and status updates and preserves plan details', async () => {
    insertActionPlan('ACT-1', 'OPP-1', 'Procurement', 'PLANNED');
    insertRows(fixture.db, 'INSERT INTO ActionPlanItemDetails (action_id, target_date, priority, comments) VALUES (?, ?, ?, ?)', [
      ['ACT-1', '2026-12-31', 'HIGH', 'Current comment']
    ]);
    const result = await updateActionPlanInD1(fixture.d1, { actionId: 'ACT-1', owner: 'Finance', status: 'Completed' }, 'TNT-1');
    expect(result).toMatchObject({ data: { owner: 'Finance', status: 'Completed', target_date: '2026-12-31', priority: 'HIGH', comments: 'Current comment' } });
  });

  it('persists comments alone with a database default priority and supports atomic D1 batches', async () => {
    insertActionPlan('ACT-1', 'OPP-1', 'Procurement', 'PLANNED');
    const result = await updateActionPlanInD1(fixture.d1, { actionId: 'ACT-1', comments: 'Needs review' }, 'TNT-1');
    expect(result).toMatchObject({ data: { comments: 'Needs review', priority: 'MEDIUM' } });

    const batchDb: CloudflareD1Database = {
      prepare: (query) => fixture.d1.prepare(query),
      batch: async (statements) => {
        fixture.db.exec('BEGIN');
        try {
          const outputs: unknown[] = [];
          for (const statement of statements) outputs.push(await statement.run());
          fixture.db.exec('COMMIT');
          return outputs;
        } catch (error) {
          fixture.db.exec('ROLLBACK');
          throw error;
        }
      }
    };
    const batched = await updateActionPlanInD1(batchDb, { actionId: 'ACT-1', owner: 'SCM', priority: 'LOW' }, 'TNT-1');
    expect(batched).toMatchObject({ data: { owner: 'SCM', priority: 'LOW', comments: 'Needs review' } });
  });

  it('allows a single no-batch update and rejects multi-statement updates before any write', async () => {
    insertActionPlan('ACT-1', 'OPP-1', 'Procurement', 'PLANNED');
    const noBatchDb = { prepare: (query: string) => fixture.d1.prepare(query) } as CloudflareD1Database;
    const requestId = 'req-savings-atomic';
    vi.mocked(logger.error).mockClear();

    const singleUpdate = await updateActionPlanInD1(noBatchDb, { actionId: 'ACT-1', owner: 'Finance' }, 'TNT-1');
    expect(singleUpdate).toMatchObject({ data: { owner: 'Finance', status: 'Open' } });

    const multiUpdate = await updateActionPlanInD1(
      noBatchDb, { actionId: 'ACT-1', status: 'Completed', priority: 'LOW' }, 'TNT-1', requestId
    );

    expect(multiUpdate).toEqual({
      status: 503,
      data: { success: false, message: SAVINGS_D1_MESSAGES.actionPlanBatchUnavailable }
    });
    expect(fixture.db.prepare('SELECT owner, status FROM ActionPlanItem WHERE id = ?').get('ACT-1')).toEqual({
      owner: 'Finance', status: 'PLANNED'
    });
    expect(fixture.db.prepare('SELECT priority FROM ActionPlanItemDetails WHERE action_id = ?').get('ACT-1')).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      SAVINGS_D1_LOG_MESSAGES.actionPlanBatchUnavailable,
      expect.objectContaining({
        action: SAVINGS_D1_LOG_ACTIONS.actionPlanBatchUnavailable,
        requestId,
        actionId: 'ACT-1',
        tenantId: 'TNT-1',
        statementCount: 2,
        writesStarted: false,
        fallback: D1_LOG_FALLBACKS.failClosed
      }),
      expect.objectContaining({ message: SAVINGS_D1_MESSAGES.actionPlanBatchUnavailable })
    );
  });

  it('validates opportunity status writes and rejects missing records', async () => {
    expect(await updateOpportunityStatusInD1(fixture.d1, { opp_id: '', status: 'UNKNOWN' }, 'TNT-1')).toMatchObject({ status: 400 });
    expect(await updateOpportunityStatusInD1(fixture.d1, { opp_id: 'OPP-404', status: 'APPROVED' }, 'TNT-1')).toMatchObject({ status: 404 });
    insertOpportunity({ opp_id: 'OPP-1' });
    expect(await updateOpportunityStatusInD1(fixture.d1, { opp_id: 'OPP-1', status: 'APPROVED' }, 'TNT-1'))
      .toMatchObject({ data: { opp_id: 'OPP-1', status: 'APPROVED' } });
  });

  it('does not update an action plan through a different tenant scope', async () => {
    insertActionPlan('ACT-1', 'OPP-1', 'Procurement', 'PLANNED');

    expect(await updateActionPlanInD1(fixture.d1, { actionId: 'ACT-1', status: 'Completed' }, 'TNT-OTHER'))
      .toMatchObject({ status: 404 });
    expect(fixture.db.prepare('SELECT status FROM ActionPlanItem WHERE id = ?').get('ACT-1')).toEqual({ status: 'PLANNED' });
  });

  it('does not update an opportunity through a different tenant scope', async () => {
    insertOpportunity({ opp_id: 'OPP-1' });

    expect(await updateOpportunityStatusInD1(fixture.d1, { opp_id: 'OPP-1', status: 'APPROVED' }, 'TNT-OTHER'))
      .toMatchObject({ status: 404 });
    expect(fixture.db.prepare('SELECT status FROM SavingsOpportunity WHERE opp_id = ?').get('OPP-1'))
      .toEqual({ status: 'Identified' });
  });
});
