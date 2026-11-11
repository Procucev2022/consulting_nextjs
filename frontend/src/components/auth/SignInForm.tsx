'use client';

/**
 * Sign In Form Component (Prompt 290 & 605)
 * Sleek, compact inputs and button to fit cleanly within 100% desktop viewports.
 */

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import type { LoginFormData } from '../../types';

export interface SignInFormProps {
  loginForm: LoginFormData;
  setLoginForm: React.Dispatch<React.SetStateAction<LoginFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  onSwitchToRegister: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  loginForm,
  setLoginForm,
  onSubmit,
  loading,
  onSwitchToRegister
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <label htmlFor="login-email" style={{
          display: 'block', fontSize: '11px', fontWeight: 600, color: '#0B1B33', marginBottom: '3px'
        }}>
          {UI_STRINGS.auth.emailLabel}
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={loginForm.email}
          onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder={UI_STRINGS.auth.emailPlaceholder}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 12px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '8px',
            color: '#0B1B33',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label htmlFor="login-password" style={{
          display: 'block', fontSize: '11px', fontWeight: 600, color: '#0B1B33', marginBottom: '3px'
        }}>
          {UI_STRINGS.auth.passwordLabel}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={loginForm.password}
            onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={UI_STRINGS.auth.passwordPlaceholder}
            style={{
              width: '100%',
              height: '40px',
              padding: '0 36px 0 12px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '8px',
              color: '#0B1B33',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        id="btn-login-submit"
        disabled={loading}
        style={{
          marginTop: '2px',
          width: '100%',
          height: '40px',
          backgroundColor: '#0284c7',
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)',
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? UI_STRINGS.auth.signingIn : UI_STRINGS.auth.signInButton}
      </button>

      <div style={{ textAlign: 'center', marginTop: '1px' }}>
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {UI_STRINGS.auth.dontHaveAccount}
        </button>
      </div>
    </form>
  );
};
