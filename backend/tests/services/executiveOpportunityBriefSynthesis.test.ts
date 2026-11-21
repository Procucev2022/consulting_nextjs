import { describe, expect, it } from 'vitest';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES,
  EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../../src/constants/executiveOpportunityBriefConstants';
import {
  buildMaterialGroupOpportunities,
  queryBaselineOpportunityData,
  queryGroups,
  queryMaterialGroups,
  resolveScopeClassification,
  resolveScopeDescription,
  toDataClassification,
  toGroup,
  toOpportunity
} from '../../src/services/executiveOpportunityBriefSynthesis';
import type { CloudflareD1Database } from '../../src/types/cloudflare';

describe('executiveOpportunityBriefSynthesis', () => {
  it('normalizes classification and scope description accurately', () => {
    expect(toDataClassification('DEMO_ONLY')).toBe('DEMO_ONLY');
    expect(toDataClassification('MIXED')).toBe('MIXED');
    expect(toDataClassification('CUSTOMER_DATA')).toBe('CUSTOMER_DATA');
    expect(toDataClassification('UNKNOWN')).toBe('CUSTOMER_DATA');
    expect(toDataClassification(null)).toBe('CUSTOMER_DATA');

    expect(resolveScopeDescription('DEMO_ONLY', false)).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.demoScope);
    expect(resolveScopeDescription('MIXED', false)).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.mixedScope);
    expect(resolveScopeDescription('CUSTOMER_DATA', true)).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.assessmentScope);
    expect(resolveScopeDescription('CUSTOMER_DATA', false)).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.customerScope);
  });

  it('maps group and opportunity rows with fallback values', () => {
    expect(toGroup({ label: 'Group 1', record_count: 5, estimated_savings_cr: 1.2 })).toEqual({
      label: 'Group 1', count: 5, estimatedSavingsCr: 1.2
    });
    expect(toGroup({ label: '', record_count: 'invalid', estimated_savings_cr: null })).toEqual({
      label: 'Unspecified', count: 0, estimatedSavingsCr: 0
    });

    const opp = toOpportunity({
      opp_id: 'OPP-1', category: 'Raw Materials', title: null, current_spend_cr: null,
      estimated_savings_cr: 2.5, lever: null, recommended_action: null, status: null,
      risk_level: null, confidence_score: null
    });
    expect(opp.id).toBe('OPP-1');
    expect(opp.category).toBe('Raw Materials');
    expect(opp.title).toBe('Raw Materials');
    expect(opp.currentSpendCr).toBe(0);
    expect(opp.estimatedSavingsCr).toBe(2.5);
    expect(opp.lever).toBe('Unspecified');
    expect(opp.status).toBe('Unspecified');
  });

  it('queries groups from database using provided query', async () => {
    const mockDb: CloudflareD1Database = {
      prepare() {
        const stmt = {
          bind: () => stmt,
          first: async () => null,
          all: async () => ({ results: [{ label: 'Lever A', record_count: 10, estimated_savings_cr: 5 }] }),
          run: async () => ({})
        };
        return stmt;
      }
    };
    const groups = await queryGroups(mockDb, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.leverBreakdown, 'T1');
    expect(groups.length).toBe(1);
    expect(groups[0].label).toBe('Lever A');
  });

  it('queries material groups for document and assessment scopes and returns empty for baseline', async () => {
    const mockDb: CloudflareD1Database = {
      prepare(query: string) {
        const stmt = {
          bind: () => stmt,
          first: async () => null,
          all: async () => {
            if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.materialGroupsFromDocument) {
              return { results: [{ label: 'Packaging', item_count: 5, spend_cr: 10 }] };
            }
            if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.materialGroupsFromAssessment) {
              return { results: [{ label: 'Maintenance', item_count: 3, spend_cr: 8 }] };
            }
            return { results: [] };
          },
          run: async () => ({})
        };
        return stmt;
      }
    };

    const docGroups = await queryMaterialGroups(mockDb, 'T1', {
      row: null, scopeType: 'DOCUMENT', sourceId: 'DOC-100'
    });
    expect(docGroups.length).toBe(1);
    expect(docGroups[0].label).toBe('Packaging');

    const assessGroups = await queryMaterialGroups(mockDb, 'T1', {
      row: null, scopeType: 'ASSESSMENT', sourceId: 'AIC-200'
    });
    expect(assessGroups.length).toBe(1);
    expect(assessGroups[0].label).toBe('Maintenance');

    const baselineGroups = await queryMaterialGroups(mockDb, 'T1', {
      row: null, scopeType: 'BASELINE'
    });
    expect(baselineGroups).toEqual([]);

    const valFallbackDb: CloudflareD1Database = {
      prepare(query: string) {
        const stmt = {
          bind: () => stmt,
          first: async () => null,
          all: async () => {
            if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.materialGroupsFromValidationDocument) {
              return { results: [{ label: 'Raw Materials', item_count: 8, spend_cr: 45 }] };
            }
            return { results: [] };
          },
          run: async () => ({})
        };
        return stmt;
      }
    };
    const valGroups = await queryMaterialGroups(valFallbackDb, 'T1', {
      row: null, scopeType: 'DOCUMENT', sourceId: 'DOC-VAL-1'
    });
    expect(valGroups.length).toBe(1);
    expect(valGroups[0].label).toBe('Raw Materials');

    const tenantValFallbackDb: CloudflareD1Database = {
      prepare(query: string) {
        const stmt = {
          bind: () => stmt,
          first: async () => null,
          all: async () => {
            if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.materialGroupsFromTenantValidation) {
              return { results: [{ label: 'Logistics', item_count: 4, spend_cr: 22 }] };
            }
            return { results: [] };
          },
          run: async () => ({})
        };
        return stmt;
      }
    };
    const tenantValGroups = await queryMaterialGroups(tenantValFallbackDb, 'T1', {
      row: null, scopeType: 'DOCUMENT', sourceId: 'DOC-TENANT-1'
    });
    expect(tenantValGroups.length).toBe(1);
    expect(tenantValGroups[0].label).toBe('Logistics');
  });

  it('builds synthetic opportunities from material group rows and handles empty group lists', () => {
    const synthesis = buildMaterialGroupOpportunities([
      { label: 'Packaging', item_count: 10, spend_cr: 100 },
      { label: 'Chemicals', item_count: 5, spend_cr: 50 }
    ]);
    expect(synthesis.opportunities.length).toBe(2);
    expect(synthesis.summary.opportunity_count).toBe(2);
    expect(synthesis.summary.estimated_savings_cr).toBeGreaterThan(0);
    expect(synthesis.levers.length).toBeGreaterThan(0);

    const empty = buildMaterialGroupOpportunities([]);
    expect(empty.opportunities).toEqual([]);
    expect(empty.summary.opportunity_count).toBe(0);
    expect(empty.summary.average_confidence).toBe(0);
  });

  it('queries baseline opportunity data from D1', async () => {
    const mockDb: CloudflareD1Database = {
      prepare(query: string) {
        const stmt = {
          bind: () => stmt,
          first: async () => ({ opportunity_count: 2, estimated_savings_cr: 5.5, average_confidence: 0.85 }),
          all: async () => {
            if (query === EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities) {
              return { results: [{ opp_id: 'O-1', category: 'Metals', title: 'Steel', current_spend_cr: 10, estimated_savings_cr: 2, lever: 'Consolidation', recommended_action: 'Consolidate', status: 'Identified', risk_level: 'Low', confidence_score: 90 }] };
            }
            return { results: [{ label: 'Consolidation', record_count: 1, estimated_savings_cr: 2 }] };
          },
          run: async () => ({})
        };
        return stmt;
      }
    };
    const baseline = await queryBaselineOpportunityData(mockDb, 'T1');
    expect(baseline.opportunities.length).toBe(1);
    expect(baseline.summary.estimated_savings_cr).toBe(5.5);
  });

  it('resolves scope classification for DOCUMENT, ASSESSMENT, and baseline provenance', () => {
    const docScope = resolveScopeClassification(
      { row: null, scopeType: 'DOCUMENT', documentName: 'cement.xlsx' },
      null,
      { documentId: 'DOC-1' }
    );
    expect(docScope.dataClassification).toBe('CUSTOMER_DATA');
    expect(docScope.scopeDescription).toContain('cement.xlsx');

    const assessScope = resolveScopeClassification(
      { row: null, scopeType: 'ASSESSMENT', sourceId: 'AIC-1' },
      null,
      { assessmentId: 'AIC-1' }
    );
    expect(assessScope.dataClassification).toBe('CUSTOMER_DATA');
    expect(assessScope.scopeDescription).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.assessmentScope);

    const demoScope = resolveScopeClassification(
      { row: null, scopeType: 'BASELINE' },
      { classification: 'DEMO_ONLY' },
      {}
    );
    expect(demoScope.dataClassification).toBe('DEMO_ONLY');
    expect(demoScope.scopeDescription).toBe(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.demoScope);
  });
});
