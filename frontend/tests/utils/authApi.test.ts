import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApiClient, buildAdminUserQueryParams } from '../../src/utils/authApi';
import { AUTH_STORAGE_KEYS } from '../../src/constants/auth';
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
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/admin/users/${mockUser.id}/tier`),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer admin-token'
          })
        })
      );
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
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/admin/users/${mockUser.id}/tier`),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer stored-admin-token'
          })
        })
      );
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
