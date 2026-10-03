import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegisterForm } from '../../../src/components/auth/RegisterForm';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('RegisterForm Component', () => {
  const initialForm = {
    name: '',
    mobile_number: '',
    email: '',
    company_name: '',
    company_address: '',
    password: '',
    confirm_password: ''
  };

  it('renders all registration fields, reassuring pills, and buttons', () => {
    const setRegisterForm = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());
    const onSwitch = vi.fn();

    render(
      <RegisterForm
        registerForm={initialForm}
        setRegisterForm={setRegisterForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToLogin={onSwitch}
      />
    );

    expect(screen.getByText(UI_STRINGS.auth.reassuranceNoPayment)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.reassuranceStartDiscover)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.reassuranceUpgradeLater)).toBeInTheDocument();

    expect(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`)).toBeInTheDocument();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.auth.alreadyHaveAccount })).toBeInTheDocument();
  });

  it('updates form fields when typing', () => {
    const setRegisterForm = vi.fn();
    const onSubmit = vi.fn();
    const onSwitch = vi.fn();

    render(
      <RegisterForm
        registerForm={initialForm}
        setRegisterForm={setRegisterForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToLogin={onSwitch}
      />
    );

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), {
      target: { value: 'Jane Doe' }
    });
    expect(setRegisterForm).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), {
      target: { value: '9876543210' }
    });
    expect(setRegisterForm).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), {
      target: { value: 'jane@acme.com' }
    });
    expect(setRegisterForm).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), {
      target: { value: 'Acme Corp' }
    });
    expect(setRegisterForm).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), {
      target: { value: '123 Acme Way' }
    });
    expect(setRegisterForm).toHaveBeenCalled();
  });

  it('toggles password and confirm password visibility', () => {
    const setRegisterForm = vi.fn();
    const onSubmit = vi.fn();
    const onSwitch = vi.fn();

    render(
      <RegisterForm
        registerForm={initialForm}
        setRegisterForm={setRegisterForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToLogin={onSwitch}
      />
    );

    const pwdInput = screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`) as HTMLInputElement;

    expect(pwdInput.type).toBe('password');
    expect(confirmInput.type).toBe('password');

    const showButtons = screen.getAllByLabelText('Show password');
    fireEvent.click(showButtons[0]);
    expect(pwdInput.type).toBe('text');

    fireEvent.click(showButtons[1]);
    expect(confirmInput.type).toBe('text');

    const hideButtons = screen.getAllByLabelText('Hide password');
    fireEvent.click(hideButtons[0]);
    expect(pwdInput.type).toBe('password');

    fireEvent.click(hideButtons[1]);
    expect(confirmInput.type).toBe('password');
  });

  it('submits form and allows switching back to login', () => {
    const setRegisterForm = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());
    const onSwitch = vi.fn();

    render(
      <RegisterForm
        registerForm={initialForm}
        setRegisterForm={setRegisterForm}
        onSubmit={onSubmit}
        loading={false}
        onSwitchToLogin={onSwitch}
      />
    );

    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta });
    fireEvent.submit(submitBtn.closest('form')!);
    expect(onSubmit).toHaveBeenCalled();

    const switchBtn = screen.getByRole('button', { name: UI_STRINGS.auth.alreadyHaveAccount });
    fireEvent.click(switchBtn);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('disables submit button and shows loading text during submission', () => {
    const setRegisterForm = vi.fn();
    const onSubmit = vi.fn();
    const onSwitch = vi.fn();

    render(
      <RegisterForm
        registerForm={initialForm}
        setRegisterForm={setRegisterForm}
        onSubmit={onSubmit}
        loading={true}
        onSwitchToLogin={onSwitch}
      />
    );

    expect(screen.getByRole('button', { name: UI_STRINGS.auth.registering })).toBeDisabled();
  });
});
