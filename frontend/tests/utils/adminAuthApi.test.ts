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

  it('should fall back to development mock if network request fails', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const res = await adminAuthApiClient.createAdminUser({
      name: 'Offline Admin',
      email: 'admin@procucev.com',
      password: 'Procucev@123'
    });

    expect(res.success).toBe(true);
    expect(res.user.email).toBe('admin@procucev.com');
    expect(res.user.role).toBe('ADMIN');
    expect(res.message).toContain('Development Fallback');
  });

  it('should throw validation error if payload is invalid', async () => {
    await expect(
      adminAuthApiClient.createAdminUser({
        email: 'invalid-email',
        password: '123'
      })
    ).rejects.toThrow(/Validation failed/);
  });
});
