'use client';

/** Handles failures inside a route segment. The surrounding navigation stays available. */
import type { RouteError } from '../types/errors';
import { RouteErrorFallback } from '../components/errors/RouteErrorFallback';

export default function ErrorPage({ error, reset }: { error: RouteError; reset: () => void }): React.ReactElement {
  return <RouteErrorFallback error={error} onRetry={reset} />;
}
