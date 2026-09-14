'use client';

/**
 * Enterprise User Login & Registration Page
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UI_STRINGS, AICEV_LOGO_SRC } from '../../constants';
import { apiClient } from '../../utils/api';
import frontendLogger from '../../utils/logger';
import type { RegisterFormData, LoginFormData } from '../../types';
import { LoginBenefitsShowcase } from '../../components/LoginBenefitsShowcase';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login Form State
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  // Register Form State
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
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      frontendLogger.info('Submitting user login form', { email: loginForm.email });
      const res = await apiClient.login(loginForm);
      setSuccessMessage(UI_STRINGS.auth.loginSuccess);

      setTimeout(() => {
        if (res.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      frontendLogger.warn('User login error', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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
      setSuccessMessage(UI_STRINGS.auth.registrationSuccess);

      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      frontendLogger.warn('Registration failed', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const setQuickLogin = (email: string, pass: string): void => {
    setActiveTab('LOGIN');
    setLoginForm({ email, password: pass });
    setErrorMessage(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 20%, rgba(14, 165, 233, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 50%), linear-gradient(135deg, #070b14 0%, #0c1424 50%, #050811 100%)',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>
        {/* Left Column: Technology Benefits & Profit Multiplier Showcase */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <LoginBenefitsShowcase />
        </div>

        {/* Right Column: Authentication Card with aiCEV Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Form Header: aiCEV Logo at Maximum Optimum Size */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 24px',
                borderRadius: '16px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image
                  src={AICEV_LOGO_SRC}
                  alt={UI_STRINGS.header.logoAlt}
                  width={280}
                  height={72}
                  priority
                  style={{ height: '56px', width: 'auto', maxHeight: '64px', maxWidth: '280px', objectFit: 'contain' }}
                />
              </div>
            </Link>
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#94a3b8', letterSpacing: '0.05em' }}>
              {UI_STRINGS.header.baseCurrencyNote}
            </p>
          </div>

          {/* Main Auth Container */}
          <div style={{
            width: '100%',
            maxWidth: activeTab === 'REGISTER' ? '580px' : '460px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.12)',
            transition: 'all 0.3s ease'
          }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '24px',
          border: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          <button
            type="button"
            id="tab-login"
            onClick={() => { setActiveTab('LOGIN'); setErrorMessage(null); }}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              backgroundColor: activeTab === 'LOGIN' ? '#0284c7' : 'transparent',
              color: activeTab === 'LOGIN' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
          >
            {UI_STRINGS.auth.signInTab}
          </button>
          <button
            type="button"
            id="tab-register"
            onClick={() => { setActiveTab('REGISTER'); setErrorMessage(null); }}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              backgroundColor: activeTab === 'REGISTER' ? '#0284c7' : 'transparent',
              color: activeTab === 'REGISTER' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
          >
            {UI_STRINGS.auth.createAccountTab}
          </button>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
            {activeTab === 'LOGIN' ? UI_STRINGS.auth.signInHeading : UI_STRINGS.auth.registerHeading}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
            {activeTab === 'LOGIN' ? UI_STRINGS.auth.signInSubheading : UI_STRINGS.auth.registerSubheading}
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div role="alert" style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div role="status" style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '8px',
            color: '#86efac',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form: LOGIN */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="login-email" style={{
                display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
              }}>
                {UI_STRINGS.auth.emailLabel}
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder={UI_STRINGS.auth.emailPlaceholder}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{
                display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
              }}>
                {UI_STRINGS.auth.passwordLabel}
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder={UI_STRINGS.auth.passwordPlaceholder}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? UI_STRINGS.auth.signingIn : UI_STRINGS.auth.signInButton}
            </button>
          </form>
        )}

        {/* Form: REGISTER */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label htmlFor="reg-name" style={{
                  display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
                }}>
                  {UI_STRINGS.auth.nameLabel} *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder={UI_STRINGS.auth.namePlaceholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor="reg-mobile" style={{
                  display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
                }}>
                  {UI_STRINGS.auth.mobileLabel} *
                </label>
                <input
                  id="reg-mobile"
                  type="tel"
                  required
                  value={registerForm.mobile_number}
                  onChange={(e) => setRegisterForm({ ...registerForm, mobile_number: e.target.value })}
                  placeholder={UI_STRINGS.auth.mobilePlaceholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" style={{
                display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
              }}>
                {UI_STRINGS.auth.emailLabel} *
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                placeholder={UI_STRINGS.auth.emailPlaceholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label htmlFor="reg-company-name" style={{
                display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
              }}>
                {UI_STRINGS.auth.companyNameLabel} *
              </label>
              <input
                id="reg-company-name"
                type="text"
                required
                value={registerForm.company_name}
                onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                placeholder={UI_STRINGS.auth.companyNamePlaceholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label htmlFor="reg-company-address" style={{
                display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
              }}>
                {UI_STRINGS.auth.companyAddressLabel} *
              </label>
              <textarea
                id="reg-company-address"
                required
                rows={2}
                value={registerForm.company_address}
                onChange={(e) => setRegisterForm({ ...registerForm, company_address: e.target.value })}
                placeholder={UI_STRINGS.auth.companyAddressPlaceholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label htmlFor="reg-password" style={{
                  display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
                }}>
                  {UI_STRINGS.auth.passwordLabel} *
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder={UI_STRINGS.auth.passwordPlaceholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor="reg-confirm-password" style={{
                  display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px'
                }}>
                  {UI_STRINGS.auth.confirmPasswordLabel} *
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={registerForm.confirm_password}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirm_password: e.target.value })}
                  placeholder={UI_STRINGS.auth.confirmPasswordPlaceholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-register-submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? UI_STRINGS.auth.registering : UI_STRINGS.auth.createAccountButton}
            </button>
          </form>
        )}

        {/* Quick Test Logins Section */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {UI_STRINGS.auth.quickTestLogins}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              id="quick-login-admin"
              onClick={() => setQuickLogin('admin@procucev.com', 'Admin@123456')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                color: '#38bdf8',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {UI_STRINGS.auth.quickAdmin}
            </button>
            <button
              type="button"
              id="quick-login-user"
              onClick={() => setQuickLogin('srinivas@apexindustrial.com', 'User@123456')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '6px',
                color: '#c084fc',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {UI_STRINGS.auth.quickUser}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
  );
}


