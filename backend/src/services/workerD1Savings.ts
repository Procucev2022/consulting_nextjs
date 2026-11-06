import { D1_TABLES } from '../constants/d1';
import {
  SAVINGS_D1_ACTION_STATUS,
  SAVINGS_D1_ACTION_STATUS_STORAGE,
  SAVINGS_D1_ENGINE_BY_LEVER,
  SAVINGS_D1_INR_PER_CRORE,
  SAVINGS_D1_MESSAGES,
  SAVINGS_D1_OPPORTUNITY_STATUS,
  SAVINGS_D1_OWNER_VALUES
} from '../constants/savingsD1';
import { updateActionPlanSchema, updateOpportunityStatusSchema } from '../constants/validation';
import type { ActionOwner, ActionPlanItem, SavingsOpportunityItem, SavingsWaterfallMetrics } from '../types/savings';
import type { D1SavingsActionPlanRow, D1SavingsAssessmentRow, D1SavingsOpportunityRow } from '../types/savingsD1';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../types/cloudflare';
import type { WorkerD1Result } from '../types/d1';
import { parsePersistedSavingsMetrics } from './workerD1SavingsMetrics';
import { queryD1Rows } from './workerD1Query';

const numberValue = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;

const ownerValue = (value: string): ActionOwner =>
  (SAVINGS_D1_OWNER_VALUES as readonly string[]).includes(value) ? value as ActionOwner : 'Procurement';

const normalizedStatus = (value: string | null): string => (value || 'IDENTIFIED').trim().replaceAll('_', ' ').toUpperCase();

const toActionPlan = (row: D1SavingsActionPlanRow): ActionPlanItem => ({
  id: row.id,
  opportunity_id: row.opp_id,
  action: row.title,
  owner: ownerValue(row.owner),
  department: row.category,
  target_date: row.target_date || '',
  priority: row.priority === 'HIGH' || row.priority === 'LOW' ? row.priority : 'MEDIUM',
  expected_value_inr: numberValue(row.est_savings_inr_cr) * SAVINGS_D1_INR_PER_CRORE,
  expected_value_inr_cr: numberValue(row.est_savings_inr_cr),
  status: SAVINGS_D1_ACTION_STATUS[normalizedStatus(row.status)] || 'Open',
  ...(row.comments ? { comments: row.comments } : {}),
  created_at: row.created_at,
  updated_at: row.updated_at
});

const spendInCrores = (row: D1SavingsOpportunityRow): number =>
  numberValue(row.current_spend_inr_cr) || numberValue(row.current_spend) / SAVINGS_D1_INR_PER_CRORE;

const savingsInCrores = (row: D1SavingsOpportunityRow): number =>
  numberValue(row.est_savings_inr_cr) || numberValue(row.est_savings) / SAVINGS_D1_INR_PER_CRORE;

const opportunityNotes = (row: D1SavingsOpportunityRow): { validation_notes?: string } => {
  const notes = row.contract_leak_type || row.recommended_action;
  return notes ? { validation_notes: notes } : {};
};

const opportunityItem = (row: D1SavingsOpportunityRow, actionPlans: ActionPlanItem[]): SavingsOpportunityItem => {
  const currentSpendCr = spendInCrores(row);
  const savingsCr = savingsInCrores(row);
  const status = SAVINGS_D1_OPPORTUNITY_STATUS[normalizedStatus(row.status)] || 'IDENTIFIED';
  const plan = actionPlans.find((candidate) => candidate.opportunity_id === row.opp_id);
  const lever = (row.lever || '').trim().toUpperCase();
  return {
    opportunity_id: row.opp_id,
    source_module: 'MODULE_2_STRATEGIC',
    source_engine: SAVINGS_D1_ENGINE_BY_LEVER[lever] || 'OTHER_STRATEGIC',
    category: row.category,
    item: row.title || row.recommended_action || row.category,
    vendor: '',
    plant: '',
    spend_inr: numberValue(row.current_spend) || currentSpendCr * SAVINGS_D1_INR_PER_CRORE,
    spend_inr_cr: currentSpendCr,
    potential_savings_inr: numberValue(row.est_savings) || savingsCr * SAVINGS_D1_INR_PER_CRORE,
    potential_savings_inr_cr: savingsCr,
    is_overlapping: false,
    net_savings_inr: savingsCr * SAVINGS_D1_INR_PER_CRORE,
    net_savings_inr_cr: savingsCr,
    status,
    owner: plan?.owner || 'Procurement',
    department: row.category,
    timeline: plan?.target_date || '',
    ...opportunityNotes(row),
    created_at: ''
  };
};

