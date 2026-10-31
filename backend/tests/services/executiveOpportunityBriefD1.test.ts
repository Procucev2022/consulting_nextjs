import { describe, expect, it } from 'vitest';
import { EXECUTIVE_OPPORTUNITY_BRIEF_SQL } from '../../src/constants/executiveOpportunityBriefConstants';
import { loadExecutiveOpportunityBriefFromD1 } from '../../src/services/executiveOpportunityBriefD1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';

interface TestDbOptions {
  tenants?: Array<Record<string, unknown>>;
  transaction?: Record<string, unknown> | null;
  opportunityMetrics?: Record<string, unknown> | null;
  opportunities?: Array<Record<string, unknown>>;
  groups?: Array<Record<string, unknown>>;
  undefinedResults?: boolean;
}

const makeDatabase = (options: TestDbOptions = {}): CloudflareD1Database => ({
  prepare(query: string) {
    const statement = {
      bind: (_tenantId: unknown) => statement,
      async first<T>(): Promise<T | null> {
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.transactionMetrics) {
          return (options.transaction ?? null) as T | null;
        }
        return (options.opportunityMetrics ?? null) as T | null;
      },
      async all<T>(): Promise<{ results: T[] }> {
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenants) return { results: (options.tenants ?? []) as T[] };
        if (options.undefinedResults) return { results: undefined as unknown as T[] };
        if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities) return { results: (options.opportunities ?? []) as T[] };
        return { results: (options.groups ?? []) as T[] };
      },
      async run(): Promise<unknown> { return {}; }
    };
    return statement;
  }
});

const defaultTransaction = (): Record<string, unknown> => ({
  transaction_count: '3', total_spend_cr: '12.5', supplier_count: '2', material_count: '4',
  plant_count: '1', purchase_order_count: '2', first_transaction_date: '2024-01-01', last_transaction_date: '2025-01-01'
});

describe('loadExecutiveOpportunityBriefFromD1', () => {
  it('requires a single tenant and a non-empty procurement baseline', async () => {
    expect(await loadExecutiveOpportunityBriefFromD1(makeDatabase({ tenants: [] }))).toEqual({ ok: false, reason: 'no-tenant' });
    expect(await loadExecutiveOpportunityBriefFromD1(makeDatabase({ tenants: [{}, {}] }))).toEqual({
      ok: false,
      reason: 'ambiguous-tenant'
    });
    expect(await loadExecutiveOpportunityBriefFromD1(makeDatabase({
      tenants: [{ tenant_id: 'T1', enterprise_name: 'Enterprise' }],
      transaction: null
    }))).toEqual({ ok: false, reason: 'no-transactions' });
    expect(await loadExecutiveOpportunityBriefFromD1(makeDatabase({
      tenants: [{ tenant_id: 'T1', enterprise_name: 'Enterprise' }],
      transaction: { ...defaultTransaction(), transaction_count: '0' }
    }))).toEqual({ ok: false, reason: 'no-transactions' });
  });

  it('normalizes D1 numeric values and nullable opportunity fields into a report', async () => {
    const result = await loadExecutiveOpportunityBriefFromD1(makeDatabase({
      tenants: [{ tenant_id: 'T1', enterprise_name: 'Enterprise' }],
      transaction: {
        ...defaultTransaction(), total_spend_cr: 'not-a-number', first_transaction_date: null, last_transaction_date: null
      },
      opportunityMetrics: { opportunity_count: '1', estimated_savings_cr: '2.25', average_confidence: '0.8' },
      opportunities: [{
        opp_id: 'O1', category: 'Materials', title: null, current_spend_cr: null, estimated_savings_cr: '2.25',
        lever: ' ', recommended_action: null, status: null, risk_level: null, confidence_score: null
      }],
      groups: [{ label: ' ', record_count: 'invalid', estimated_savings_cr: '3.5' }]
    }), new Date('2026-10-30T00:00:00.000Z'));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.generatedAt).toBe('2026-10-30T00:00:00.000Z');
    expect(result.report.metrics.totalSpendCr).toBe(0);
    expect(result.report.metrics.firstTransactionDate).toBeNull();
    expect(result.report.metrics.lastTransactionDate).toBeNull();
    expect(result.report.metrics.estimatedSavingsCr).toBe(2.25);
    expect(result.report.opportunities[0]).toMatchObject({
      title: 'Materials', currentSpendCr: 0, lever: 'Unspecified', status: 'Unspecified', riskLevel: 'Unspecified', confidence: 0
    });
    expect(result.report.levers[0]).toMatchObject({ label: 'Unspecified', count: 0, estimatedSavingsCr: 3.5 });
    expect(result.report.statuses[0].label).toBe('Unspecified');
    expect(result.report.risks[0].estimatedSavingsCr).toBe(3.5);
  });

  it('uses empty collections and zero opportunity metrics when D1 query results are empty', async () => {
    const result = await loadExecutiveOpportunityBriefFromD1(makeDatabase({
      tenants: [{ tenant_id: 'T1', enterprise_name: 'Enterprise' }],
      transaction: defaultTransaction(),
      undefinedResults: true
    }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.metrics.opportunityCount).toBe(0);
    expect(result.report.metrics.estimatedSavingsCr).toBe(0);
    expect(result.report.opportunities).toEqual([]);
    expect(result.report.levers).toEqual([]);
    expect(result.report.statuses).toEqual([]);
    expect(result.report.risks).toEqual([]);
  });
});
