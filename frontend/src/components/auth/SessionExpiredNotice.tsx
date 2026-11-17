'use client';

/**
 * Explains a sign-in page visit that followed an expired session. The check runs after mount, so the server
 * render and the first client render match.
 */
import React, { useEffect, useState } from 'react';
import { AUTH_SESSION_EXPIRED_QUERY } from '../../constants/auth';
import { UI_STRINGS } from '../../constants/uiStrings';

export const SessionExpiredNotice = (): React.ReactElement | null => {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    setIsExpired(parameters.get(AUTH_SESSION_EXPIRED_QUERY.PARAM) === AUTH_SESSION_EXPIRED_QUERY.VALUE);
  }, []);

  if (!isExpired) return null;

  return (
    <div role="alert" className="mb-4 w-full rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      {UI_STRINGS.auth.sessionExpired}
    </div>
  );
};
