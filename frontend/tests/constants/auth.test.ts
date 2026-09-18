import { describe, it, expect } from 'vitest';
import {
  AUTH_ROLES,
  AUTH_STATUS,
  AUTH_STORAGE_KEYS,
  AUTH_API_ENDPOINTS
} from '../../src/constants/auth';

describe('Frontend Auth Constants', () => {
  it('should define valid auth roles', () => {
    expect(AUTH_ROLES.USER).toBe('USER');
    expect(AUTH_ROLES.ADMIN).toBe('ADMIN');
  });

  it('should define valid user statuses', () => {
    expect(AUTH_STATUS.ACTIVE).toBe('ACTIVE');
    expect(AUTH_STATUS.SUSPENDED).toBe('SUSPENDED');
    expect(AUTH_STATUS.PENDING).toBe('PENDING');
  });

  it('should define valid localStorage keys', () => {
    expect(AUTH_STORAGE_KEYS.AUTH_TOKEN).toBe('procucev_auth_token');
    expect(AUTH_STORAGE_KEYS.CURRENT_USER).toBe('procucev_current_user');
  });

  it('should generate correct API endpoints', () => {
    expect(AUTH_API_ENDPOINTS.LOGIN).toBe('/api/auth/login');
    expect(AUTH_API_ENDPOINTS.REGISTER).toBe('/api/auth/register');
    expect(AUTH_API_ENDPOINTS.ME).toBe('/api/auth/me');
    expect(AUTH_API_ENDPOINTS.CHANGE_PASSWORD).toBe('/api/auth/change-password');
    expect(AUTH_API_ENDPOINTS.ADMIN_USERS).toBe('/api/admin/users');
    expect(AUTH_API_ENDPOINTS.ADMIN_USER_STATUS('usr-123')).toBe('/api/admin/users/usr-123/status');
  });
});