const opportunityItems = (rows: D1SavingsOpportunityRow[], actionPlans: ActionPlanItem[]): SavingsOpportunityItem[] =>
  rows.map((row) => opportunityItem(row, actionPlans));

const statusSavings = (opportunities: SavingsOpportunityItem[], statuses: readonly string[]): number => opportunities
  .filter((item) => statuses.includes(item.status))
  .reduce((total, item) => total + item.potential_savings_inr_cr, 0);

const buildWaterfallMetrics = (
  opportunities: SavingsOpportunityItem[], assessment: D1SavingsAssessmentRow | null
): SavingsWaterfallMetrics => {
  const grossSavings = opportunities.reduce((total, item) => total + item.potential_savings_inr_cr, 0);
  const totalSpend = numberValue(assessment?.total_spend_cr) ||
    opportunities.reduce((total, item) => total + item.spend_inr_cr, 0);
  const overlapDeduction = numberValue(assessment?.overlap_deductions_cr);
  return {
    total_spend_inr_cr: totalSpend,
    addressable_spend_inr_cr: numberValue(assessment?.addressable_spend_cr) || totalSpend,
    identified_opportunities_count: opportunities.length,
    gross_potential_savings_inr_cr: grossSavings,
    deduplicated_overlap_inr_cr: overlapDeduction,
    net_potential_savings_inr_cr: Math.max(0, grossSavings - overlapDeduction),
    proven_opportunity_inr_cr: numberValue(assessment?.proven_opportunity_cr),
    discovery_opportunity_inr_cr: Math.max(0, grossSavings - numberValue(assessment?.proven_opportunity_cr)),
    validated_savings_inr_cr: statusSavings(opportunities, ['VALIDATED', 'APPROVED', 'IMPLEMENTING', 'REALIZED']),
    approved_savings_inr_cr: statusSavings(opportunities, ['APPROVED', 'IMPLEMENTING', 'REALIZED']),
    realized_savings_inr_cr: statusSavings(opportunities, ['REALIZED'])
  };
};

export const loadSavingsFromD1 = async (
  db: CloudflareD1Database,
  tenantId: string
): Promise<Record<string, unknown>> => {
  const [opportunityRows, actionPlanRows] = await Promise.all([
    queryD1Rows<D1SavingsOpportunityRow>(db,
      `SELECT opportunity.* FROM ${D1_TABLES.opportunities} AS opportunity ` +
      `INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ON scope.opp_id = opportunity.opp_id ` +
      'WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC, opportunity.opp_id ASC', [tenantId]),
    queryD1Rows<D1SavingsActionPlanRow>(db,
      `SELECT plan.*, details.target_date, details.priority, details.comments FROM ${D1_TABLES.actionPlans} AS plan ` +
      `LEFT JOIN ${D1_TABLES.actionPlanDetails} AS details ON details.action_id = plan.id ` +
      `WHERE plan.opp_id IN (SELECT scope.opp_id FROM ${D1_TABLES.opportunityTenantScope} AS scope WHERE scope.tenant_id = ?) ` +
      'ORDER BY plan.created_at ASC, plan.id ASC', [tenantId])
  ]);
  const actionPlans = actionPlanRows.map(toActionPlan);
  const opportunities = opportunityItems(opportunityRows, actionPlans);
  const waterfallMetrics = buildWaterfallMetrics(opportunities, null);
  return {
    opportunities,
    overlaps: [],
    waterfallMetrics,
    actionPlans,
    totalGrossSavingsCr: waterfallMetrics.gross_potential_savings_inr_cr,
    overlapDeductionCr: waterfallMetrics.deduplicated_overlap_inr_cr,
    netClientSavingsCr: waterfallMetrics.net_potential_savings_inr_cr,
    actionPlansCount: actionPlans.length
  };
};

