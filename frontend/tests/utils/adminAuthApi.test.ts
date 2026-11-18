import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminAuthApiClient } from '../../src/utils/adminAuthApi';
import { authApiClient } from '../../src/utils/authApi';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import frontendLogger from '../../src/utils/logger';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

describe('Admin Auth API Client (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject non-administrator stored user before calling provisioning API', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-buyer-001',
      name: 'Buyer User',
      email: 'buyer@company.com',
      role: 'USER',
      status: 'ACTIVE',
      subscription_tier: 'BRONZE'
    });
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      adminAuthApiClient.createAdminUser({
        name: 'Rogue Admin',
        email: 'rogue@company.com',
        mobile_number: '+91 99999 11111',
        company_name: 'Buyer Co',
        company_address: 'Bangalore, India',
        password: 'TestPassword@123'
      })
    ).rejects.toThrow(UI_STRINGS.admin.accessDeniedMessage);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should provision admin user using stored admin session token when no explicit token is passed', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-admin-001',
      name: 'Existing Admin',
      email: 'ops@company.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    });
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('stored-admin-token');

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Admin details created and verified successfully',
        user: {
          id: 'usr-admin-002',
          name: 'Second Admin',
          email: 'second@company.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          subscription_tier: 'GOLD'
        }
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await adminAuthApiClient.createAdminUser({
      name: 'Second Admin',
      email: 'second@company.com',
      mobile_number: '+91 99999 11111',
      company_name: 'aiCEV Corp',
      company_address: 'Bangalore, India',
      password: 'TestPassword@123'
    });
    expect(res.success).toBe(true);
    expect(res.user.email).toBe('second@company.com');
    expectApiFetchCall(mockFetch, expect.stringContaining('/api/admin/create-admin'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer stored-admin-token'
      })
    }));
  });

  it('should provision admin user with explicit payload and token', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('stored-token-123');

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Admin details created and verified successfully',
        user: {
          id: 'usr-admin-custom',
          name: 'Custom Admin',
          email: 'custom@procucev.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          subscription_tier: 'GOLD'
        }
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await adminAuthApiClient.createAdminUser({
      name: 'Custom Admin',
      email: 'custom@procucev.com',
      password: 'Procucev@123',
      mobile_number: '+91 99999 11111',
      company_name: 'aiCEV Custom',
      company_address: 'Bangalore'
    }, 'explicit-token-456');

    expect(res.success).toBe(true);
    expect(res.user.email).toBe('custom@procucev.com');
    expectApiFetchCall(mockFetch, expect.stringContaining('/api/admin/create-admin'), expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer explicit-token-456'
        })
      }));
  });

  it('rejects failed administrator provisioning instead of inventing a local database user', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    await expect(adminAuthApiClient.createAdminUser({
      name: 'Offline Admin',
      email: 'offline@company.com',
      mobile_number: '+91 99999 11111',
      company_name: 'aiCEV Custom',
      company_address: 'Bangalore',
      password: 'TestPassword@123'
    })).rejects.toThrow('Network error');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('reports a rejected provisioning request with its HTTP status when the error body is not JSON', async () => {
    const unreadableFailure = new SyntaxError('Unexpected token <');
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValueOnce(unreadableFailure)
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(adminAuthApiClient.createAdminUser({
      name: 'Offline Admin',
      email: 'offline@company.com',
      mobile_number: '+91 99999 11111',
      company_name: 'aiCEV Custom',
      company_address: 'Bangalore',
      password: 'TestPassword@123'
    })).rejects.toThrow(UI_STRINGS.admin.provisioningFailureWithStatus(502));
    expect(frontendLogger.warn).toHaveBeenCalledWith(expect.any(String), { status: 502 }, unreadableFailure);
    expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { status: 502 });
  });

  it('should throw validation error if payload is invalid', async () => {
    await expect(
      adminAuthApiClient.createAdminUser({
        email: 'invalid-email',
        password: '123'
      })
    ).rejects.toThrow(/Validation failed/);
  });

  it('should throw error in production environment when server returns error message', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Administrator with this email already exists' })
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      adminAuthApiClient.createAdminUser({
        name: 'Prod Admin',
        email: 'prod@procucev.com',
        mobile_number: '+91 99999 11111',
        company_name: 'aiCEV Prod',
        company_address: 'Bangalore',
        password: 'TestPassword@123'
      })
    ).rejects.toThrow('Administrator with this email already exists');

    vi.unstubAllEnvs();
  });

  it('should throw HTTP status error in production environment when server response is not JSON', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => { throw new Error('Not JSON'); }
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      adminAuthApiClient.createAdminUser({
        name: 'Prod Admin',
        email: 'prod@procucev.com',
        mobile_number: '+91 99999 11111',
        company_name: 'aiCEV Prod',
        company_address: 'Bangalore',
        password: 'TestPassword@123'
      })
    ).rejects.toThrow(UI_STRINGS.admin.provisioningFailureWithStatus(502));

    vi.unstubAllEnvs();
  });
});
