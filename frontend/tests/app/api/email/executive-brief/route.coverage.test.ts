import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import nodemailer from 'nodemailer';
import { POST } from '@/app/api/email/executive-brief/route';

// nodemailer is mocked for every test so no real mail can leave the test run.
vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn() }
}));

const ROUTE_URL = 'http://localhost:3000/api/email/executive-brief';
const RESEND_URL = 'https://api.resend.com/emails';
const EMAIL_ENV_KEYS = [
  'RESEND_API_KEY',
  'RESEND_FROM',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_GATEWAY_USER',
  'EMAIL_GATEWAY_PASSWORD'
];
const BUYER_EMAIL = 'cfo@client.example';
const RESEND_MESSAGE_ID = 'email_msg_123';
const SMTP_MESSAGE_ID = '<smtp-message-1@example.test>';
const SMTP_HOST = 'smtp.example.test';
const SMTP_USER = 'mailer@procucev.example';
const SMTP_PASSWORD = 'smtp-secret-value';
const EDGE_PROXY_MESSAGE_PATTERN = /RESEND_API_KEY/;

const mockSendMail = vi.fn();

const buildPayload = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  buyerEmail: BUYER_EMAIL,
  tenantName: 'Acme Industries',
  totalSpendInrCr: 1200,
  totalSavingsInrCr: 96,
  cleanLineItemsCount: 4200,
  categories: [
    { name: 'Cement', spend_inr_crores: 100, lineItemsCount: 5 },
    { name: 'Steel', spend: 50 },
    { name: 'Miscellaneous' }
  ],
  opportunities: [
    { category: 'Packaging', est_savings_inr_cr: 12.5, target_savings_pct: 8, push_to_module: 'DPS NXT' },
    { category: 'Freight' }
  ],
  ...overrides
});

