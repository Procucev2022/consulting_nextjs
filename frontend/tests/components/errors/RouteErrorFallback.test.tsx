import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RouteErrorFallback } from '../../../src/components/errors/RouteErrorFallback';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { frontendLogger } from '../../../src/utils/logger';

describe('RouteErrorFallback', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the Next.js digest as the support reference and logs the failure against it', () => {
    const error = Object.assign(new Error('render failed'), { digest: 'srv-42' });
    const logError = vi.spyOn(frontendLogger, 'error').mockImplementation((() => undefined) as never);

    render(<RouteErrorFallback error={error} onRetry={vi.fn()} />);

    expect(screen.getByText(UI_STRINGS.errors.boundary.supportReference('srv-42'))).toBeInTheDocument();
    expect(logError).toHaveBeenCalledWith(UI_STRINGS.errors.boundary.logMessage, expect.objectContaining({
      source: 'route-error', requestId: 'srv-42'
    }), error);
  });

  it('creates a client reference when the failure has no digest', () => {
    vi.spyOn(frontendLogger, 'error').mockImplementation((() => undefined) as never);

    render(<RouteErrorFallback error={new Error('client only')} onRetry={vi.fn()} />);

    expect(screen.getByText(/^Support reference: .+/u)).toBeInTheDocument();
  });

  it('calls the retry handler when the user asks to retry', () => {
    vi.spyOn(frontendLogger, 'error').mockImplementation((() => undefined) as never);
    const onRetry = vi.fn();

    render(<RouteErrorFallback error={new Error('retry me')} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.common.retry }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
