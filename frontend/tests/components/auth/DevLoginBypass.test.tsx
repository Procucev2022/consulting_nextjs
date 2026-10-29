import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DevLoginBypass } from '../../../src/components/auth/DevLoginBypass';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('Development database authentication guidance', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(['production', 'test'])('hides the development guidance in %s', (environment) => {
    vi.stubEnv('NODE_ENV', environment);
    const { container } = render(<DevLoginBypass />);
    expect(container.firstChild).toBeNull();
  });

  it('shows guidance without credentials, quick-fill controls, or role elevation', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<DevLoginBypass />);
    expect(screen.getByRole('note')).toHaveTextContent(UI_STRINGS.auth.developmentAuthTitle);
    expect(screen.getByRole('note')).toHaveTextContent(UI_STRINGS.auth.developmentAuthNotice);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('note').textContent).not.toMatch(/@|password|token/);
  });
});