const sendRequest = async (
  payload: unknown,
  rawBody?: string
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const request = new Request(ROUTE_URL, {
    method: 'POST',
    body: rawBody ?? JSON.stringify(payload)
  });
  const response = await POST(request);
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

const stubResendResponse = (response: {
  ok: boolean;
  status: number;
  body?: unknown;
  unreadableBody?: boolean;
}): ReturnType<typeof vi.fn> => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: response.unreadableBody
      ? () => Promise.reject(new SyntaxError('Unexpected token in response'))
      : async () => response.body
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const readResendRequestBody = (fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> => {
  const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
  return JSON.parse(init.body) as Record<string, unknown>;
};

describe('Executive Brief Email Route coverage', () => {
  beforeEach(() => {
    EMAIL_ENV_KEYS.forEach((key) => vi.stubEnv(key, ''));
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as never);
    mockSendMail.mockResolvedValue({ messageId: SMTP_MESSAGE_ID });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('recipient validation', () => {
    it('rejects a request without a recipient address', async () => {
      const { status, body } = await sendRequest(buildPayload({ buyerEmail: '' }));

      expect(status).toBe(400);
      expect(body.success).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('rejects a recipient value that is not text', async () => {
      const { status, body } = await sendRequest(buildPayload({ buyerEmail: 12345 }));

      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('rejects a recipient value that has no @ sign', async () => {
      const { status, body } = await sendRequest(buildPayload({ buyerEmail: 'not-an-address' }));

      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns a server error when the request body is not JSON', async () => {
      const { status, body } = await sendRequest(undefined, '{not valid json');

      expect(status).toBe(500);
      expect(body.success).toBe(false);
    });
  });

  describe('commercial metrics', () => {
    it('derives every commercial figure from spend and savings when none are supplied', async () => {
      stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(200);
      expect(body.messageId).toBe(RESEND_MESSAGE_ID);
      expect(body.commercialMetrics).toMatchObject({
        annualSpendCr: 1200,
        grossSavingsCr: 96,
        platformFeeCr: 10.2,
        netClientBenefitCr: 86.4,
        roiMultiple: '11.1',
        savingsRate: 8,
        paybackMonths: '1.1'
      });
    });

    it('uses zero-based fallbacks when no spend or savings are reported', async () => {
      stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { body } = await sendRequest({ buyerEmail: BUYER_EMAIL });

      expect(body.commercialMetrics).toMatchObject({
        annualSpendCr: 0,
        grossSavingsCr: 0,
        platformFeeCr: 0,
        netClientBenefitCr: 0,
        roiMultiple: '0.0',
        savingsRate: 16.4,
        paybackMonths: '1.1'
      });
    });

    it('prefers caller-supplied commercial metrics and formats the ROI to one decimal', async () => {
      stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { body } = await sendRequest(
        buildPayload({
          commercialMetrics: {
            netClientBenefitCr: 50,
            roiMultiple: 3.456,
            grossSavingsCr: 70,
            platformFeeCr: 5,
            paybackMonths: 4.5,
            savingsRate: 12.5
          }
        })
      );

      expect(body.commercialMetrics).toMatchObject({
        grossSavingsCr: 70,
        platformFeeCr: 5,
        netClientBenefitCr: 50,
        roiMultiple: '3.5',
        savingsRate: 12.5,
        paybackMonths: 4.5
      });
    });

    it('uses the default payback when the supplied ROI is zero', async () => {
      stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { body } = await sendRequest(buildPayload({ totalSavingsInrCr: 0, commercialMetrics: { roiMultiple: 0 } }));

      expect(body.commercialMetrics).toMatchObject({ roiMultiple: '0.0', paybackMonths: '1.1' });
    });
  });

  describe('Resend delivery', () => {
    it('sends the deck through Resend with the default sender and reports the message id', async () => {
      const fetchMock = stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.messageId).toBe(RESEND_MESSAGE_ID);
      expect(fetchMock).toHaveBeenCalledWith(RESEND_URL, expect.objectContaining({ method: 'POST' }));
      expect(readResendRequestBody(fetchMock)).toMatchObject({
        from: expect.any(String),
        to: [BUYER_EMAIL]
      });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('uses a configured Resend sender address', async () => {
      const fetchMock = stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');
      vi.stubEnv('RESEND_FROM', 'decks@client.example');

      await sendRequest(buildPayload());

      expect(readResendRequestBody(fetchMock)).toMatchObject({ from: 'decks@client.example' });
    });

    it('generates a timestamped message id when Resend returns none', async () => {
      stubResendResponse({ ok: true, status: 200, body: {} });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(200);
      expect(String(body.messageId)).toMatch(/^resend_\d+$/);
    });

    it('reports the top-level error message from a rejected Resend request', async () => {
      stubResendResponse({ ok: false, status: 422, body: { message: 'Quota exceeded for this key' } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Quota exceeded for this key');
    });

    it('reports the nested error message when the top-level message is absent', async () => {
      stubResendResponse({ ok: false, status: 403, body: { error: { message: 'Sender domain not verified' } } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(body.message).toBe('Sender domain not verified');
    });

    it('reports the HTTP status when the rejected Resend response has no readable body', async () => {
      stubResendResponse({ ok: false, status: 503, unreadableBody: true });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(body.message).toContain('503');
    });

    it('reports the edge guidance when the outbound request is blocked by a proxy', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('proxy request failed')));
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(String(body.message)).toMatch(EDGE_PROXY_MESSAGE_PATTERN);
    });

    it('reports the edge guidance when the outbound request fails at the socket level', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket hang up')));
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(String(body.message)).toMatch(EDGE_PROXY_MESSAGE_PATTERN);
    });

    it('reports a fallback message when the failure carries no message at all', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(undefined));
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(body.message).toEqual(expect.any(String));
      expect(String(body.message).length).toBeGreaterThan(0);
    });

    it('renders category and opportunity rows from the submitted payload', async () => {
      const fetchMock = stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      await sendRequest(buildPayload());

      const html = String(readResendRequestBody(fetchMock).html);
      expect(html).toContain('Cement');
      expect(html).toContain('100.00');
      expect(html).toContain('50.00');
      expect(html).toContain('Packaging');
      expect(html).toContain('12.50');
      expect(html).toContain('Freight');
    });

    it('renders the aggregate spend rows when categories and opportunities are empty', async () => {
      const fetchMock = stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      await sendRequest(buildPayload({ categories: [], opportunities: [] }));

      expect(String(readResendRequestBody(fetchMock).html)).toContain('1200.00');
    });

    it('treats non-list category and opportunity values as empty', async () => {
      const fetchMock = stubResendResponse({ ok: true, status: 200, body: { id: RESEND_MESSAGE_ID } });
      vi.stubEnv('RESEND_API_KEY', 're_test_key');

      const { status } = await sendRequest(buildPayload({ categories: 'none', opportunities: { none: true } }));

      expect(status).toBe(200);
      expect(String(readResendRequestBody(fetchMock).html)).toContain('1200.00');
    });
  });

  describe('SMTP delivery', () => {
    it('sends through the configured SMTP host, port, and credentials', async () => {
      vi.stubEnv('SMTP_HOST', SMTP_HOST);
      vi.stubEnv('SMTP_PORT', '587');
      vi.stubEnv('SMTP_USER', SMTP_USER);
      vi.stubEnv('SMTP_PASSWORD', SMTP_PASSWORD);

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(200);
      expect(body.messageId).toBe(SMTP_MESSAGE_ID);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: SMTP_HOST,
        port: 587,
        secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
      });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: BUYER_EMAIL,
          from: expect.stringContaining(SMTP_USER),
          subject: expect.stringContaining('Acme Industries')
        })
      );
    });

    it('uses implicit TLS on port 465 and the gateway credentials when SMTP settings are absent', async () => {
      vi.stubEnv('EMAIL_GATEWAY_USER', 'gateway@procucev.example');
      vi.stubEnv('EMAIL_GATEWAY_PASSWORD', 'gateway-secret');

      const { status } = await sendRequest(buildPayload());

      expect(status).toBe(200);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: 'gateway@procucev.example', pass: 'gateway-secret' }
      });
    });

    it('honours an explicit TLS flag on a non-standard port', async () => {
      vi.stubEnv('SMTP_HOST', SMTP_HOST);
      vi.stubEnv('SMTP_PORT', '2525');
      vi.stubEnv('SMTP_SECURE', 'true');
      vi.stubEnv('SMTP_USER', SMTP_USER);
      vi.stubEnv('SMTP_PASSWORD', SMTP_PASSWORD);

      await sendRequest(buildPayload());

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ host: SMTP_HOST, port: 2525, secure: true })
      );
    });

    it('applies default sender and tenant values when the payload omits them', async () => {
      vi.stubEnv('SMTP_USER', SMTP_USER);
      vi.stubEnv('SMTP_PASSWORD', SMTP_PASSWORD);

      const { status, body } = await sendRequest({ buyerEmail: BUYER_EMAIL });

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: expect.stringContaining('Enterprise Client') })
      );
    });

    it('rejects delivery when neither Resend nor SMTP credentials are configured', async () => {
      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('rejects delivery when an SMTP user is set without a password', async () => {
      vi.stubEnv('SMTP_USER', SMTP_USER);

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('reports the failure when the SMTP transport rejects the message', async () => {
      vi.stubEnv('SMTP_HOST', SMTP_HOST);
      vi.stubEnv('SMTP_USER', SMTP_USER);
      vi.stubEnv('SMTP_PASSWORD', SMTP_PASSWORD);
      mockSendMail.mockRejectedValueOnce(new Error('Connection refused by relay'));

      const { status, body } = await sendRequest(buildPayload());

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Connection refused by relay');
    });
  });
});
