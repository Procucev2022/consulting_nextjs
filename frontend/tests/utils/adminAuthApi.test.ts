import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminAuthApiClient } from '../../src/utils/adminAuthApi';
import { authApiClient } from '../../src/utils/authApi';

describe('Admin Auth API Client (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provision admin user with default credentials when no payload provided', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Admin details created and verified successfully',
        user: {
          id: 'usr-admin-001',
          name: 'System Administrator',
          email: 'admin@procucev.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          subscription_tier: 'GOLD'
        }
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await adminAuthApiClient.createAdminUser();
    expect(res.success).toBe(true);
    expect(res.user.email).toBe('admin@procucev.com');
    expect(res.user.role).toBe('ADMIN');
    expect(mockFetch).toHaveBeenCalledTimes(1);
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
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/create-admin'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer explicit-token-456'
        })
      })
    );
  });

  it('rejects failed administrator provisioning instead of inventing a local database user', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    await expect(adminAuthApiClient.createAdminUser({
      name: 'Offline Admin',
      email: 'admin@procucev.com',
      password: 'Procucev@123'
    })).rejects.toThrow('Network error');
    expect(mockFetch).toHaveBeenCalledTimes(1);
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
        password: 'Procucev@123'
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
        password: 'Procucev@123'
      })
    ).rejects.toThrow('Failed to provision administrator (HTTP 502)');

    vi.unstubAllEnvs();
  });
});
