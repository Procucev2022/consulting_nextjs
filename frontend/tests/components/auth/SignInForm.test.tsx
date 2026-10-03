import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInForm } from '../../../src/components/auth/SignInForm';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('SignInForm Component', () => {
  it('renders all inputs, buttons and labels properly', () => {
    const setLoginForm = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());
    const onSwitch = vi.fn();

    render(
      <SignInForm
        loginForm={{ email: '', password: '' }}
        setLoginForm={setLoginForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToRegister={onSwitch}
      />
    );

    expect(screen.getByLabelText(UI_STRINGS.auth.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.auth.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.auth.dontHaveAccount })).toBeInTheDocument();
  });

  it('updates email and password inputs via setLoginForm', () => {
    const setLoginForm = vi.fn();
    const onSubmit = vi.fn();
    const onSwitch = vi.fn();

    render(
      <SignInForm
        loginForm={{ email: 'user@example.com', password: 'secretpassword' }}
        setLoginForm={setLoginForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToRegister={onSwitch}
      />
    );

    const emailInput = screen.getByLabelText(UI_STRINGS.auth.emailLabel);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(setLoginForm).toHaveBeenCalled();

    const passwordInput = screen.getByLabelText(UI_STRINGS.auth.passwordLabel);
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
    expect(setLoginForm).toHaveBeenCalled();
  });

  it('toggles password visibility with eye button', () => {
    const setLoginForm = vi.fn();
    const onSubmit = vi.fn();
    const onSwitch = vi.fn();

    render(
      <SignInForm
        loginForm={{ email: 'user@example.com', password: 'secretpassword' }}
        setLoginForm={setLoginForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToRegister={onSwitch}
      />
    );

    const passwordInput = screen.getByLabelText(UI_STRINGS.auth.passwordLabel) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText('Show password');
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    const hideBtn = screen.getByLabelText('Hide password');
    fireEvent.click(hideBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('submits form and triggers onSwitchToRegister', () => {
    const setLoginForm = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());
    const onSwitch = vi.fn();

    render(
      <SignInForm
        loginForm={{ email: 'user@example.com', password: 'secretpassword' }}
        setLoginForm={setLoginForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToRegister={onSwitch}
      />
    );

    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.auth.signInButton });
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();

    const switchBtn = screen.getByRole('button', { name: UI_STRINGS.auth.dontHaveAccount });
    fireEvent.click(switchBtn);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('displays loading state when loading is true', () => {
    const setLoginForm = vi.fn();
    const onSubmit = vi.fn();
    const onSwitch = vi.fn();

    render(
      <SignInForm
        loginForm={{ email: '', password: '' }}
        setLoginForm={setLoginForm}
        onSubmit={onSubmit}
        loading={true}
        onSwitchToRegister={onSwitch}
      />
    );

    expect(screen.getByRole('button', { name: UI_STRINGS.auth.signingIn })).toBeDisabled();
  });
});
