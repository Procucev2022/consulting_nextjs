import { describe, it, expect, beforeEach } from 'vitest';
import { AUTH_ADMIN_DISPLAY_FALLBACK, AUTH_STORAGE_KEYS } from '../../src/constants/auth';
import { getAdministratorDisplayName } from '../../src/utils/adminIdentity';

describe('getAdministratorDisplayName', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('names the signed-in administrator by email', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify({ id: 'usr-1', email: 'ops@procucev.com', name: 'Ops' }));

    expect(getAdministratorDisplayName()).toBe('ops@procucev.com');
  });

  it('falls back to the account name when no email is stored', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify({ id: 'usr-2', name: 'Ops Lead' }));

    expect(getAdministratorDisplayName()).toBe('Ops Lead');
  });

  it('uses the neutral label when no administrator session is stored', () => {
    expect(getAdministratorDisplayName()).toBe(AUTH_ADMIN_DISPLAY_FALLBACK);
  });
});
