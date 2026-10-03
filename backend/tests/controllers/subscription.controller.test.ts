import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateAuthToken } from '../../src/utils/auth';
import { subscriptionService } from '../../src/services/subscriptionService';
import { subscriptionOtpService } from '../../src/services/subscriptionOtpService';
import { smsService } from '../../src/services/smsService';
import { activationCodeService } from '../../src/services/activationCodeService';

describe('SubscriptionController & API Entitlement Authorization (Prompt 288 & Prompt 289)', () => {
  let capturedOtp = '';

  const adminToken = generateAuthToken('usr-admin-1', 'admin@procucev.com', 'ADMIN', 'GOLD', 'TNT-GLOBAL-8902', '+91 98765 43210');
  const userToken = generateAuthToken('usr-user-1', 'user@company.com', 'USER', 'BRONZE', 'TNT-BRONZE-CLIENT');
  const silverUserToken = generateAuthToken('usr-silver-1', 'silver@company.com', 'USER', 'SILVER', 'TNT-SILVER-CLIENT');
  const goldUserToken = generateAuthToken('usr-gold-1', 'gold@company.com', 'USER', 'GOLD', 'TNT-GLOBAL-8902');

  beforeEach(() => {
    subscriptionService.reset();
    subscriptionOtpService.resetSessions();
    capturedOtp = '';
    vi.spyOn(smsService, 'sendAdminProvisioningOtp').mockImplementation(async (_mobile, otp) => {
      capturedOtp = otp;
      return { success: true, destination: '******43210' };
    });
  });

  it('GET /api/subscription/plan returns plan info', async () => {
    const res = await request(app)
      .get('/api/subscription/plan')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan.tier).toBe('BRONZE');
  });

  it('POST /api/subscription/admin/request-otp rejects non-admin with 403', async () => {
    const res = await request(app)
      .post('/api/subscription/admin/request-otp')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ customer_id: 'usr-1', action: 'PROVISION' });

    expect(res.status).toBe(403);
  });

  it('POST /api/subscription/admin/request-otp allows admin and dispatches OTP via SMS', async () => {
    const res = await request(app)
      .post('/api/subscription/admin/request-otp')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: 'usr-1', action: 'PROVISION' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session_id).toBeDefined();
    expect(res.body.otp_hint).toBeUndefined(); // Zero plaintext leak!
    expect(capturedOtp).toMatch(/^\d{6}$/);
  });

  it('Full Admin Provisioning and Customer Activation flow', async () => {
    const otpRes = await request(app)
      .post('/api/subscription/admin/request-otp')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: 'usr-flow-1', action: 'PROVISION' });

    const sessionId = otpRes.body.session_id;

    // Provisioning with wrong OTP fails
    const failProvision = await request(app)
      .post('/api/subscription/admin/provision')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tenant_id: 'TNT-FLOW-01',
        customer_id: 'usr-flow-1',
        customer_email: 'flow@client.com',
        customer_name: 'Flow User',
        company_name: 'Flow Corp',
        tier: 'GOLD',
        commercial_status: 'PAYMENT_RECEIVED',
        payment_reference: 'INV-FLOW-001',
        payment_confirmed: true,
        otp_session_id: sessionId,
        otp_code: '000000'
      });

    expect(failProvision.status).toBe(400);

    // Provisioning with valid OTP succeeds
    const okProvision = await request(app)
      .post('/api/subscription/admin/provision')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tenant_id: 'TNT-FLOW-01',
        customer_id: 'usr-flow-1',
        customer_email: 'flow@client.com',
        customer_name: 'Flow User',
        company_name: 'Flow Corp',
        tier: 'GOLD',
        commercial_status: 'PAYMENT_RECEIVED',
        payment_reference: 'INV-FLOW-001',
        payment_confirmed: true,
        otp_session_id: sessionId,
        otp_code: capturedOtp
      });

    expect(okProvision.status).toBe(201);
    expect(okProvision.body.subscription.status).toBe('PENDING_ACTIVATION');

    // Customer activates with wrong code fails
    const failActivation = await request(app)
      .post('/api/subscription/activate')
      .send({
        customer_email: 'flow@client.com',
        activation_code: 'PCV-0000-0000-0000'
      });
    expect(failActivation.status).toBe(400);

    const subId = okProvision.body.subscription.id;
    const { plaintextCode } = activationCodeService.generateActivationCode(subId, 'TNT-FLOW-01', 'flow@client.com');

    const okActivation = await request(app)
      .post('/api/subscription/activate')
      .send({
        customer_email: 'flow@client.com',
        activation_code: plaintextCode
      });

    expect(okActivation.status).toBe(200);
    expect(okActivation.body.subscription.status).toBe('ACTIVE');
  });

  it('Admin lists subscriptions and manages status & renewal', async () => {
    const listRes = await request(app)
      .get('/api/subscription/admin/list')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.subscriptions.length).toBeGreaterThan(0);

    const targetSub = listRes.body.subscriptions[0];

    const suspendRes = await request(app)
      .patch(`/api/subscription/admin/${targetSub.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED', reason: 'Audit hold' });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.subscription.status).toBe('SUSPENDED');

    // Request OTP for renewal
    const otpRes = await request(app)
      .post('/api/subscription/admin/request-otp')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: targetSub.customer_id, action: 'RENEW' });

    const renewRes = await request(app)
      .post(`/api/subscription/admin/${targetSub.id}/renew`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        new_end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
        payment_reference: 'INV-RENEW-1',
        otp_session_id: otpRes.body.session_id,
        otp_code: capturedOtp
      });

    expect(renewRes.status).toBe(200);
    expect(renewRes.body.subscription.status).toBe('ACTIVE');

    const auditRes = await request(app)
      .get('/api/subscription/admin/audit-trail')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.audit_events.length).toBeGreaterThan(0);
  });

  it('enforces API authorization: Bronze calling Gold savings returns 403', async () => {
    const res = await request(app)
      .get('/api/savings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FEATURE_LOCKED');
  });

  it('enforces API authorization: Silver calling Gold supplier deep dive returns 403', async () => {
    const res = await request(app)
      .get('/api/module2/sourcing/suppliers')
      .set('Authorization', `Bearer ${silverUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FEATURE_LOCKED');
  });

  it('allows Gold user to access savings and supplier deep dive', async () => {
    const savingsRes = await request(app)
      .get('/api/savings')
      .set('Authorization', `Bearer ${goldUserToken}`);

    expect(savingsRes.status).toBe(200);
  });
});
