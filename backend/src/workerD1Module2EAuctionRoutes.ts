import { eAuctionPlanningAssumptionSchema } from './constants/validation';
import { MODULE2_D1_ROUTE_MESSAGES } from './constants/module2D1Scoped';
import { clearScopedModule2Cache } from './services/workerD1Module2Scoped';
import {
  loadEAuctionPlanningAssumptions,
  saveEAuctionPlanningAssumption
} from './services/workerD1EAuctionPlanningAssumptions';
import type { CloudflareD1Database } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import { authenticateWorkerUser } from './workerAuth';
import { readJson } from './workerHttp';
import logger from './utils/logger';

export const handleEAuctionPlanningAssumptionsRoute = async (
  db: CloudflareD1Database,
  normalizedPath: string,
  request: Request,
  authSecret?: string
): Promise<WorkerD1Result | null> => {
  if (normalizedPath !== '/e-auction/planning-assumptions') return null;
  if (request.method === 'GET') return { data: await loadEAuctionPlanningAssumptions(db) };
  if (request.method !== 'PUT') return {
    status: 405,
    data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.eAuctionPlanningAssumptionMethod }
  };

  const parsed = eAuctionPlanningAssumptionSchema.safeParse(await readJson(request));
  if (!parsed.success) return {
    status: 400,
    data: {
      success: false,
      message: MODULE2_D1_ROUTE_MESSAGES.invalidEAuctionPlanningAssumption,
      errors: parsed.error.issues
    }
  };

  const authentication = await authenticateWorkerUser(request, { DB: db, AUTH_SECRET: authSecret }, true);
  if (!authentication.user) return {
    status: authentication.status,
    data: {
      success: false,
      message: authentication.message || MODULE2_D1_ROUTE_MESSAGES.eAuctionPlanningAssumptionAdminOnly
    }
  };

  const updatedAt = new Date().toISOString();
  const reviewedAssumption = {
    ...parsed.data,
    ...(parsed.data.approvalStatus === 'APPROVED'
      ? { approvedBy: authentication.user.name, approvedDate: updatedAt }
      : { approvedBy: undefined, approvedDate: undefined })
  };
  const assumption = await saveEAuctionPlanningAssumption(
    db, reviewedAssumption, authentication.user.email, updatedAt
  );
  clearScopedModule2Cache();
  logger.info('Persisted D1 e-auction planning assumption', {
    assumptionId: assumption.id,
    categoryOrMaterial: assumption.categoryOrMaterial,
    approved: assumption.approvalStatus === 'APPROVED',
    updatedBy: authentication.user.id,
    requestId: request.headers.get('x-request-id') || undefined
  });
  return {
    data: {
      success: true,
      message: MODULE2_D1_ROUTE_MESSAGES.eAuctionPlanningAssumptionSaved,
      assumption
    }
  };
};
