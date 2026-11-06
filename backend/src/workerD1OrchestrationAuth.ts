/**
 * Authentication and role checks for the Analysis Orchestration API.
 * The bearer token is verified with AUTH_SECRET, and the role and status come from the User table,
 * never from request headers or from claims that could be stale.
 */
import type { CloudflareEnvironment } from './types/cloudflare';
import type {
  OrchestrationActor,
  OrchestrationDatabase,
  OrchestrationRequestContext,
  OrchestrationRouteAccess
} from './types/orchestrationD1';
import type { AssessmentJobRow, UserRow } from './types/orchestrationD1';
import { AUTH_ROLES, AUTH_STATUS } from './constants/auth';
import { AUTH_BEARER_PATTERN } from './constants/orchestration';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { findJobRow, findUserRow } from './workerD1OrchestrationStore';
import { forbiddenError, notFoundError, serviceUnavailableError, unauthorizedError } from './workerD1OrchestrationHttp';
import { verifyToken } from './workerAuth';

const readBearerToken = (request: Request): string | null => {
  const match = AUTH_BEARER_PATTERN.exec(request.headers.get('Authorization') ?? '');
  return match ? match[1] : null;
};

const readUserId = (payload: Record<string, unknown> | null): string => {
  const userId = payload?.userId;
  return typeof userId === 'string' ? userId : '';
};

/** Resolves the caller from the bearer token. Throws 401 for missing, invalid or expired credentials. */
export const authenticateOrchestrationActor = async (
  request: Request,
  environment: CloudflareEnvironment,
  database: OrchestrationDatabase
): Promise<OrchestrationActor> => {
  const secret = environment.AUTH_SECRET;
  if (!secret) throw serviceUnavailableError(ORCHESTRATION_MESSAGES.authNotConfigured);
  const token = readBearerToken(request);
  const payload = token === null ? null : await verifyToken(token, secret);
  const userId = readUserId(payload);
  if (userId === '') throw unauthorizedError(ORCHESTRATION_MESSAGES.authRequired);
  const user = await findUserRow(database, userId);
  if (!user) throw unauthorizedError(ORCHESTRATION_MESSAGES.authRequired);
  return toActor(user);
};

const toActor = (user: UserRow): OrchestrationActor => {
  if (user.status !== AUTH_STATUS.ACTIVE) throw forbiddenError(ORCHESTRATION_MESSAGES.accountInactive);
  if (user.role === AUTH_ROLES.ADMIN) return { userId: user.id, userName: user.name, tenantId: user.tenant_id, role: 'ADMIN' };
  if (user.role === AUTH_ROLES.USER) {
    if (!user.tenant_id) throw forbiddenError(ORCHESTRATION_MESSAGES.tenantAssignmentRequired);
    return { userId: user.id, userName: user.name, tenantId: user.tenant_id, role: 'USER' };
  }
  throw forbiddenError(ORCHESTRATION_MESSAGES.unknownRole);
};

/** Enforces the route's role requirement. Administrators cannot use customer-only actions, and vice versa. */
export const assertRouteAccess = (actor: OrchestrationActor, access: OrchestrationRouteAccess): void => {
  if (access === 'ADMIN' && actor.role !== 'ADMIN') throw forbiddenError(ORCHESTRATION_MESSAGES.adminRequired);
  if (access === 'CUSTOMER' && actor.role !== 'USER') throw forbiddenError(ORCHESTRATION_MESSAGES.customerRequired);
};

export const requireOrchestrationTenantId = (
  context: Pick<OrchestrationRequestContext, 'environment' | 'actor'>
): string => {
  const tenantId = context.environment.REQUEST_TENANT_ID;
  if (!tenantId) throw forbiddenError(ORCHESTRATION_MESSAGES.tenantAssignmentRequired);
  if (context.actor.role !== 'ADMIN' && context.actor.tenantId !== tenantId) {
    throw forbiddenError(ORCHESTRATION_MESSAGES.jobOutOfScope);
  }
  return tenantId;
};

/**
 * Loads an analysis job the actor may access. Administrators may access any job. A customer may access only jobs
 * whose customer_id equals their user id, and only after the job has a data version (first-upload guard).
 * Jobs outside the customer's scope return 403. Unknown jobs and customer jobs without data return 404.
 */
export const loadAccessibleJob = async (
  context: Pick<OrchestrationRequestContext, 'database' | 'actor' | 'environment'>,
  assessmentId: string
): Promise<AssessmentJobRow> => {
  const tenantId = requireOrchestrationTenantId(context);
  if (context.actor.role !== 'ADMIN' && context.actor.tenantId !== tenantId) {
    throw forbiddenError(ORCHESTRATION_MESSAGES.jobOutOfScope);
  }
  const row = await findJobRow(context.database, assessmentId, tenantId);
  if (!row) throw notFoundError(ORCHESTRATION_MESSAGES.jobNotFound(assessmentId));
  if (context.actor.role === 'ADMIN') return row;
  if (row.customer_id !== context.actor.userId) throw forbiddenError(ORCHESTRATION_MESSAGES.jobOutOfScope);
  if (row.current_version_id === null) throw notFoundError(ORCHESTRATION_MESSAGES.jobNotFound(assessmentId));
  return row;
};
