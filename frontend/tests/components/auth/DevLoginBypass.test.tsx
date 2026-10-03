import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevLoginBypass } from '../../../src/components/auth/DevLoginBypass';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('DevLoginBypass Component (Production Security Hardening)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders null in production environments (NODE_ENV=production)', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const { container } = render(
      <DevLoginBypass onFillCred={vi.fn()} onAdminBypass={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders null in production even if NEXT_PUBLIC_ENABLE_DEV_LOGIN is set to true', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'true';

    const { container } = render(
      <DevLoginBypass onFillCred={vi.fn()} onAdminBypass={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(UI_STRINGS.auth.tempDevCredentialsBadge)).not.toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.auth.goToAdminDirectly)).not.toBeInTheDocument();
  });

  it('renders null in test environments (NODE_ENV=test)', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';

    const { container } = render(
      <DevLoginBypass onFillCred={vi.fn()} onAdminBypass={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders dev access panel and triggers quick fills ONLY when NODE_ENV=development', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    const onFill = vi.fn();
    const onAdmin = vi.fn();

    render(<DevLoginBypass onFillCred={onFill} onAdminBypass={onAdmin} />);

    expect(screen.getByText(UI_STRINGS.auth.tempDevCredentialsBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.goToAdminDirectly)).toBeInTheDocument();

    const srimanBtn = screen.getByTitle('Fill sriman@procucev.com');
    fireEvent.click(srimanBtn);
    expect(onFill).toHaveBeenCalledWith('sriman@procucev.com', 'sriman@123');

    const adminBtn = screen.getByTitle('Fill admin@procucev.com');
    fireEvent.click(adminBtn);
    expect(onFill).toHaveBeenCalledWith('admin@procucev.com', 'Admin@123456');

    const buyerBtn = screen.getByTitle('Fill buyer@procucev.com');
    fireEvent.click(buyerBtn);
    expect(onFill).toHaveBeenCalledWith('buyer@procucev.com', 'User@123456');

    const directAdminBtn = screen.getByText(UI_STRINGS.auth.goToAdminDirectly);
    fireEvent.click(directAdminBtn);
    expect(onAdmin).toHaveBeenCalledTimes(1);
  });
});
