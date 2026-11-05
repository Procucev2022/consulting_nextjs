import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AUTH_ROLES, AUTH_STATUS } from '../../src/constants/auth';
import { COMMERCIAL_WORKFLOW } from '../../src/constants/commercialWorkflow';
import { TENANT_DATA_CLASSIFICATION } from '../../src/constants/d1';
import {
  hasActiveOrPendingSubscription,
  validateProvisioningCustomer,
  validateProvisioningOtp,
  validateProvisioningTenant
} from '../../src/services/workerCommercialProvisioningValidation';
import type { SubscriptionProvisionInput } from '../../src/types/validation';
import { createWorkerDatabase, type WorkerDatabaseFixture } from '../helpers/workerCoreFixtures';

let fixture: WorkerDatabaseFixture;

const payload: SubscriptionProvisionInput = {
  tenant_id: 'tenant-a',
  customer_id: 'user-a',
  customer_email: 'buyer@example.test',
  customer_name: 'Asha Rao',
  company_name: 'Rao Textiles',
  tier: 'SILVER',
  commercial_status: 'PAYMENT_RECEIVED',
  payment_reference: 'INV-100',
  payment_confirmed: true,
  otp_session_id: 'otp-valid',
  otp_code: '123456'
};

beforeEach(() => {
  fixture = createWorkerDatabase();
});

afterEach(() => fixture.close());

const addTenant = (tenantId: string, status = AUTH_STATUS.ACTIVE): void => {
  fixture.db.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name, status) VALUES (?, ?, ?)')
    .run(tenantId, tenantId, status);
};

const addOtpSession = (id: string, otp: string): void => {
  fixture.db.prepare(`INSERT INTO AdminOtpSession (
    id, purpose, customer_id, requested_by, otp_hash, expires_at, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, COMMERCIAL_WORKFLOW.otpPurpose.PROVISION, payload.customer_id, 'admin-a',
      createHash('sha256').update(otp).digest('hex'), Date.now() + 60_000, new Date().toISOString());
};

describe('commercial provisioning validation', () => {
  it('requires an active enterprise user without a conflicting tenant assignment', () => {
    expect(validateProvisioningCustomer({ role: AUTH_ROLES.ADMIN, status: AUTH_STATUS.ACTIVE }, payload)?.status)
      .toBe(409);
    expect(validateProvisioningCustomer({ role: AUTH_ROLES.USER, status: AUTH_STATUS.SUSPENDED }, payload)?.status)
      .toBe(409);
    expect(validateProvisioningCustomer({ role: AUTH_ROLES.USER, status: AUTH_STATUS.ACTIVE,
      tenant_id: 'tenant-b' }, payload)?.status).toBe(409);
    expect(validateProvisioningCustomer({ role: AUTH_ROLES.USER, status: AUTH_STATUS.PENDING }, payload)).toBeNull();
    expect(validateProvisioningCustomer({ role: AUTH_ROLES.USER, status: AUTH_STATUS.ACTIVE,
      tenant_id: 'tenant-a' }, payload)).toBeNull();
  });

  it('rejects missing and invalid OTP sessions and accepts the correct single-use code', async () => {
    addOtpSession('otp-wrong', '654321');
    addOtpSession('otp-valid', payload.otp_code);

    expect((await validateProvisioningOtp(fixture.d1, { ...payload, otp_session_id: 'otp-wrong' }))?.status).toBe(401);
    expect((await validateProvisioningOtp(fixture.d1, { ...payload, otp_session_id: 'missing' }))?.status).toBe(401);
    expect(await validateProvisioningOtp(fixture.d1, payload)).toBeNull();
  });

  it('requires an active customer tenant and blocks demo-only tenant assignments', async () => {
    addTenant('tenant-inactive', AUTH_STATUS.SUSPENDED);
    addTenant('tenant-demo');
    addTenant('tenant-customer');
    addTenant('tenant-unclassified');
    fixture.db.prepare('INSERT INTO TenantDataProvenance (tenant_id, classification, source_label) VALUES (?, ?, ?)')
      .run('tenant-demo', TENANT_DATA_CLASSIFICATION.demo, 'TEST_DEMO');
    fixture.db.prepare('INSERT INTO TenantDataProvenance (tenant_id, classification, source_label) VALUES (?, ?, ?)')
      .run('tenant-customer', TENANT_DATA_CLASSIFICATION.customer, 'TEST_CUSTOMER');

    expect(await validateProvisioningTenant(fixture.d1, 'tenant-missing')).toBeNull();
    expect((await validateProvisioningTenant(fixture.d1, 'tenant-inactive'))?.status).toBe(409);
    expect((await validateProvisioningTenant(fixture.d1, 'tenant-demo'))?.status).toBe(409);
    expect(await validateProvisioningTenant(fixture.d1, 'tenant-customer')).toBeNull();
    expect(await validateProvisioningTenant(fixture.d1, 'tenant-unclassified')).toBeNull();
  });

  it('detects existing active or pending subscriptions by normalized email', async () => {
    addTenant('tenant-a');
    fixture.db.prepare(`INSERT INTO User (
      id, name, mobile_number, email, company_name, company_address, password_hash,
      role, status, subscription_tier, tenant_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('user-a', 'Asha Rao', '+919876543210', 'buyer@example.test', 'Rao Textiles', 'Pune', 'hash',
        AUTH_ROLES.USER, AUTH_STATUS.ACTIVE, 'SILVER', 'tenant-a');
    expect(await hasActiveOrPendingSubscription(fixture.d1, payload.customer_email)).toBe(false);
    fixture.db.prepare(`INSERT INTO SubscriptionRecord (
      id, tenant_id, customer_id, customer_email, customer_name, company_name, tier, status,
      commercial_status, payment_confirmed, start_date, end_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('sub-a', 'tenant-a', 'user-a', payload.customer_email.toUpperCase(), payload.customer_name,
        payload.company_name, 'SILVER', COMMERCIAL_WORKFLOW.subscriptionStatus.PENDING,
        COMMERCIAL_WORKFLOW.commercialStatus.RECEIVED, 1, '2026-01-01', '2027-01-01',
        new Date().toISOString(), new Date().toISOString());
    expect(await hasActiveOrPendingSubscription(fixture.d1, payload.customer_email)).toBe(true);
  });
});
