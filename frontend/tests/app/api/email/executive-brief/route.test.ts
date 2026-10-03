import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/email/executive-brief/route';

describe('Executive Brief Email Route (/api/email/executive-brief)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if recipient email is invalid or missing', async () => {
    const req = new Request('http://localhost:3000/api/email/executive-brief', {
      method: 'POST',
      body: JSON.stringify({ buyerEmail: 'invalid-email' })
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should send email via Resend API when RESEND_API_KEY is configured', async () => {
    process.env.RESEND_API_KEY = 're_test_12345';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_msg_123' })
    });
    global.fetch = mockFetch;

    const req = new Request('http://localhost:3000/api/email/executive-brief', {
      method: 'POST',
      body: JSON.stringify({
        buyerEmail: 'cfo@enterprise.com',
        tenantName: 'Acme Global',
        totalSpendInrCr: 100,
        totalSavingsInrCr: 15,
        cleanLineItemsCount: 500,
        categories: [{ name: 'Direct Steel', spend_inr_crores: 50, lineItemsCount: 200 }],
        opportunities: [{ category: 'Direct Steel', est_savings_inr_cr: 8, target_savings_pct: 16 }]
      })
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.messageId).toBe('email_msg_123');

    delete process.env.RESEND_API_KEY;
  });

  it('should handle SMTP failure error gracefully', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    const req = new Request('http://localhost:3000/api/email/executive-brief', {
      method: 'POST',
      body: JSON.stringify({
        buyerEmail: 'cfo@enterprise.com'
      })
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
