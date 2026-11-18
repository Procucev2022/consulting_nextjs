import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AUTH_ROUTES, AUTH_SESSION_EXPIRED_QUERY } from '../../../src/constants/auth';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { SessionExpiredNotice } from '../../../src/components/auth/SessionExpiredNotice';

describe('SessionExpiredNotice', () => {
  afterEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
  });

  it('explains an expired session when the sign-in page is opened with the expiry marker', async () => {
    window.history.pushState({}, '', `${AUTH_ROUTES.LOGIN}?${AUTH_SESSION_EXPIRED_QUERY.PARAM}=${AUTH_SESSION_EXPIRED_QUERY.VALUE}`);

    render(<SessionExpiredNotice />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(UI_STRINGS.auth.sessionExpired);
  });

  it('renders nothing on an ordinary sign-in visit', () => {
    window.history.pushState({}, '', AUTH_ROUTES.LOGIN);

    render(<SessionExpiredNotice />);

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
