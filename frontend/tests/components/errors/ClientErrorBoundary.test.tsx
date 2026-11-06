import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { ClientErrorBoundary } from '../../../src/components/errors/ClientErrorBoundary';
import { frontendLogger } from '../../../src/utils/logger';

const ThrowingView = (): never => {
  throw new Error('Unexpected dashboard rendering failure');
};

describe('ClientErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders healthy children without showing the fallback', () => {
    render(<ClientErrorBoundary><p>Dashboard ready</p></ClientErrorBoundary>);
    expect(screen.getByText('Dashboard ready')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an actionable fallback and records a correlation reference after a render error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logSpy = vi.spyOn(frontendLogger, 'error');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })));
    render(<ClientErrorBoundary><ThrowingView /></ClientErrorBoundary>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.errors.boundary.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.errors.boundary.nextStep)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.errors.boundary.reloadAction })).toBeInTheDocument();
    expect(screen.getByText(/^Support reference:/)).toBeInTheDocument();
    expect(logSpy).toHaveBeenCalledWith(UI_STRINGS.errors.boundary.logMessage, expect.objectContaining({
      source: 'react-boundary', requestId: expect.any(String)
    }), expect.any(Error));
  });

  it('invokes the reload action when selected', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);
    render(<ClientErrorBoundary><ThrowingView /></ClientErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.errors.boundary.reloadAction }));
    expect(reload).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
