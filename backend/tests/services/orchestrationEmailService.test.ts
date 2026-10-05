import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrchestrationEmailService } from '../../src/services/orchestrationEmailService';
import type { ReportNotificationPayload } from '../../src/services/orchestrationEmailService';
import nodemailer from 'nodemailer';

vi.mock('nodemailer');

describe('OrchestrationEmailService Unit Tests', () => {
  let service: OrchestrationEmailService;
  const mockPayload: ReportNotificationPayload = {
    customerName: 'Sriman Industries',
    customerEmail: 'sriman@example.com',
    analysisPeriod: 'FY 2024-25',
    spendAnalysedText: '₹5,920.35 Cr',
    workspaceUrl: 'http://localhost:3000/#report-summary',
    reportVersionId: 'REP-V1.0'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    service = new OrchestrationEmailService();
  });

  it('should initialize and fallback gracefully when SMTP is not configured', async () => {
    const result = await service.sendReportReadyNotification(mockPayload);
    expect(result.success).toBe(true);
    expect(result.status).toBe('SENT');
    expect(result.messageId).toBeDefined();

    const deliveryStatus = service.getDeliveryStatus(`${mockPayload.customerEmail}:${mockPayload.reportVersionId}`);
    expect(deliveryStatus).toBeDefined();
    expect(deliveryStatus?.status).toBe('SENT');
  });

  it('should initialize transporter when SMTP credentials exist in environment', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'pass123';

    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn() } as any);
    const configuredService = new OrchestrationEmailService();
    expect(configuredService).toBeDefined();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.example.com',
      port: 465,
      secure: true
    }));
  });

  it('should catch error if transporter creation throws', () => {
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'pass123';
    vi.mocked(nodemailer.createTransport).mockImplementationOnce(() => {
      throw new Error('Invalid config');
    });

    const errorService = new OrchestrationEmailService();
    expect(errorService).toBeDefined();
  });

  it('should deduplicate email dispatches if already sent without forceResend', async () => {
    const res1 = await service.sendReportReadyNotification(mockPayload);
    const res2 = await service.sendReportReadyNotification(mockPayload, false);

    expect(res1.messageId).toBe(res2.messageId);
  });

  it('should allow forceResend of notification email', async () => {
    const res1 = await service.sendReportReadyNotification(mockPayload);
    const res2 = await service.sendReportReadyNotification(mockPayload, true);

    expect(res2.success).toBe(true);
  });

  it('should handle transporter sendMail success when transporter is active', async () => {
    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'real-msg-123' });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail
    } as any);

    const activeService = new OrchestrationEmailService();
    // Simulate active transporter
    (activeService as any).transporter = { sendMail: mockSendMail };

    const result = await activeService.sendReportReadyNotification(mockPayload);
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('real-msg-123');
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should handle transporter sendMail failure gracefully', async () => {
    const mockSendMail = vi.fn().mockRejectedValue(new Error('SMTP Connection timeout'));
    const activeService = new OrchestrationEmailService();
    (activeService as any).transporter = { sendMail: mockSendMail };

    const result = await activeService.sendReportReadyNotification(mockPayload);
    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('SMTP Connection timeout');
  });

  it('should clear delivery history', async () => {
    await service.sendReportReadyNotification(mockPayload);
    const dedupeKey = `${mockPayload.customerEmail}:${mockPayload.reportVersionId}`;
    expect(service.getDeliveryStatus(dedupeKey)).toBeDefined();

    service.clearDeliveryHistory();
    expect(service.getDeliveryStatus(dedupeKey)).toBeUndefined();
  });
});
