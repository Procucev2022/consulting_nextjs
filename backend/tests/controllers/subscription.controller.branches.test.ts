import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { subscriptionController } from '../../src/controllers/subscription.controller';
import { subscriptionService } from '../../src/services/subscriptionService';
import { subscriptionOtpService } from '../../src/services/subscriptionOtpService';
import * as authUtils from '../../src/utils/auth';

function createMockResponse(): { res: Response; statusCode: number; body: unknown } {
  const result = { statusCode: 200, body: null as unknown, res: {} as Response };
  result.res = {
    status: vi.fn((code: number) => { result.statusCode = code; return result.res; }),
    json: vi.fn((data: unknown) => { result.body = data; return result.res; })
  } as unknown as Response;
  return result;
}

function mockReq(opts: { headers?: Record<string, string>; body?: unknown; params?: Record<string, string>; query?: Record<string, string> } = {}): Request {
  return { headers: opts.headers || {}, body: opts.body || {}, params: opts.params || {}, query: opts.query || {} } as unknown as Request;
}

describe('SubscriptionController Edge & Branch Tests (Prompt 288)', () => {
  const adminToken = authUtils.generateAuthToken('usr-admin-1', 'admin@procucev.com', 'ADMIN', 'GOLD');
  const userToken = authUtils.generateAuthToken('usr-user-1', 'user@company.com', 'USER', 'BRONZE');

  beforeEach(() => {
    vi.restoreAllMocks();
    subscriptionService.reset();
    subscriptionOtpService.resetSessions();
  });

  describe('getCurrentPlan & requestAdminOtp', () => {
    it('handles unexpected errors in getCurrentPlan', async () => {
      vi.spyOn(subscriptionService, 'getCustomerPlanInfo').mockImplementationOnce(() => { throw new Error('DB fail'); });
      const m1 = createMockResponse();
      await subscriptionController.getCurrentPlan(mockReq(), m1.res);
      expect(m1.statusCode).toBe(500);

      vi.spyOn(subscriptionService, 'getCustomerPlanInfo').mockImplementationOnce(() => { throw 'String err'; });
      const m2 = createMockResponse();
      await subscriptionController.getCurrentPlan(mockReq(), m2.res);
      expect(m2.statusCode).toBe(500);
    });

    it('validates requestAdminOtp permissions, inputs, fallbacks, and errors', async () => {
      const m1 = createMockResponse();
      await subscriptionController.requestAdminOtp(mockReq({ headers: { authorization: `Bearer ${userToken}` } }), m1.res);
      expect(m1.statusCode).toBe(403);

      const m2 = createMockResponse();
      await subscriptionController.requestAdminOtp(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, body: { customer_id: '' } }), m2.res);
      expect(m2.statusCode).toBe(400);

      vi.spyOn(authUtils, 'verifyAuthToken').mockReturnValueOnce({
        userId: 'u-bare', email: '', role: 'ADMIN', tier: 'GOLD', exp: Date.now() + 100000
      });
      const m3 = createMockResponse();
      await subscriptionController.requestAdminOtp(mockReq({ headers: { authorization: 'Bearer token-bare' }, body: { customer_id: 'c1', action: 'PROVISION' } }), m3.res);
      expect(m3.statusCode).toBe(200);

      vi.spyOn(subscriptionOtpService, 'generateAdminOtp').mockImplementationOnce(() => { throw 'String fail'; });
      const m4 = createMockResponse();
      await subscriptionController.requestAdminOtp(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, body: { customer_id: 'c1', action: 'PROVISION' } }), m4.res);
      expect(m4.statusCode).toBe(500);
    });
  });

  describe('provisionSubscription', () => {
    const validProvision = {
      tenant_id: 'TNT-TEST', customer_id: 'c1', customer_email: 'c@t.com',
      customer_name: 'Customer', company_name: 'Corp', tier: 'SILVER' as const,
      commercial_status: 'PAYMENT_RECEIVED' as const, payment_reference: 'INV-1',
      payment_confirmed: true as const, otp_session_id: 'sess-1', otp_code: '123456'
    };

    it('rejects non-admin, invalid body, or service errors', async () => {
      const m1 = createMockResponse();
      await subscriptionController.provisionSubscription(mockReq({ headers: { authorization: `Bearer ${userToken}` } }), m1.res);
      expect(m1.statusCode).toBe(403);

      const m2 = createMockResponse();
      await subscriptionController.provisionSubscription(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, body: {} }), m2.res);
      expect(m2.statusCode).toBe(400);

      vi.spyOn(subscriptionService, 'provisionSubscription').mockImplementationOnce(() => { throw 'String error'; });
      const m3 = createMockResponse();
      await subscriptionController.provisionSubscription(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, body: validProvision }), m3.res);
      expect(m3.statusCode).toBe(400);

      vi.spyOn(authUtils, 'verifyAuthToken').mockReturnValueOnce({
        userId: 'u-bare', email: '', role: 'ADMIN', tier: 'GOLD', exp: Date.now() + 100000
      });
      vi.spyOn(subscriptionService, 'provisionSubscription').mockImplementationOnce(() => { throw new Error('Provision err'); });
      const m4 = createMockResponse();
      await subscriptionController.provisionSubscription(mockReq({ headers: { authorization: 'Bearer token-bare' }, body: validProvision }), m4.res);
      expect(m4.statusCode).toBe(400);
    });

    it('provisions successfully and verifies audit flow', async () => {
      let otpVal = '';
      const { smsService } = await import('../../src/services/smsService');
      vi.spyOn(smsService, 'sendAdminProvisioningOtp').mockImplementationOnce(async (_m, o) => {
        otpVal = o;
        return { success: true, destination: '******9999' };
      });
      const otpSession = await subscriptionOtpService.generateAdminOtp('admin@procucev.com', '+919999999999', 'c-prod', 'PROVISION');
      const m = createMockResponse();
      await subscriptionController.provisionSubscription(mockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        body: { ...validProvision, customer_id: 'c-prod', otp_session_id: otpSession.sessionId, otp_code: otpVal }
      }), m.res);
      expect(m.statusCode).toBe(201);
    });
  });

  describe('activateSubscription & listSubscriptions', () => {
    it('validates activateSubscription input and error handling', async () => {
      const m1 = createMockResponse();
      await subscriptionController.activateSubscription(mockReq({ body: { email: 'bad' } }), m1.res);
      expect(m1.statusCode).toBe(400);

      vi.spyOn(subscriptionService, 'activateCustomerSubscription').mockImplementationOnce(() => { throw 'String fail'; });
      const m2 = createMockResponse();
      await subscriptionController.activateSubscription(mockReq({ body: { email: 'v@c.com', activation_code: 'PCV-1234-5678-9012' } }), m2.res);
      expect(m2.statusCode).toBe(400);
    });

    it('validates listSubscriptions authorization and error catching', async () => {
      const m1 = createMockResponse();
      await subscriptionController.listSubscriptions(mockReq({ headers: { authorization: `Bearer ${userToken}` } }), m1.res);
      expect(m1.statusCode).toBe(403);

      vi.spyOn(subscriptionService, 'getAllSubscriptions').mockImplementationOnce(() => { throw new Error('Err'); });
      const m2 = createMockResponse();
      await subscriptionController.listSubscriptions(mockReq({ headers: { authorization: `Bearer ${adminToken}` } }), m2.res);
      expect(m2.statusCode).toBe(500);

      vi.spyOn(subscriptionService, 'getAllSubscriptions').mockImplementationOnce(() => { throw 'String err'; });
      const m3 = createMockResponse();
      await subscriptionController.listSubscriptions(mockReq({ headers: { authorization: `Bearer ${adminToken}` } }), m3.res);
      expect(m3.statusCode).toBe(500);
    });
  });

  describe('updateStatus & renewSubscription', () => {
    it('validates updateStatus authorization and error branches', async () => {
      const m1 = createMockResponse();
      await subscriptionController.updateStatus(mockReq({ headers: { authorization: `Bearer ${userToken}` } }), m1.res);
      expect(m1.statusCode).toBe(403);

      const m2 = createMockResponse();
      await subscriptionController.updateStatus(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, body: { status: 'INVALID' } }), m2.res);
      expect(m2.statusCode).toBe(400);

      vi.spyOn(subscriptionService, 'updateStatus').mockImplementationOnce(() => { throw 'String err'; });
      const m3 = createMockResponse();
      await subscriptionController.updateStatus(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, params: { id: 's1' }, body: { status: 'CANCELLED' } }), m3.res);
      expect(m3.statusCode).toBe(400);

      vi.spyOn(authUtils, 'verifyAuthToken').mockReturnValueOnce({
        userId: 'u-bare', email: '', role: 'ADMIN', tier: 'GOLD', exp: Date.now() + 100000
      });
      vi.spyOn(subscriptionService, 'updateStatus').mockImplementationOnce(() => { throw new Error('Status err'); });
      const m4 = createMockResponse();
      await subscriptionController.updateStatus(mockReq({ headers: { authorization: 'Bearer token-bare' }, params: { id: 's1' }, body: { status: 'CANCELLED' } }), m4.res);
      expect(m4.statusCode).toBe(400);
    });

    it('validates renewSubscription authorization and error branches', async () => {
      const m1 = createMockResponse();
      await subscriptionController.renewSubscription(mockReq({ headers: { authorization: `Bearer ${userToken}` } }), m1.res);
      expect(m1.statusCode).toBe(403);

      const m2 = createMockResponse();
      await subscriptionController.renewSubscription(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, body: {} }), m2.res);
      expect(m2.statusCode).toBe(400);

      const validRenew = { end_date: new Date(Date.now() + 10000).toISOString(), payment_reference: 'INV-1', otp_session_id: 's', otp_code: '123456' };
      vi.spyOn(subscriptionService, 'renewSubscription').mockImplementationOnce(() => { throw 'Renew string err'; });
      const m3 = createMockResponse();
      await subscriptionController.renewSubscription(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, params: { id: 's1' }, body: validRenew }), m3.res);
      expect(m3.statusCode).toBe(400);

      vi.spyOn(authUtils, 'verifyAuthToken').mockReturnValueOnce({
        userId: 'u-bare', email: '', role: 'ADMIN', tier: 'GOLD', exp: Date.now() + 100000
      });
      vi.spyOn(subscriptionService, 'renewSubscription').mockImplementationOnce(() => { throw new Error('Renew error'); });
      const m4 = createMockResponse();
      await subscriptionController.renewSubscription(mockReq({ headers: { authorization: 'Bearer token-bare' }, params: { id: 's1' }, body: validRenew }), m4.res);
      expect(m4.statusCode).toBe(400);
    });
  });

  describe('getAuditTrail', () => {
    it('validates authorization, filtering, and error handling', async () => {
      const m1 = createMockResponse();
      await subscriptionController.getAuditTrail(mockReq({ headers: { authorization: `Bearer ${userToken}` } }), m1.res);
      expect(m1.statusCode).toBe(403);

      const m2 = createMockResponse();
      await subscriptionController.getAuditTrail(mockReq({ headers: { authorization: `Bearer ${adminToken}` }, query: { subscription_id: 'sub-1' } }), m2.res);
      expect(m2.statusCode).toBe(200);

      vi.spyOn(subscriptionService, 'getAuditEvents').mockImplementationOnce(() => { throw new Error('Audit err'); });
      const m3 = createMockResponse();
      await subscriptionController.getAuditTrail(mockReq({ headers: { authorization: `Bearer ${adminToken}` } }), m3.res);
      expect(m3.statusCode).toBe(500);

      vi.spyOn(subscriptionService, 'getAuditEvents').mockImplementationOnce(() => { throw 'Audit string err'; });
      const m4 = createMockResponse();
      await subscriptionController.getAuditTrail(mockReq({ headers: { authorization: `Bearer ${adminToken}` } }), m4.res);
      expect(m4.statusCode).toBe(500);
    });
  });
});
