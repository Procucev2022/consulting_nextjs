import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { AUTH_ROUTES, AUTH_SESSION_EXPIRED_EVENT, AUTH_SESSION_EXPIRED_QUERY } from '../../../src/constants/auth';
import { SessionExpiryRedirect } from '../../../src/components/auth/SessionExpiryRedirect';

const routerMock = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: (): { replace: (url: string) => void } => ({ replace: routerMock.replace })
}));

const EXPIRED_SIGN_IN_URL = `${AUTH_ROUTES.LOGIN}?${AUTH_SESSION_EXPIRED_QUERY.PARAM}=${AUTH_SESSION_EXPIRED_QUERY.VALUE}`;

describe('SessionExpiryRedirect', () => {
  beforeEach(() => {
    routerMock.replace.mockClear();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  it('sends the user to the sign-in page with the expiry marker when the session expires', () => {
    render(<SessionExpiryRedirect />);

    act(() => {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    });

    expect(routerMock.replace).toHaveBeenCalledWith(EXPIRED_SIGN_IN_URL);
  });

  it('does not navigate again when the user is already on the sign-in page', () => {
    window.history.pushState({}, '', AUTH_ROUTES.LOGIN);
    render(<SessionExpiryRedirect />);

    act(() => {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    });

    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('stops listening once it is unmounted', () => {
    const { unmount } = render(<SessionExpiryRedirect />);
    unmount();

    act(() => {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    });

    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
