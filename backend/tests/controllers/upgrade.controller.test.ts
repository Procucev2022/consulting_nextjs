import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { UpgradeController } from '../../src/controllers/upgrade.controller';
import { db } from '../../src/services/db';
import { upgradeEmailService } from '../../src/services/upgradeEmailService';

function createMockResponse(): { res: Response; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const res = {
    status,
    json
  } as unknown as Response;
  return { res, status, json };
}

describe('UpgradeController Unit Tests', () => {
  let controller: UpgradeController;

  beforeEach(() => {
    controller = new UpgradeController();
    vi.restoreAllMocks();
    vi.spyOn(upgradeEmailService, 'sendAdminUpgradeNotification').mockResolvedValue(undefined as never);
    vi.spyOn(upgradeEmailService, 'sendCustomerUniqueUpgradeCode').mockResolvedValue(undefined as never);
  });

  it('requestUpgrade should reject missing required fields', async () => {
    const { res, status, json } = createMockResponse();
    const req = { body: { customer_name: 'Test' } } as Request;

    await controller.requestUpgrade(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Customer name, email, and company name are required.'
      })
    );
  });

  it('requestUpgrade should create request and send email notification', async () => {
    const { res, status, json } = createMockResponse();
    const req = {
      body: {
        customer_name: 'Acme User',
        customer_email: 'user@acme.com',
        customer_phone: '1234567890',
        company_name: 'Acme Corp',
        current_tier: 'BRONZE',
        requested_tier: 'GOLD'
      }
    } as Request;

    await controller.requestUpgrade(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        request: expect.any(Object)
      })
    );
  });

  it('listUpgradeRequests should return requests list', async () => {
    const { res, json } = createMockResponse();
    const req = {} as Request;

    await controller.listUpgradeRequests(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: expect.any(Number),
        requests: expect.any(Array)
      })
    );
  });

  it('requestAdminOTP should validate request_id and create session', async () => {
    const { res: errRes, status: errStatus } = createMockResponse();
    await controller.requestAdminOTP({ body: {} } as Request, errRes);
    expect(errStatus).toHaveBeenCalledWith(400);

    const upgReq = db.createUpgradeRequest({
      customer_name: 'Sample',
      customer_email: 'sample@corp.com',
      company_name: 'Sample Corp',
      current_tier: 'BRONZE',
      requested_tier: 'GOLD'
    });

    const { res: successRes, json: successJson } = createMockResponse();
    await controller.requestAdminOTP({ body: { request_id: upgReq.id } } as Request, successRes);
    expect(successJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        request_id: upgReq.id
      })
    );
  });

  it('verifyOtpAndGenerateCode should verify OTP and generate unique code', async () => {
    const upgReq = db.createUpgradeRequest({
      customer_name: 'Sample OTP User',
      customer_email: 'sampleotp@corp.com',
      company_name: 'Sample Corp',
      current_tier: 'BRONZE',
      requested_tier: 'GOLD'
    });

    db.setAdminOtpSession({
      request_id: upgReq.id,
      admin_email: 'admin@procucev.com',
      admin_mobile: '+91 98765 43210',
      otp_code: '123456',
      expires_at: Date.now() + 600000,
      verified: false
    });

    const { res, json } = createMockResponse();
    const req = {
      body: {
        request_id: upgReq.id,
        otp: '123456'
      }
    } as Request;

    await controller.verifyOtpAndGenerateCode(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        code: expect.stringMatching(/^PCBI-UPG-/)
      })
    );
  });

  it('loginWithUpgradeCode should upgrade user and return JWT token', async () => {
    const upgReq = db.createUpgradeRequest({
      customer_name: 'Login User',
      customer_email: 'loginuser@corp.com',
      company_name: 'Login Corp',
      current_tier: 'BRONZE',
      requested_tier: 'GOLD'
    });

    const code = 'PCBI-UPG-9999-8888';
    db.updateUpgradeRequest(upgReq.id, {
      status: 'OTP_VERIFIED_CODE_SENT',
      generated_unique_code: code
    });

    const { res, json } = createMockResponse();
    const req = {
      body: {
        email: 'loginuser@corp.com',
        code
      }
    } as Request;

    await controller.loginWithUpgradeCode(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: expect.any(String),
        tier: 'GOLD'
      })
    );
  });
});
