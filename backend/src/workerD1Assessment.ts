import { D1_TABLES } from './constants/d1';
import { ASSESSMENT_STATUSES, DATA_STATUSES } from './constants/assessment';
import type { CloudflareD1Database, CloudflareEnvironment } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import { ASSESSMENT_D1_MESSAGES } from './constants/assessmentD1';
import { createAssessmentSchema } from './constants/assessmentValidation';
import type { AssessmentSnapshotReadContext } from './types/assessmentDataVersionD1';
import { mapD1Assessment, loadAssessmentSnapshotsForIds } from './services/assessmentD1Mappers';
import { queryAll, queryFirst } from './services/assessmentD1Queries';
import { handleCustomerRoute } from './workerD1AssessmentCustomers';
import { handleAssessmentAction } from './workerD1AssessmentActions';
import { readJson } from './workerHttp';
import logger from './utils/logger';

const loadScopedSnapshots = async (
  db: CloudflareD1Database,
  entryType: 'customer' | 'assessment',
  ids: string[],
  context?: AssessmentSnapshotReadContext
): Promise<Map<string, D1Record>> => loadAssessmentSnapshotsForIds(db, entryType, ids, context);

const getOperatingModeData = (): Record<string, unknown> => ({
  mode: 'INTERNAL_ASSESSMENT',
  isInternalAssessment: true,
  isPublicSaaS: false,
  workspaceTitle: 'Consulting Command Centre',
  phaseName: 'Phase 1: Diagnostic Assessment',
  features: {
    publicRegistration: false,
    tierUpgrade: false,
    subscriptionPurchase: false,
    customerSelfOnboarding: false,
    customerSaaSDashboard: false,
    assessmentCentre: true
  },
  allowedRoles: ['INTERNAL_ADMIN', 'INTERNAL_LEAD_PARTNER', 'INTERNAL_SENIOR_ANALYST', 'CLIENT_STAKEHOLDER']
});

export const handleAssessmentRoute = async (
  db: CloudflareD1Database | undefined,
  subPath: string,
  request: Request,
  _url: URL,
  environment: CloudflareEnvironment = {}
): Promise<WorkerD1Result> => {
  if (!db) throw new Error('Cloudflare D1 binding DB is not configured');

  if (subPath === '/mode' || subPath.startsWith('/mode/')) return { data: getOperatingModeData() };
  if (subPath === '/system-info') {
    await db.prepare('SELECT 1 AS ok').first();
    return { data: { appVersion: '2.4.0', buildNumber: 'PROCUCEV-BUILD-2026.10', runtime: 'Cloudflare Workers (Edge)', d1Connected: true } };
  }

  const tenantId = environment.REQUEST_TENANT_ID;
  if (!tenantId) {
    logger.warn('Assessment request rejected because tenant scope is unavailable', {
      requestId: request.headers.get('x-request-id') || undefined,
      path: new URL(request.url).pathname
    });
    return { status: 403, data: { success: false, message: ASSESSMENT_D1_MESSAGES.tenantScopeRequired } };
  }

  if (subPath.startsWith('/customers')) return handleCustomerRoute(db, subPath, request, tenantId);

  if (subPath === '' || subPath === '/' || subPath.startsWith('/list')) {
    if (request.method === 'POST') {
      const parsed = createAssessmentSchema.safeParse(await readJson(request));
      if (!parsed.success) return { status: 400, data: { success: false, message: ASSESSMENT_D1_MESSAGES.assessmentValidation, errors: parsed.error.issues } };
      const body = parsed.data;
      const id = body.assessmentId || `AIC-${globalThis.crypto.randomUUID()}`;
      let customerId = body.customerId;
      let createdCustomerId: string | undefined;
      if (customerId) {
        const existingCustomer = await queryFirst<D1Record>(db,
          `SELECT customer_id, customer_name, industry, business_unit, company_website
            FROM ${D1_TABLES.customers} WHERE customer_id = ? AND tenant_id = ? AND status = 'ACTIVE'`, [customerId, tenantId]);
        if (!existingCustomer) return { status: 404, data: { success: false, message: ASSESSMENT_D1_MESSAGES.customerNotFound(customerId) } };
        body.customerName = String(existingCustomer.customer_name);
        body.industry = String(existingCustomer.industry);
        body.businessUnit = String(existingCustomer.business_unit || body.businessUnit || 'Default BU');
        body.companyWebsite = String(existingCustomer.company_website || body.companyWebsite || '');
      } else {
        customerId = `CUST-${globalThis.crypto.randomUUID()}`;
        createdCustomerId = customerId;
      }
      const assessmentInsert = db.prepare(`
        INSERT INTO ${D1_TABLES.assessments} (
          assessment_id, tenant_id, customer_id, customer_name, industry, business_unit, company_website,
          assessment_owner, currency, assessment_period_start, assessment_period_end, data_received_at,
          nda_status, data_status, assigned_analyst, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, tenantId, customerId, body.customerName, body.industry, body.businessUnit || 'Default BU',
        body.companyWebsite || null, body.assessmentOwner || body.assignedAnalyst, body.currency,
        body.assessmentPeriodStart, body.assessmentPeriodEnd, body.dataReceivedDate || null,
        body.ndaStatus, DATA_STATUSES.NOT_RECEIVED, body.assignedAnalyst, ASSESSMENT_STATUSES.CREATED,
        body.notes ?? body.initialNotes ?? null
      );
      const customerInsert = createdCustomerId ? db.prepare(`
        INSERT INTO ${D1_TABLES.customers} (
          customer_id, tenant_id, customer_name, industry, business_unit, company_website, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).bind(createdCustomerId, tenantId, body.customerName, body.industry,
        body.businessUnit || 'Default BU', body.companyWebsite || null) : null;
      try {
        if (customerInsert && db.batch) await db.batch([customerInsert, assessmentInsert]);
        else {
          if (customerInsert) await customerInsert.run();
          await assessmentInsert.run();
        }
      } catch (error) {
        if (createdCustomerId && !db.batch) {
          try {
            await db.prepare(`DELETE FROM ${D1_TABLES.customers} WHERE customer_id = ? AND tenant_id = ?`)
              .bind(createdCustomerId, tenantId).run();
          } catch (rollbackError) {
            logger.error('Failed to roll back an unlinked customer created with an assessment', {
              requestId: request.headers.get('x-request-id') || undefined, customerId: createdCustomerId
            }, rollbackError);
          }
        }
        logger.error('Failed to create tenant-scoped assessment', {
          requestId: request.headers.get('x-request-id') || undefined, assessmentId: id, tenantId
        }, error);
        throw error;
      }
      const created = await queryFirst(db,
        `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [id, tenantId]);
      logger.info('Tenant-scoped assessment created', {
        requestId: request.headers.get('x-request-id') || undefined, assessmentId: id, customerId, tenantId
      });
      return { data: created ? mapD1Assessment(created) : null, status: 201 };
    }
    const assessments = await queryAll(db,
      `SELECT * FROM ${D1_TABLES.assessments} WHERE tenant_id = ? ORDER BY created_at DESC`, [tenantId]);
    const snapshots = await loadScopedSnapshots(db, 'assessment', assessments.map((row) => String(row.assessment_id)), {
      requestId: request.headers.get('x-request-id') || undefined, tenantId
    });
    return { data: assessments.map((row) => mapD1Assessment(row, snapshots.get(String(row.assessment_id)))) };
  }

  const parts = subPath.replace(/^\//, '').split('/');
  return handleAssessmentAction(db, parts[0] || '', parts[1] || '', request, environment, tenantId, parts[2]);
};