export const loadAssessmentSavingsFromD1 = async (
  db: CloudflareD1Database,
  assessmentId: string,
  tenantId: string,
  requestId?: string
): Promise<WorkerD1Result> => {
  const assessment = await db.prepare(
    'SELECT assessment_id, customer_id, total_spend_cr, validated_spend_cr, addressable_spend_cr, gross_opportunity_cr, ' +
    'overlap_deductions_cr, net_defensible_opportunity_cr, proven_opportunity_cr, potential_savings_cr ' +
    `FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`
  ).bind(assessmentId, tenantId).first<D1SavingsAssessmentRow & {
    assessment_id: string;
    customer_id: string;
    validated_spend_cr: number | null;
    gross_opportunity_cr: number | null;
    net_defensible_opportunity_cr: number | null;
    potential_savings_cr: number | null;
  }>();
  if (!assessment) return {
    status: 404, data: { success: false, message: `Assessment ${assessmentId} was not found in D1.` }
  };

  const run = await db.prepare(
    `SELECT analysis_run_id, metrics_json FROM ${D1_TABLES.analysisRuns} WHERE assessment_id = ? AND is_superseded = 0 ` +
    'ORDER BY created_at DESC, analysis_run_id DESC LIMIT 1'
  ).bind(assessmentId).first<{ analysis_run_id: string; metrics_json: string | null }>();
  const persistedMetrics = run?.metrics_json
    ? parsePersistedSavingsMetrics(run.metrics_json, requestId, assessmentId, run.analysis_run_id, tenantId)
    : {};
  const opportunities = Array.isArray(persistedMetrics.opportunities) ? persistedMetrics.opportunities : [];
  const actionPlans = Array.isArray(persistedMetrics.actionPlans) ? persistedMetrics.actionPlans : [];
  const overlaps = Array.isArray(persistedMetrics.overlaps) ? persistedMetrics.overlaps : [];
  const metrics: SavingsWaterfallMetrics = {
    total_spend_inr_cr: numberValue(assessment.total_spend_cr),
    addressable_spend_inr_cr: numberValue(assessment.addressable_spend_cr),
    identified_opportunities_count: opportunities.length,
    gross_potential_savings_inr_cr: numberValue(assessment.gross_opportunity_cr),
    deduplicated_overlap_inr_cr: numberValue(assessment.overlap_deductions_cr),
    net_potential_savings_inr_cr: numberValue(assessment.net_defensible_opportunity_cr),
    proven_opportunity_inr_cr: numberValue(assessment.proven_opportunity_cr),
    discovery_opportunity_inr_cr: Math.max(
      0, numberValue(assessment.gross_opportunity_cr) - numberValue(assessment.proven_opportunity_cr)
    ),
    validated_savings_inr_cr: numberValue(persistedMetrics.validatedSavingsInrCr),
    approved_savings_inr_cr: numberValue(persistedMetrics.approvedSavingsInrCr),
    realized_savings_inr_cr: numberValue(persistedMetrics.realizedSavingsInrCr)
  };
  return { data: {
    dataScope: { assessmentId },
    assessmentId,
    assessment,
    opportunities,
    actionPlans,
    overlaps,
    waterfallMetrics: metrics,
    totalGrossSavingsCr: metrics.gross_potential_savings_inr_cr,
    overlapDeductionCr: metrics.deduplicated_overlap_inr_cr,
    netClientSavingsCr: metrics.net_potential_savings_inr_cr,
    actionPlansCount: actionPlans.length
  } };
};

const buildActionPlanUpdateStatements = (
  db: CloudflareD1Database,
  actionId: string,
  tenantId: string,
  updates: Omit<ReturnType<typeof updateActionPlanSchema.parse>, 'actionId'>
): CloudflareD1PreparedStatement[] => {
  const statements = [];
  const coreUpdates: string[] = [];
  const coreValues: unknown[] = [];
  if (updates.status !== undefined) {
    coreUpdates.push('status = ?');
    coreValues.push(SAVINGS_D1_ACTION_STATUS_STORAGE[updates.status]);
  }
  if (updates.owner !== undefined) {
    coreUpdates.push('owner = ?');
    coreValues.push(updates.owner);
  }
  if (coreUpdates.length > 0) {
    coreValues.push(new Date().toISOString(), actionId);
    const sql = `UPDATE ${D1_TABLES.actionPlans} SET ${coreUpdates.join(', ')}, updated_at = ? WHERE id = ? ` +
      `AND EXISTS (SELECT 1 FROM ${D1_TABLES.opportunityTenantScope} AS scope ` +
      `WHERE scope.opp_id = ${D1_TABLES.actionPlans}.opp_id AND scope.tenant_id = ?)`;
    statements.push(db.prepare(sql).bind(...coreValues, tenantId));
  }
  if (updates.priority !== undefined || updates.comments !== undefined) {
    statements.push(db.prepare(
      `INSERT INTO ${D1_TABLES.actionPlanDetails} (action_id, priority, comments, updated_at) ` +
      'SELECT ?, COALESCE(?, \'MEDIUM\'), ?, CURRENT_TIMESTAMP WHERE EXISTS (' +
      'SELECT 1 FROM ' + D1_TABLES.actionPlans + ' AS plan INNER JOIN ' + D1_TABLES.opportunityTenantScope + ' AS scope ' +
      'ON scope.opp_id = plan.opp_id WHERE plan.id = ? AND scope.tenant_id = ?) ' +
      'ON CONFLICT(action_id) DO UPDATE SET ' +
      `priority = COALESCE(excluded.priority, ${D1_TABLES.actionPlanDetails}.priority), ` +
      `comments = COALESCE(excluded.comments, ${D1_TABLES.actionPlanDetails}.comments), updated_at = CURRENT_TIMESTAMP`
    ).bind(actionId, updates.priority ?? null, updates.comments ?? null, actionId, tenantId));
  }
  return statements;
};

