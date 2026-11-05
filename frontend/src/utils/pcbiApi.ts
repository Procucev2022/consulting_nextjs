import { apiFetch } from './apiFetch';
import frontendLogger from './logger';
import { authApiClient } from './authApi';
import { PCBI_HISTORICAL_OBSERVATIONS_ENDPOINT } from '../constants/pcbiHistorical';
import { pcbiHistoricalObservationsQuerySchema, pcbiHistoricalObservationsResponseSchema } from '../constants/validation';
import { UI_STRINGS } from '../constants/uiStrings';
import type {
  PcbiHistoricalObservationsParsedQuery,
  PcbiHistoricalObservationsQuery,
  PcbiHistoricalObservationsResponse
} from '../types/validation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const buildHistoricalObservationSearch = (query: PcbiHistoricalObservationsParsedQuery): URLSearchParams => {
  const search = new URLSearchParams({ limit: String(query.limit) });
  const filters = [
    ['pcbiId', query.pcbiId],
    ['startDate', query.startDate],
    ['endDate', query.endDate]
  ] as const;
  for (const [key, value] of filters) {
    if (value) search.set(key, value);
  }
  return search;
};

const getHistoricalRequestReference = (requestId: string | undefined): string =>
  requestId || UI_STRINGS.pcbiAdmin.historicalRequestIdUnavailable;

const adminApiHeaders = (includeJson = false): Record<string, string> => {
  const token = authApiClient.getStoredToken();
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

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
    const res = await apiFetch(`${API_BASE}/api/pcbi/dashboard`);
    return await res.json();
  },

  async getPCBIMasterBenchmarks(sector?: string): Promise<Record<string, unknown>> {
    const url = sector
      ? `${API_BASE}/api/pcbi/master/benchmarks?sector=${encodeURIComponent(sector)}`
      : `${API_BASE}/api/pcbi/master/benchmarks`;
    const res = await apiFetch(url);
    return await res.json();
  },

  async getPCBIWeeklyIndices(pcbiId: string, limit = 52): Promise<Record<string, unknown>> {
    const res = await apiFetch(`${API_BASE}/api/pcbi/indices/${encodeURIComponent(pcbiId)}?limit=${limit}`);
    return await res.json();
  },

  async getPCBIHistoricalObservations(
    params: PcbiHistoricalObservationsQuery = {}
  ): Promise<PcbiHistoricalObservationsResponse> {
    const query = pcbiHistoricalObservationsQuerySchema.safeParse(params);
    if (!query.success) {
      const error = new Error(UI_STRINGS.pcbiAdmin.historicalObservationsInvalidQuery);
      frontendLogger.warn('Rejected invalid PCBI historical observation query', {
        issues: query.error.issues
      }, error);
      throw error;
    }

    const search = buildHistoricalObservationSearch(query.data);

    let requestId: string | undefined;
    try {
      const response = await apiFetch(`${API_BASE}${PCBI_HISTORICAL_OBSERVATIONS_ENDPOINT}?${search.toString()}`);
      requestId = response.headers.get('x-request-id') || undefined;
      if (!response.ok) {
        const error = new Error(UI_STRINGS.pcbiAdmin.historicalObservationsHttpFailure(
          response.status, getHistoricalRequestReference(requestId)
        ));
        throw error;
      }
      const body: unknown = await response.json();
      const parsed = pcbiHistoricalObservationsResponseSchema.safeParse(body);
      if (!parsed.success) {
        const error = new Error(UI_STRINGS.pcbiAdmin.historicalObservationsInvalidResponse(
          getHistoricalRequestReference(requestId)
        ));
        throw error;
      }
      frontendLogger.info('Loaded archived monthly PCBI observations', {
        requestId, observationCount: parsed.data.data.count
      });
      return parsed.data;
    } catch (error) {
      frontendLogger.error('Could not load PCBI historical observations', {
        requestId,
        endpoint: PCBI_HISTORICAL_OBSERVATIONS_ENDPOINT
      }, error);
      throw error;
    }
  },

  async submitUpgradeRequest(payload: SubmitUpgradePayload): Promise<Record<string, unknown>> {
    frontendLogger.info('Submitting customer upgrade request', { payload });
    const res = await apiFetch(`${API_BASE}/api/upgrade/request`, {
      method: 'POST',
      headers: adminApiHeaders(true),
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getUpgradeRequests(status?: string): Promise<Record<string, unknown>> {
    const url = status
      ? `${API_BASE}/api/upgrade/requests?status=${encodeURIComponent(status)}`
      : `${API_BASE}/api/upgrade/requests`;
    const res = await apiFetch(url, { headers: adminApiHeaders() });
    return await res.json();
  },

  async generateUpgradeOTP(requestId: string, adminUserId?: string): Promise<Record<string, unknown>> {
    frontendLogger.info('Admin generating upgrade OTP code', { requestId });
    const res = await apiFetch(`${API_BASE}/api/upgrade/generate-otp`, {
      method: 'POST',
      headers: adminApiHeaders(true),
      body: JSON.stringify({ requestId, adminUserId })
    });
    return await res.json();
  },

  async getPCBIBenchmarks(): Promise<Record<string, unknown>> {
    const res = await apiFetch(`${API_BASE}/api/pcbi/benchmarks`);
    return await res.json();
  },

  async requestAdminUpgradeOTP(requestId: string): Promise<Record<string, unknown>> {
    const res = await apiFetch(`${API_BASE}/api/upgrade/admin/request-otp`, {
      method: 'POST',
      headers: adminApiHeaders(true),
      body: JSON.stringify({ request_id: requestId })
    });
    return await res.json();
  },

  async verifyAdminUpgradeOTP(requestId: string, otp: string): Promise<Record<string, unknown>> {
    const res = await apiFetch(`${API_BASE}/api/upgrade/admin/verify-otp-and-generate-code`, {
      method: 'POST',
      headers: adminApiHeaders(true),
      body: JSON.stringify({ request_id: requestId, otp })
    });
    return await res.json();
  },

  async loginWithUpgradeCode(email: string, code: string): Promise<Record<string, unknown>> {
    frontendLogger.info('Customer logging in via unique upgrade code', { email });
    const res = await apiFetch(`${API_BASE}/api/upgrade/login-with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return await res.json();
  }
};
