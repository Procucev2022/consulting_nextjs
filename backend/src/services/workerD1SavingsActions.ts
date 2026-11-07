import { D1_LOG_FALLBACKS, D1_TABLES } from '../constants/d1';
import {
  SAVINGS_D1_ACTION_STATUS_STORAGE,
  SAVINGS_D1_LOG_ACTIONS,
  SAVINGS_D1_LOG_MESSAGES,
  SAVINGS_D1_MESSAGES
} from '../constants/savingsD1';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../types/cloudflare';
import type { SavingsActionPlanWriteContext, UpdateActionPlanFields } from '../types/savingsD1';
import logger from '../utils/logger';

export const buildActionPlanUpdateStatements = (
  db: CloudflareD1Database,
  actionId: string,
  tenantId: string,
  updates: UpdateActionPlanFields
): CloudflareD1PreparedStatement[] => {
  const statements: CloudflareD1PreparedStatement[] = [];
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

export const persistActionPlanStatements = async (
  db: CloudflareD1Database,
  statements: CloudflareD1PreparedStatement[],
  context: SavingsActionPlanWriteContext
): Promise<boolean> => {
  if (statements.length > 1 && !db.batch) {
    logger.error(SAVINGS_D1_LOG_MESSAGES.actionPlanBatchUnavailable, {
      action: SAVINGS_D1_LOG_ACTIONS.actionPlanBatchUnavailable,
      ...context,
      statementCount: statements.length,
      writesStarted: false,
      fallback: D1_LOG_FALLBACKS.failClosed
    }, new Error(SAVINGS_D1_MESSAGES.actionPlanBatchUnavailable));
    return false;
  }
  if (db.batch && statements.length > 1) await db.batch(statements);
  else for (const statement of statements) await statement.run();
  return true;
};
