import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SmsService,
  DefaultSmsProvider,
  maskMobileNumber,
  smsService
} from '../../src/services/smsService';

describe('SmsService & DefaultSmsProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('maskMobileNumber', () => {
    it('masks phone numbers safely', () => {
      expect(maskMobileNumber('+91 98765 43210')).toBe('+91******3210');
      expect(maskMobileNumber('9876543210')).toBe('******3210');
      expect(maskMobileNumber('12')).toBe('****');
      expect(maskMobileNumber('')).toBe('****');
    });
  });

  describe('DefaultSmsProvider', () => {
    it('dispatches simulated SMS when external gateway is not configured', async () => {
      delete process.env.SMS_GATEWAY_API_KEY;
      delete process.env.SMS_GATEWAY_URL;

      const provider = new DefaultSmsProvider();
      const res = await provider.sendSms('+91 99000 11223', 'Your verification code is 123456');

      expect(res.success).toBe(true);
      expect(res.messageId).toMatch(/^sms-/);
      expect(res.destination).toContain('1223');
    });

    it('dispatches to external gateway when configured', async () => {
      process.env.SMS_GATEWAY_API_KEY = 'test-key';
      process.env.SMS_GATEWAY_URL = 'https://api.sms-gateway.example/send';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messageId: 'ext-msg-123' })
      });
      global.fetch = mockFetch;

      const provider = new DefaultSmsProvider();
      const res = await provider.sendSms('+91 99000 11223', 'Your code is 654321');

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('ext-msg-123');

      delete process.env.SMS_GATEWAY_API_KEY;
      delete process.env.SMS_GATEWAY_URL;
    });

    it('handles external gateway non-ok response', async () => {
      process.env.SMS_GATEWAY_API_KEY = 'test-key';
      process.env.SMS_GATEWAY_URL = 'https://api.sms-gateway.example/send';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      });
      global.fetch = mockFetch;

      const provider = new DefaultSmsProvider();
      const res = await provider.sendSms('+91 99000 11223', 'Your code is 654321');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Gateway returned status 401');

      delete process.env.SMS_GATEWAY_API_KEY;
      delete process.env.SMS_GATEWAY_URL;
    });

    it('handles network failure during gateway fetch', async () => {
      process.env.SMS_GATEWAY_API_KEY = 'test-key';
      process.env.SMS_GATEWAY_URL = 'https://api.sms-gateway.example/send';

      global.fetch = vi.fn().mockRejectedValue(new Error('Connection timeout'));

      const provider = new DefaultSmsProvider();
      const res = await provider.sendSms('+91 99000 11223', 'Your code is 654321');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Connection timeout');

      delete process.env.SMS_GATEWAY_API_KEY;
      delete process.env.SMS_GATEWAY_URL;
    });
  });

  describe('SmsService class', () => {
    it('sends Admin provisioning OTP with custom provider', async () => {
      const mockProvider = {
        name: 'MockCustomProvider',
        sendSms: vi.fn().mockResolvedValue({ success: true, messageId: 'custom-123', destination: '******1234' })
      };

      const customService = new SmsService(mockProvider);
      const res = await customService.sendAdminProvisioningOtp('+91 98765 12345', '123456', 'CLI-001');

      expect(res.success).toBe(true);
      expect(mockProvider.sendSms).toHaveBeenCalled();

      // Test setProvider
      const anotherProvider = {
        name: 'AnotherProvider',
        sendSms: vi.fn().mockResolvedValue({ success: true, destination: '******9999' })
      };
      customService.setProvider(anotherProvider);
      await customService.sendAdminProvisioningOtp('+91 98765 99999', '654321', 'CLI-002');
      expect(anotherProvider.sendSms).toHaveBeenCalled();
    });

    it('uses singleton smsService instance', async () => {
      const res = await smsService.sendAdminProvisioningOtp('+91 98765 43210', '999888', 'CLI-GLOBAL');
      expect(res.success).toBe(true);
      expect(res.destination).toContain('3210');
    });
  });
});
