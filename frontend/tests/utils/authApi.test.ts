import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApiClient, buildAdminUserQueryParams } from '../../src/utils/authApi';
import { AUTH_STORAGE_KEYS } from '../../src/constants/auth';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { RegisterFormData, LoginFormData, UserProfile } from '../../src/types';

describe('authApiClient and auth utilities', () => {
  const mockUser: UserProfile = {
    id: 'usr-001',
    name: 'Rajesh Verma',
    mobile_number: '+91 98234 56789',
    email: 'rajesh.verma@company.com',
    company_name: 'Reliance Logistics',
    company_address: 'Nariman Point, Mumbai',
    role: 'USER',
    status: 'ACTIVE',
    subscription_tier: 'BRONZE',
    created_at: '2026-04-10T14:45:00.000Z',
    updated_at: '2026-04-10T14:45:00.000Z'
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Session Storage Helpers', () => {
    it('should manage stored auth tokens and user profiles in localStorage', () => {
      expect(authApiClient.getStoredToken()).toBeNull();
      expect(authApiClient.getStoredUser()).toBeNull();

      authApiClient.setStoredSession('token-12345', mockUser);
      expect(authApiClient.getStoredToken()).toBe('token-12345');
      expect(authApiClient.getStoredUser()).toEqual(mockUser);

      authApiClient.clearStoredSession();
      expect(authApiClient.getStoredToken()).toBeNull();
      expect(authApiClient.getStoredUser()).toBeNull();
    });

    it('should return null when stored user profile contains corrupted JSON', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, 'invalid-json-{');
      expect(authApiClient.getStoredUser()).toBeNull();
    });

    it('should not throw when sessionStorage.removeItem throws during clearStoredSession', () => {
      authApiClient.setStoredSession('token-xyz', mockUser);
      // Simulate sessionStorage.removeItem throwing (e.g., in private mode)
      const originalRemoveItem = sessionStorage.removeItem.bind(sessionStorage);
      vi.spyOn(sessionStorage, 'removeItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      // clearStoredSession should silently swallow the sessionStorage error
      expect(() => authApiClient.clearStoredSession()).not.toThrow();

      // Restore
      vi.spyOn(sessionStorage, 'removeItem').mockImplementation(originalRemoveItem);
    });
  });

  describe('buildAdminUserQueryParams', () => {
    it('should build empty query params when query is undefined or empty', () => {
      expect(buildAdminUserQueryParams().toString()).toBe('');
      expect(buildAdminUserQueryParams({}).toString()).toBe('');
    });

    it('should build query params with search, role, and status filters', () => {
      const params = buildAdminUserQueryParams({
        search: 'verma',
        role: 'USER',
        status: 'ACTIVE'
      });
      expect(params.get('search')).toBe('verma');
      expect(params.get('role')).toBe('USER');
      expect(params.get('status')).toBe('ACTIVE');
    });

    it('should ignore ALL role and ALL status filters', () => {
      const params = buildAdminUserQueryParams({
        role: 'ALL',
        status: 'ALL'
      });
      expect(params.get('role')).toBeNull();
      expect(params.get('status')).toBeNull();
    });
  });

  describe('parseResponseJson branch coverage (res.json fallback path)', () => {
    it('throws "Invalid response received from server" when res has no text() but res.json() throws and res.ok is true', async () => {
      // Craft a mock Response where typeof res.text !== 'function' (so it goes to else-if res.json)
      // but res.json() throws and res.ok is true → line 68 path in authApi.ts
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: undefined, // forces the else-if branch
        json: () => { throw new Error('JSON parse failure'); }
      });

      await expect(
        authApiClient.getMe('some-token')
      ).rejects.toThrow('Invalid response received from server');
    });

    it('throws Server error message when res has no text() but res.json() throws and res.ok is false', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: undefined,
        json: () => { throw new Error('JSON parse failure'); }
      });

      await expect(
        authApiClient.getMe('some-token')
      ).rejects.toThrow('Server error (503): Please ensure backend API server is running');
    });
  });

  describe('API Methods', () => {
    it('should register a new user successfully', async () => {
      const validRegisterData: RegisterFormData = {
        name: 'Rajesh Verma',
        mobile_number: '+91 98234 56789',
        email: 'rajesh.verma@company.com',
        company_name: 'Reliance Logistics',
        company_address: 'Nariman Point, Mumbai',
        password: 'ValidPassword@123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Account created successfully',
          user: mockUser,
          token: 'jwt-registered-123'
        })
      });

      const res = await authApiClient.register(validRegisterData);
      expect(res.success).toBe(true);
      expect(res.user.email).toBe(mockUser.email);
      expect(authApiClient.getStoredToken()).toBe('jwt-registered-123');
    });

    it('should throw validation error when registering with invalid fields', async () => {
      const invalidData = {
        name: 'A',
        email: 'not-an-email',
        mobile_number: '123'
      } as any;

      await expect(authApiClient.register(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should throw error when server returns error on registration', async () => {
      const validRegisterData: RegisterFormData = {
        name: 'Rajesh Verma',
        mobile_number: '+91 98234 56789',
        email: 'rajesh.verma@company.com',
        company_name: 'Reliance Logistics',
        company_address: 'Nariman Point, Mumbai',
        password: 'ValidPassword@123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Email already exists' })
      });

      await expect(authApiClient.register(validRegisterData)).rejects.toThrow('Email already exists');
    });

    it('should log in successfully and save session', async () => {
      const loginData: LoginFormData = {
        email: 'rajesh.verma@company.com',
        password: 'ValidPassword@123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: mockUser,
          token: 'jwt-login-456'
        })
      });

      const res = await authApiClient.login(loginData);
      expect(res.success).toBe(true);
      expect(authApiClient.getStoredToken()).toBe('jwt-login-456');
    });

    it('should support login with email and password as separate string arguments', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
          token: 'jwt-login-separate'
        })
      });

      const res = await authApiClient.login('rajesh.verma@company.com', 'ValidPassword@123');
      expect(res.success).toBe(true);
      expect(authApiClient.getStoredToken()).toBe('jwt-login-separate');
    });

    it('should throw validation error when login is called with email string and no password', async () => {
      await expect(authApiClient.login('rajesh.verma@company.com')).rejects.toThrow('Validation failed');
    });

    it('should throw error when login credentials fail on server', async () => {
      const loginData: LoginFormData = {
        email: 'rajesh.verma@company.com',
        password: 'WrongPassword'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' })
      });

      await expect(authApiClient.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('rejects an offline login for a development account without creating a local admin session', async () => {
      const loginData: LoginFormData = {
        email: 'sriman@procucev.com',
        password: 'sriman@123'
      };

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(authApiClient.login(loginData)).rejects.toThrow('Network error');
      expect(authApiClient.getStoredToken()).toBeNull();
      expect(authApiClient.getStoredUser()).toBeNull();
    });

    it('honors a D1 authentication rejection for a development account without granting GOLD access', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: 'Invalid credentials' })
      });

      await expect(authApiClient.login({ email: 'sriman@procucev.com', password: 'sriman@123' })).rejects.toThrow('Invalid credentials');
      expect(authApiClient.getStoredToken()).toBeNull();
      expect(authApiClient.getStoredUser()).toBeNull();
    });

    it('should re-throw error when fetch fails and no matching dev credential exists', async () => {
      const loginData: LoginFormData = {
        email: 'notadevuser@external.com',
        password: 'wrong-pass'
      };

      const networkErr = new Error('Network error');
      global.fetch = vi.fn().mockRejectedValue(networkErr);

      await expect(authApiClient.login(loginData)).rejects.toThrow('Network error');
    });

    it('should fetch current authenticated profile', async () => {
      authApiClient.setStoredSession('saved-token', mockUser);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, user: mockUser })
      });

      const res = await authApiClient.getMe();
      expect(res.success).toBe(true);
      expect(res.user.id).toBe(mockUser.id);
    });

    it('should throw error on getMe when no token exists', async () => {
      await expect(authApiClient.getMe()).rejects.toThrow('No authentication token found');
    });

    it('should throw error on getMe when server rejects token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Token expired' })
      });

      await expect(authApiClient.getMe('expired-token')).rejects.toThrow('Token expired');
    });

    it('should change password successfully with valid token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Password updated successfully' })
      });

      const res = await authApiClient.changePassword(
        { currentPassword: 'OldPassword@123', newPassword: 'NewPassword@456' },
        'valid-token'
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe('Password updated successfully');
    });

    it('should throw error when changing password without auth token', async () => {
      await expect(
        authApiClient.changePassword({ currentPassword: 'OldPassword@123', newPassword: 'NewPassword@456' })
      ).rejects.toThrow('Authentication required');
    });

    it('should fetch admin user directory with filters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          users: [mockUser],
          total: 1,
          activeCount: 1,
          suspendedCount: 0,
          adminCount: 0,
          companiesCount: 1
        })
      });

      const res = await authApiClient.getAdminUsers({ search: 'Rajesh', role: 'USER' }, 'admin-jwt');
      expect(res.total).toBe(1);
      expect(res.users[0].name).toBe('Rajesh Verma');
    });

    it('should throw error when getAdminUsers request fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Access denied' })
      });

      await expect(authApiClient.getAdminUsers()).rejects.toThrow('Access denied');
    });

    it('should update user status via admin portal', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, status: 'SUSPENDED' }
        })
      });

      const res = await authApiClient.updateAdminUserStatus(mockUser.id, 'SUSPENDED', 'admin-token');
      expect(res.success).toBe(true);
      expect(res.user.status).toBe('SUSPENDED');
    });

    it('should throw validation error when logging in with invalid fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: ''
      } as any;

      await expect(authApiClient.login(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should register without storing session if token or user is missing in response', async () => {
      const validRegisterData: RegisterFormData = {
        name: 'Rajesh Verma',
        mobile_number: '+91 98234 56789',
        email: 'rajesh.verma@company.com',
        company_name: 'Reliance Logistics',
        company_address: 'Nariman Point, Mumbai',
        password: 'ValidPassword@123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Account created'
        })
      });

      const res = await authApiClient.register(validRegisterData);
      expect(res.success).toBe(true);
      expect(authApiClient.getStoredToken()).toBeNull();
    });

    it('should handle registration error with default fallback message', async () => {
      const validRegisterData: RegisterFormData = {
        name: 'Rajesh Verma',
        mobile_number: '+91 98234 56789',
        email: 'rajesh.verma@company.com',
        company_name: 'Reliance Logistics',
        company_address: 'Nariman Point, Mumbai',
        password: 'ValidPassword@123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(authApiClient.register(validRegisterData)).rejects.toThrow('Registration failed');
    });

    it('should login without storing session if token or user is missing in response', async () => {
      const loginData: LoginFormData = {
        email: 'rajesh.verma@company.com',
        password: 'ValidPassword@123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true
        })
      });

      const res = await authApiClient.login(loginData);
      expect(res.success).toBe(true);
      expect(authApiClient.getStoredToken()).toBeNull();
    });

    it('should handle login error with default fallback message', async () => {
      const loginData: LoginFormData = {
        email: 'rajesh.verma@company.com',
        password: 'ValidPassword@123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(authApiClient.login(loginData)).rejects.toThrow('Authentication failed');
    });

    it('should handle getMe error with default fallback message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(authApiClient.getMe('some-token')).rejects.toThrow('Failed to fetch user profile');
    });

    it('should fetch admin user directory using stored token and handle query with invalid filters', async () => {
      authApiClient.setStoredSession('stored-admin-token', mockUser);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          users: [mockUser],
          total: 1,
          activeCount: 1,
          suspendedCount: 0,
          adminCount: 0,
          companiesCount: 1
        })
      });

      const invalidQuery = { role: 'INVALID_ROLE' as any };
      const res = await authApiClient.getAdminUsers(invalidQuery);
      expect(res.total).toBe(1);
    });

    it('should fetch admin user directory without token header if no token is available', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          users: [],
          total: 0,
          activeCount: 0,
          suspendedCount: 0,
          adminCount: 0,
          companiesCount: 0
        })
      });

      const res = await authApiClient.getAdminUsers();
      expect(res.total).toBe(0);
    });

    it('should handle getAdminUsers error with default fallback message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(authApiClient.getAdminUsers()).rejects.toThrow('Failed to load user directory');
    });

    it('should update user status using stored token fallback', async () => {
      authApiClient.setStoredSession('stored-admin-token', mockUser);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, status: 'ACTIVE' }
        })
      });

      const res = await authApiClient.updateAdminUserStatus(mockUser.id, 'ACTIVE');
      expect(res.success).toBe(true);
    });

    it('should update user status without token header if no token is available', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, status: 'ACTIVE' }
        })
      });

      const res = await authApiClient.updateAdminUserStatus(mockUser.id, 'ACTIVE');
      expect(res.success).toBe(true);
    });

    it('should handle updateAdminUserStatus error with default fallback message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(
        authApiClient.updateAdminUserStatus(mockUser.id, 'ACTIVE', 'admin-token')
      ).rejects.toThrow('Failed to update user status');
    });
  });

  describe('Simulated Tier Storage Helpers', () => {
    it('should get and set simulated tier correctly', () => {
      expect(authApiClient.getSimulatedTier()).toBeNull();

      authApiClient.setSimulatedTier('SILVER');
      expect(authApiClient.getSimulatedTier()).toBe('SILVER');

      authApiClient.setSimulatedTier('GOLD');
      expect(authApiClient.getSimulatedTier()).toBe('GOLD');

      authApiClient.setSimulatedTier(null);
      expect(authApiClient.getSimulatedTier()).toBeNull();
    });

    it('should ignore non-tier strings in localStorage', () => {
      localStorage.setItem('procucev_simulated_tier', 'DIAMOND');
      expect(authApiClient.getSimulatedTier()).toBeNull();
    });
  });

  describe('administrator tenant provisioning', () => {
    it('loads tenant choices with the stored administrator token', async () => {
      authApiClient.setStoredSession('stored-admin-token', mockUser);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ success: true, tenants: [
          { tenant_id: 'tenant-alpha', enterprise_name: 'Alpha Industries', status: 'ACTIVE' }
        ] })
      });

      const response = await authApiClient.getAdminTenants();
      const [url, init] = vi.mocked(global.fetch).mock.calls[0];

      expect(response.tenants).toHaveLength(1);
      expect(String(url)).toContain('/api/admin/tenants');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer stored-admin-token');
    });

    it('uses the localized tenant registry error when the response schema is invalid', async () => {
      const errorLog = vi.spyOn((await import('../../src/utils/logger')).default, 'error');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ success: true, tenants: [{ tenant_id: 'bad' }] })
      });

      await expect(authApiClient.getAdminTenants()).rejects.toThrow(UI_STRINGS.admin.tenantListInvalid);
      expect(errorLog).toHaveBeenCalledOnce();
    });

    it('validates the selected tenant before making an assignment request', async () => {
      global.fetch = vi.fn();

      await expect(authApiClient.assignAdminUserTenant(mockUser.id, '')).rejects.toThrow();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('assigns a tenant with the stored token and parses the assigned profile', async () => {
      authApiClient.setStoredSession('stored-admin-token', mockUser);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ success: true, user: { ...mockUser, tenant_id: 'tenant-alpha' } })
      });

      const response = await authApiClient.assignAdminUserTenant(mockUser.id, 'tenant-alpha');
      const [url, init] = vi.mocked(global.fetch).mock.calls[0];

      expect(response.user.tenant_id).toBe('tenant-alpha');
      expect(String(url)).toContain(`/api/admin/users/${mockUser.id}/tenant`);
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer stored-admin-token');
    });
  });

  describe('updateAdminUserTier', () => {
    it('should update user tier successfully with token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, subscription_tier: 'GOLD' }
        })
      });

      const res = await authApiClient.updateAdminUserTier(mockUser.id, 'GOLD', 'admin-token');
      expect(res.success).toBe(true);
      expect(res.user.subscription_tier).toBe('GOLD');
      expectApiFetchCall(global.fetch, expect.stringContaining(`/api/admin/users/${mockUser.id}/tier`), expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer admin-token'
          })
        }));
    });

    it('should update user tier without token parameter using stored token', async () => {
      authApiClient.setStoredSession('stored-admin-token', mockUser);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, subscription_tier: 'SILVER' }
        })
      });

      const res = await authApiClient.updateAdminUserTier(mockUser.id, 'SILVER');
      expect(res.success).toBe(true);
      const [url, init] = vi.mocked(global.fetch).mock.calls[0];
      expect(String(url)).toContain(`/api/admin/users/${mockUser.id}/tier`);
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer stored-admin-token');
    });

    it('should throw validation error on invalid tier input', async () => {
      await expect(
        authApiClient.updateAdminUserTier(mockUser.id, 'PLATINUM' as any)
      ).rejects.toThrow('Validation failed');
    });

    it('should handle API error when updateAdminUserTier fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Tier update rejected' })
      });

      await expect(
        authApiClient.updateAdminUserTier(mockUser.id, 'GOLD', 'token')
      ).rejects.toThrow('Tier update rejected');
    });

    it('should fallback to default error message if json has no message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(
        authApiClient.updateAdminUserTier(mockUser.id, 'GOLD')
      ).rejects.toThrow('Failed to update user subscription tier');
    });
  });

  describe('buildAdminUserQueryParams with tier', () => {
    it('should append tier to query params when specified', () => {
      const params = buildAdminUserQueryParams({
        tier: 'SILVER'
      });
      expect(params.get('tier')).toBe('SILVER');
    });

    it('should ignore tier ALL in query params', () => {
      const params = buildAdminUserQueryParams({
        tier: 'ALL'
      });
      expect(params.get('tier')).toBeNull();
    });
  });
});
