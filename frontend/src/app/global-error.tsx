'use client';

/**
 * Handles failures in the root layout, which the segment error page cannot catch. The document shell is rendered
 * here because the root layout is unavailable when this page is shown.
 */
import type { RouteError } from '../types/errors';
import { RouteErrorFallback } from '../components/errors/RouteErrorFallback';
import { UI_STRINGS } from '../constants/uiStrings';

export default function GlobalError({ error, reset }: { error: RouteError; reset: () => void }): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <title>{UI_STRINGS.errors.boundary.title}</title>
      </head>
      <body>
        <RouteErrorFallback error={error} onRetry={reset} />
      </body>
    </html>
  );
}
