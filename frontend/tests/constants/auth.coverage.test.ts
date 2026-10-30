import { describe, expect, it } from 'vitest';
import * as authConstants from '../../src/constants/auth';

describe('Database-only authentication constants', () => {
  it('does not export predefined development account passwords', () => {
    expect('DEV_TEMP_CREDENTIALS' in authConstants).toBe(false);
  });

  it('builds protected user-management endpoints using the requested database user id', () => {
    expect(authConstants.AUTH_API_ENDPOINTS.ADMIN_USER_STATUS('usr-9')).toBe('/api/admin/users/usr-9/status');
    expect(authConstants.AUTH_API_ENDPOINTS.ADMIN_USER_TIER('usr-9')).toBe('/api/admin/users/usr-9/tier');
  });
});
