import { D1_TABLES } from './constants/d1';
import { ASSESSMENT_D1_MESSAGES } from './constants/assessmentD1';
import { createCustomerSchema, updateCustomerSchema } from './constants/assessmentValidation';
import type { CloudflareD1Database } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import { mapD1Assessment, mapD1Customer, loadAssessmentSnapshots, loadAssessmentSnapshotsForIds } from './services/assessmentD1Mappers';
import { queryAll, queryFirst } from './services/assessmentD1Queries';
import { readJson } from './workerHttp';

export const handleCustomerRoute = async (
  db: CloudflareD1Database,
  subPath: string,
  request: Request,
  tenantId: string
): Promise<WorkerD1Result> => {
  const custSub = subPath.slice('/customers'.length);
  if (!custSub || custSub === '/') {
    if (request.method === 'POST') {
      const parsed = createCustomerSchema.safeParse(await readJson(request));
      if (!parsed.success) return { status: 400, data: { success: false, message: ASSESSMENT_D1_MESSAGES.customerValidation, errors: parsed.error.issues } };
      const body = parsed.data;
      const customerId = body.customerId || `CUST-${globalThis.crypto.randomUUID()}`;
      await db.prepare(`
        INSERT INTO ${D1_TABLES.customers} (
          customer_id, tenant_id, customer_name, industry, business_unit, region, base_currency,
          company_website, contact_email, contact_person, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        customerId, tenantId, body.customerName, body.industry,
        body.businessUnit || 'Default BU', body.region || 'APAC',
        body.baseCurrency || 'INR', body.companyWebsite || null,
        body.contactEmail ?? null, body.contactPerson ?? null,
        'ACTIVE', body.notes ?? null
      ).run();
      const created = await queryFirst(db, `SELECT * FROM ${D1_TABLES.customers} WHERE customer_id = ? AND tenant_id = ?`, [customerId, tenantId]);
      return { data: created ? mapD1Customer(created) : null, status: 201 };
    }
    const customers = await queryAll(db,
      `SELECT * FROM ${D1_TABLES.customers} WHERE tenant_id = ? ORDER BY customer_name ASC`, [tenantId]);
    const snapshots = await loadAssessmentSnapshotsForIds(db, 'customer', customers.map((row) => String(row.customer_id)), {
      requestId: request.headers.get('x-request-id') || undefined, tenantId
    });
    return { data: customers.map((row) => mapD1Customer(row, snapshots.get(String(row.customer_id)))) };
  }

  const customerId = decodeURIComponent(custSub.replace(/^\//, ''));
  if (request.method === 'PATCH' || request.method === 'PUT') {
    const parsed = updateCustomerSchema.safeParse(await readJson(request));
    if (!parsed.success) return { status: 400, data: { success: false, message: ASSESSMENT_D1_MESSAGES.customerUpdateValidation, errors: parsed.error.issues } };
    const body = parsed.data;
    await db.prepare(`
      UPDATE ${D1_TABLES.customers}
      SET customer_name = COALESCE(?, customer_name), industry = COALESCE(?, industry),
          business_unit = COALESCE(?, business_unit), region = COALESCE(?, region),
          base_currency = COALESCE(?, base_currency), company_website = COALESCE(?, company_website),
          contact_email = COALESCE(?, contact_email), contact_person = COALESCE(?, contact_person),
          status = COALESCE(?, status), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ? AND tenant_id = ?
    `).bind(
      body.customerName ?? null, body.industry ?? null, body.businessUnit ?? null,
      body.region ?? null, body.baseCurrency ?? null, body.companyWebsite ?? null,
      body.contactEmail ?? null, body.contactPerson ?? null, body.status ?? null,
      body.notes ?? null, customerId, tenantId
    ).run();
    const updated = await queryFirst(db, `SELECT * FROM ${D1_TABLES.customers} WHERE customer_id = ? AND tenant_id = ?`, [customerId, tenantId]);
    const snapshots = await loadAssessmentSnapshots(db, 'customer', customerId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId
    });
    return { data: updated ? mapD1Customer(updated, snapshots.get(customerId)) : null };
  }

  const customer = await queryFirst(db,
    `SELECT * FROM ${D1_TABLES.customers} WHERE customer_id = ? AND tenant_id = ?`, [customerId, tenantId]);
  if (!customer) return { data: { success: false, message: ASSESSMENT_D1_MESSAGES.customerNotFound(customerId) }, status: 404 };
  const assessments = await queryAll(db,
    `SELECT * FROM ${D1_TABLES.assessments} WHERE customer_id = ? AND tenant_id = ? ORDER BY created_at DESC`, [customerId, tenantId]);
  const [customerSnapshots, assessmentSnapshots] = await Promise.all([
    loadAssessmentSnapshots(db, 'customer', customerId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId
    }),
    loadAssessmentSnapshotsForIds(db, 'assessment', assessments.map((row) => String(row.assessment_id)), {
      requestId: request.headers.get('x-request-id') || undefined, tenantId
    })
  ]);
  return { data: {
    customer: mapD1Customer(customer, customerSnapshots.get(customerId)),
    assessments: assessments.map((row) => mapD1Assessment(row, assessmentSnapshots.get(String(row.assessment_id))))
  } };
};
