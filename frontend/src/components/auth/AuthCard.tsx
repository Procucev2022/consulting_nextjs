'use client';

/**
 * Authentication Card Container (Prompt 290, 292 & 605)
 * Light Premium Enterprise Theme: Conversion-optimized container for Sign In & Create Account.
 * Fitted and scaled for seamless viewport presentation on 100% desktop screens.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import { apiClient } from '../../utils/api';
import frontendLogger from '../../utils/logger';
import type { LoginFormData, RegisterFormData } from '../../types';
import { SignInForm } from './SignInForm';
import { RegisterForm } from './RegisterForm';
import { DevLoginBypass } from './DevLoginBypass';
import type { AuthCardProps } from '../../types/components';

export const AuthCard: React.FC<AuthCardProps> = ({ initialTab = 'LOGIN' }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState<LoginFormData>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    name: '',
    mobile_number: '',
    email: '',
    company_name: '',
    company_address: '',
    password: '',
    confirm_password: ''
  });

  const handleLoginSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      frontendLogger.info('Submitting user login form', { email: loginForm.email });
      const response = await apiClient.login(loginForm);
      setSuccessMessage(UI_STRINGS.auth.loginSuccess);

      setTimeout(() => {
        if (response.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      frontendLogger.warn('User login error', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (registerForm.password !== registerForm.confirm_password) {
      setErrorMessage(UI_STRINGS.auth.passwordMismatchError);
      setLoading(false);
      return;
    }

    try {
      frontendLogger.info('Submitting new user registration form', {
        email: registerForm.email,
        company: registerForm.company_name
      });
      await apiClient.register(registerForm);
      setSuccessMessage(UI_STRINGS.auth.registrationPending);
      setActiveTab('LOGIN');
      setLoginForm((current) => ({ ...current, email: registerForm.email }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      frontendLogger.warn('Registration failed', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] xl:max-w-[440px] bg-white border border-[#DCE7F5] rounded-2xl p-3.5 sm:p-4 xl:p-5 shadow-[0_16px_36px_rgba(11,27,51,0.06),0_2px_8px_rgba(11,27,51,0.03)] transition-all">
      {/* Top Conversion Anchor (Prompt 293 Section 4) */}
      <div className="mb-1.5 sm:mb-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            <Sparkles size={11} className="text-sky-600" />
            <span>{UI_STRINGS.auth.startWithYourDataBadge}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.header.engineVersion}
          </span>
        </div>
        <h3 className="m-0 text-xs sm:text-[13px] font-extrabold text-[#0B1B33] leading-snug">
          {UI_STRINGS.auth.upgradeWhenNeededHeadline}
        </h3>
      </div>

      {/* Navigation Tabs (SIGN IN | CREATE ACCOUNT) */}
      <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg mb-2 border border-slate-200">
        <button
          type="button"
          id="tab-login"
          onClick={() => { setActiveTab('LOGIN'); setErrorMessage(null); }}
          className={`py-1.5 px-3 rounded-md font-bold text-xs transition-all border-none cursor-pointer ${
            activeTab === 'LOGIN' ? 'bg-white text-[#0B1B33] shadow-xs' : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {UI_STRINGS.auth.signInTab}
        </button>
        <button
          type="button"
          id="tab-register"
          onClick={() => { setActiveTab('REGISTER'); setErrorMessage(null); }}
          className={`py-1.5 px-3 rounded-md font-bold text-xs transition-all border-none cursor-pointer ${
            activeTab === 'REGISTER' ? 'bg-white text-[#0B1B33] shadow-xs' : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {UI_STRINGS.auth.createAccountTab}
        </button>
      </div>

      {/* Heading */}
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 mb-0.5 text-sm sm:text-base font-extrabold text-[#0B1B33]">
          {activeTab === 'LOGIN' ? UI_STRINGS.auth.signInHeading : UI_STRINGS.auth.registerHeading}
        </h2>
        <p className="m-0 text-[11px] text-slate-500 leading-normal">
          {activeTab === 'LOGIN' ? UI_STRINGS.auth.signInSubheading : UI_STRINGS.auth.registerSubheading}
        </p>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-medium">
          {successMessage}
        </div>
      )}

      {/* Active Form */}
      {activeTab === 'LOGIN' ? (
        <SignInForm
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          onSubmit={handleLoginSubmit}
          loading={loading}
          onSwitchToRegister={() => { setActiveTab('REGISTER'); setErrorMessage(null); }}
        />
      ) : (
        <RegisterForm
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          onSubmit={handleRegisterSubmit}
          loading={loading}
          onSwitchToLogin={() => { setActiveTab('LOGIN'); setErrorMessage(null); }}
        />
      )}

      {/* Three Small Reassurance Items (Prompt 293 Section 4) - only on LOGIN tab to avoid duplication with RegisterForm */}
      {activeTab === 'LOGIN' && (
        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1 text-[10.5px] text-slate-600 font-medium">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>{UI_STRINGS.auth.reassuranceStartDiscover}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>{UI_STRINGS.auth.reassuranceNoPayment}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>{UI_STRINGS.auth.reassuranceUpgradeLater}</span>
          </span>
        </div>
      )}

      {/* Compact Reassurance Quote Strip */}
      <div className="mt-1.5 py-1 px-2 bg-slate-50 border border-slate-200 rounded-md text-center text-[9.5px] text-slate-500 leading-snug font-medium">
        {UI_STRINGS.auth.builtForEvidenceQuote}
      </div>

      {/* Local development uses the same database-backed sign-in flow. */}
      {process.env.NODE_ENV === 'development' && (
        <DevLoginBypass />
      )}
    </div>
  );
};
