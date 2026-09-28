import frontendLogger from './logger';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export interface PCBIOpportunityParams {
  search?: string;
  sector?: string;
  category?: string;
  vendor?: string;
  quality?: string;
  page?: number;
  limit?: number;
}

export interface ResetBasePurchasePayload {
  comparable_key: string;
  reason: string;
  user_name?: string;
}

export interface SubmitUpgradePayload {
  customer_user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string;
  company_details?: string;
  current_tier: string;
  requested_tier: string;
  requirements_note?: string;
}

export const pcbiApiClient = {
  async getPCBIDashboard(): Promise<Record<string, unknown>> {
    frontendLogger.debug('Fetching PCBI dashboard analytics');
    const res = await fetch(`${API_BASE}/api/pcbi/dashboard`);
    return await res.json();
  },

  async runPCBICalculation(transactions?: unknown[]): Promise<Record<string, unknown>> {
    frontendLogger.info('Triggering PCBI calculation engine');
    const res = await fetch(`${API_BASE}/api/pcbi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions })
    });
    return await res.json();
  },

  async getPCBIOpportunities(params?: PCBIOpportunityParams): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.sector) query.append('sector', params.sector);
    if (params?.category) query.append('category', params.category);
    if (params?.vendor) query.append('vendor', params.vendor);
    if (params?.quality) query.append('quality', params.quality);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/api/pcbi/opportunity?${query.toString()}`);
    return await res.json();
  },

  async getPCBIOpportunityAudit(id: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/pcbi/opportunity/${encodeURIComponent(id)}`);
    return await res.json();
  },

  async getPCBIBasePurchases(): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/pcbi/base-purchases`);
    return await res.json();
  },

  async resetPCBIBasePurchase(payload: ResetBasePurchasePayload): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/pcbi/base-purchase/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getPCBIMaterialTrend(comparableKey: string): Promise<Record<string, unknown>> {
    const q = new URLSearchParams({ comparable_key: comparableKey });
    const res = await fetch(`${API_BASE}/api/pcbi/material-trend?${q.toString()}`);
    return await res.json();
  },

  async getPCBIMasterBenchmarks(sector?: string): Promise<Record<string, unknown>> {
    const url = sector
      ? `${API_BASE}/api/pcbi/master/benchmarks?sector=${encodeURIComponent(sector)}`
      : `${API_BASE}/api/pcbi/master/benchmarks`;
    const res = await fetch(url);
    return await res.json();
  },

  async getPCBIWeeklyIndices(pcbiId: string, limit = 52): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/pcbi/indices/${encodeURIComponent(pcbiId)}?limit=${limit}`);
    return await res.json();
  },

  async submitUpgradeRequest(payload: SubmitUpgradePayload): Promise<Record<string, unknown>> {
    frontendLogger.info('Submitting customer upgrade request', { payload });
    const res = await fetch(`${API_BASE}/api/upgrade/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getUpgradeRequests(status?: string): Promise<Record<string, unknown>> {
    const url = status
      ? `${API_BASE}/api/upgrade/requests?status=${encodeURIComponent(status)}`
      : `${API_BASE}/api/upgrade/requests`;
    const res = await fetch(url);
    return await res.json();
  },

  async generateUpgradeOTP(requestId: string, adminUserId?: string): Promise<Record<string, unknown>> {
    frontendLogger.info('Admin generating upgrade OTP code', { requestId });
    const res = await fetch(`${API_BASE}/api/upgrade/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, adminUserId })
    });
    return await res.json();
  },

  async getPCBIBenchmarks(): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/pcbi/benchmarks`);
    return await res.json();
  },

  async requestAdminUpgradeOTP(requestId: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/upgrade/admin/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId })
    });
    return await res.json();
  },

  async verifyAdminUpgradeOTP(requestId: string, otp: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/upgrade/admin/verify-otp-and-generate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, otp })
    });
    return await res.json();
  },

  async loginWithUpgradeCode(email: string, code: string): Promise<Record<string, unknown>> {
    frontendLogger.info('Customer logging in via unique upgrade code', { email });
    const res = await fetch(`${API_BASE}/api/upgrade/login-with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return await res.json();
  }
};
