import { COMMERCIAL_WORKFLOW } from '../constants/commercialWorkflow';
import { D1_SINGLE_ROW_CHANGE_COUNT } from '../constants/db';
import { D1_TABLES } from '../constants/d1';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { UpgradeRedemptionOutcome, UpgradeRequestD1Row } from '../types/commercialWorkflow';
import { d1ChangedRows } from '../utils/d1Result';
import logger from '../utils/logger';

const buildUpgradeRedemptionStatements = (
  db: CloudflareD1Database,
  record: UpgradeRequestD1Row,
  userId: string,
  tenantId: string,
  codeHash: string,
  now: string
): ReturnType<CloudflareD1Database['prepare']>[] => [
  db.prepare(`
    UPDATE ${D1_TABLES.upgradeRequests} SET status = ?, code_redeemed_at = ?, updated_at = ?
    WHERE id = ? AND generated_unique_code_hash = ? AND status = ? AND code_expires_at > ?
      AND EXISTS (
        SELECT 1 FROM User AS customer
        INNER JOIN TenantMaster AS tenant ON tenant.tenant_id = customer.tenant_id
        WHERE customer.id = ? AND lower(customer.email) = lower(?) AND customer.role = 'USER'
          AND customer.status = 'ACTIVE' AND customer.tenant_id = ? AND tenant.status = 'ACTIVE'
      )
  `).bind(
    COMMERCIAL_WORKFLOW.upgradeStatus.COMPLETED, now, now, record.id, codeHash,
    COMMERCIAL_WORKFLOW.upgradeStatus.CODE_SENT, Date.now(), userId, record.customer_email, tenantId
  ),
  db.prepare(`
    UPDATE User SET subscription_tier = ?, updated_at = ?
    WHERE id = ? AND role = 'USER' AND status = 'ACTIVE' AND tenant_id = ?
      AND EXISTS (SELECT 1 FROM TenantMaster WHERE tenant_id = User.tenant_id AND status = 'ACTIVE')
      AND EXISTS (
        SELECT 1 FROM ${D1_TABLES.upgradeRequests} AS upgrade
        WHERE upgrade.id = ? AND lower(upgrade.customer_email) = lower(User.email)
          AND upgrade.generated_unique_code_hash = ? AND upgrade.status = ?
          AND upgrade.code_redeemed_at = ?
      )
  `).bind(
    record.requested_tier, now, userId, tenantId, record.id, codeHash,
    COMMERCIAL_WORKFLOW.upgradeStatus.COMPLETED, now
  )
];

const getUpgradeRedemptionOutcome = (
  results: unknown[], requestId: string | undefined, record: UpgradeRequestD1Row, userId: string
): UpgradeRedemptionOutcome => {
  const requestChanges = d1ChangedRows(results[0]);
  const userChanges = d1ChangedRows(results[1]);
  if (requestChanges === 0 && userChanges === 0) return COMMERCIAL_WORKFLOW.upgradeRedemption.CONFLICT;
  if (requestChanges === D1_SINGLE_ROW_CHANGE_COUNT && userChanges === D1_SINGLE_ROW_CHANGE_COUNT) {
    return COMMERCIAL_WORKFLOW.upgradeRedemption.REDEEMED;
  }
  logger.error('Atomic upgrade redemption returned an inconsistent row-change result', {
    requestId, upgradeRequestId: record.id, userId, requestChanges, userChanges
  }, new Error('Upgrade request and customer update did not both affect one row.'));
  return COMMERCIAL_WORKFLOW.upgradeRedemption.INVARIANT_FAILURE;
};

export const redeemUpgradeCode = async (
  db: CloudflareD1Database,
  record: UpgradeRequestD1Row,
  userId: string,
  tenantId: string,
  codeHash: string,
  requestId?: string
): Promise<UpgradeRedemptionOutcome> => {
  if (!db.batch) {
    logger.warn('Upgrade code redemption rejected because atomic D1 batching is unavailable', {
      requestId, upgradeRequestId: record.id, userId
    });
    return COMMERCIAL_WORKFLOW.upgradeRedemption.UNAVAILABLE;
  }
  try {
    const statements = buildUpgradeRedemptionStatements(
      db, record, userId, tenantId, codeHash, new Date().toISOString()
    );
    const results = await db.batch(statements);
    return getUpgradeRedemptionOutcome(results, requestId, record, userId);
  } catch (error: unknown) {
    logger.error('Atomic upgrade code redemption failed', {
      requestId, upgradeRequestId: record.id, userId, tenantId
    }, error);
    return COMMERCIAL_WORKFLOW.upgradeRedemption.UNAVAILABLE;
  }
};
