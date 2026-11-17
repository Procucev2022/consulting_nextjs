import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ErrorPage from '../../src/app/error';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { frontendLogger } from '../../src/utils/logger';

describe('route error page', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps the failure visible and retries the segment through the reset handler', () => {
    vi.spyOn(frontendLogger, 'error').mockImplementation((() => undefined) as never);
    const reset = vi.fn();

    render(<ErrorPage error={Object.assign(new Error('segment failed'), { digest: 'seg-7' })} reset={reset} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.errors.boundary.supportReference('seg-7'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.common.retry }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