const persistActionPlanStatements = async (
  db: CloudflareD1Database, statements: CloudflareD1PreparedStatement[]
): Promise<void> => {
  if (db.batch && statements.length > 1) await db.batch(statements);
  else for (const statement of statements) await statement.run();
};

export const updateActionPlanInD1 = async (
  db: CloudflareD1Database,
  input: unknown,
  tenantId: string
): Promise<WorkerD1Result> => {
  const parsed = updateActionPlanSchema.safeParse(input);
  if (!parsed.success) return {
    status: 400,
    data: { success: false, message: 'Action-plan update validation failed.', errors: parsed.error.issues }
  };
  const { actionId, ...updates } = parsed.data;
  const fields = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (fields.length === 0) return {
    status: 400,
    data: { success: false, message: SAVINGS_D1_MESSAGES.actionPlanNoChanges }
  };
  const current = await db.prepare(
    `SELECT plan.id FROM ${D1_TABLES.actionPlans} AS plan INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ` +
    'ON scope.opp_id = plan.opp_id WHERE plan.id = ? AND scope.tenant_id = ?'
  ).bind(actionId, tenantId).first<{ id: string }>();
  if (!current) return {
    status: 404,
    data: { success: false, message: SAVINGS_D1_MESSAGES.actionPlanNotFound(actionId) }
  };
  await persistActionPlanStatements(db, buildActionPlanUpdateStatements(db, actionId, tenantId, updates));

  const refreshed = await db.prepare(
    `SELECT plan.*, details.target_date, details.priority, details.comments FROM ${D1_TABLES.actionPlans} AS plan ` +
    `LEFT JOIN ${D1_TABLES.actionPlanDetails} AS details ON details.action_id = plan.id ` +
    `INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ON scope.opp_id = plan.opp_id ` +
    'WHERE plan.id = ? AND scope.tenant_id = ?'
  ).bind(actionId, tenantId).first<D1SavingsActionPlanRow>();
  if (!refreshed) return {
    status: 404,
    data: { success: false, message: SAVINGS_D1_MESSAGES.actionPlanNotFound(actionId) }
  };
  return { data: toActionPlan(refreshed) };
};

export const updateOpportunityStatusInD1 = async (
  db: CloudflareD1Database, input: unknown, tenantId: string
): Promise<WorkerD1Result> => {
  const parsed = updateOpportunityStatusSchema.safeParse(input);
  if (!parsed.success) return {
    status: 400,
    data: { success: false, message: 'Opportunity status validation failed.', errors: parsed.error.issues }
  };
  const { opp_id: opportunityId, status } = parsed.data;
  await db.prepare(`UPDATE ${D1_TABLES.opportunities} SET status = ? WHERE opp_id = ? ` +
    `AND EXISTS (SELECT 1 FROM ${D1_TABLES.opportunityTenantScope} AS scope ` +
    `WHERE scope.opp_id = ${D1_TABLES.opportunities}.opp_id AND scope.tenant_id = ?)`)
    .bind(status, opportunityId, tenantId).run();
  const opportunity = await db.prepare(`SELECT opportunity.* FROM ${D1_TABLES.opportunities} AS opportunity ` +
    `INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ON scope.opp_id = opportunity.opp_id ` +
    'WHERE opportunity.opp_id = ? AND scope.tenant_id = ?').bind(opportunityId, tenantId).first<D1SavingsOpportunityRow>();
  if (!opportunity) {
    return { status: 404, data: { success: false, message: SAVINGS_D1_MESSAGES.opportunityNotFound(opportunityId) } };
  }
  return { data: { ...opportunity, status } };
};
