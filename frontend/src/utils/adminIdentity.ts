import { AUTH_ADMIN_DISPLAY_FALLBACK } from '../constants/auth';
import { authApiClient } from './authApi';

/**
 * The name recorded on administrator actions, such as a PCBI publication or an approval.
 * It is the signed-in administrator's email, so the audit trail names the person who acted.
 */
export const getAdministratorDisplayName = (): string => {
  const user = authApiClient.getStoredUser();
  return user?.email || user?.name || AUTH_ADMIN_DISPLAY_FALLBACK;
};
