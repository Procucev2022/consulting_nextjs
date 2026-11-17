'use client';

/**
 * Shared failure screen for route segments and the root layout. The reference is the Next.js error digest when
 * the server produced one, so support can find the matching server log entry. Otherwise a client reference is made.
 */
import { useEffect, useState } from 'react';
import { UI_STRINGS } from '../../constants/uiStrings';
import type { RouteErrorFallbackProps } from '../../types/errors';
import { frontendLogger } from '../../utils/logger';
import { createClientRequestId } from '../../utils/requestId';

export const RouteErrorFallback = ({ error, onRetry }: RouteErrorFallbackProps): React.ReactElement => {
  const [requestId] = useState<string>(() => error.digest || createClientRequestId());

  useEffect(() => {
    frontendLogger.error(UI_STRINGS.errors.boundary.logMessage, { source: 'route-error', requestId }, error);
  }, [error, requestId]);

  return (
    <main role="alert" className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6 py-12 text-slate-900">
      <h1 className="text-2xl font-semibold">{UI_STRINGS.errors.boundary.title}</h1>
      <p>{UI_STRINGS.errors.boundary.message}</p>
      <p>{UI_STRINGS.errors.boundary.nextStep}</p>
      <p className="font-mono text-sm">{UI_STRINGS.errors.boundary.supportReference(requestId)}</p>
      <button className="w-fit rounded bg-sky-700 px-4 py-2 font-medium text-white" onClick={onRetry} type="button">
        {UI_STRINGS.common.retry}
      </button>
    </main>
  );
};
