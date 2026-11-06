import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ClientErrorMonitor } from '../../../src/components/errors/ClientErrorMonitor';
import { frontendLogger } from '../../../src/utils/logger';

describe('ClientErrorMonitor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('installs browser error listeners after mount and removes them on unmount', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<ClientErrorMonitor />);

    frontendLogger.error('A test error reached the application logger', {}, new Error('test exception'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    view.unmount();
    frontendLogger.error('A later error has no monitoring listener', {}, new Error('after unmount'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
