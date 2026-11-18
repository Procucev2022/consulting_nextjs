'use client';

/**
 * Sends the user to the sign-in page when the API client reports an expired session.
 * The API client only dispatches the event, so this is the single place that changes the route.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_ROUTES, AUTH_SESSION_EXPIRED_EVENT, AUTH_SESSION_EXPIRED_QUERY } from '../../constants/auth';

export const SessionExpiryRedirect = (): null => {
  const router = useRouter();

  useEffect(() => {
    const redirectToSignIn = (): void => {
      if (window.location.pathname === AUTH_ROUTES.LOGIN) return;
      router.replace(`${AUTH_ROUTES.LOGIN}?${AUTH_SESSION_EXPIRED_QUERY.PARAM}=${AUTH_SESSION_EXPIRED_QUERY.VALUE}`);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, redirectToSignIn);
    return (): void => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, redirectToSignIn);
    };
  }, [router]);

  return null;
};
