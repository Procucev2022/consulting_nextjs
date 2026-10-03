'use client';

/**
 * Sign In Form Component (Prompt 290)
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
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <label htmlFor="login-email" style={{
          display: 'block', fontSize: '13px', fontWeight: 600, color: '#0B1B33', marginBottom: '6px'
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
            height: '52px',
            padding: '0 16px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '10px',
            color: '#0B1B33',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label htmlFor="login-password" style={{
          display: 'block', fontSize: '13px', fontWeight: 600, color: '#0B1B33', marginBottom: '6px'
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
              height: '52px',
              padding: '0 44px 0 16px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '10px',
              color: '#0B1B33',
              fontSize: '14px',
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
              right: '14px',
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
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        id="btn-login-submit"
        disabled={loading}
        style={{
          marginTop: '4px',
          width: '100%',
          height: '52px',
          backgroundColor: '#0284c7',
          border: 'none',
          borderRadius: '10px',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '15px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? UI_STRINGS.auth.signingIn : UI_STRINGS.auth.signInButton}
      </button>

      <div style={{ textAlign: 'center', marginTop: '2px' }}>
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontSize: '13px',
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
