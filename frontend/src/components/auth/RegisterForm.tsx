'use client';

/**
 * Register Form Component (Prompt 290)
 * Low-friction registration for Bronze / Discover entry point.
 */

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import type { RegisterFormData } from '../../types';

export interface RegisterFormProps {
  registerForm: RegisterFormData;
  setRegisterForm: React.Dispatch<React.SetStateAction<RegisterFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  onSwitchToLogin: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  backgroundColor: '#FFFFFF',
  border: '1.5px solid #CBD5E1',
  borderRadius: '7px',
  color: '#0B1B33',
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#0B1B33',
  marginBottom: '2px'
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  registerForm,
  setRegisterForm,
  onSubmit,
  loading,
  onSwitchToLogin
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Low-Friction Bronze Entry Reassurance Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '4px 8px',
        backgroundColor: '#F0F9FF',
        borderRadius: '7px',
        border: '1px solid #BAE6FD',
        fontSize: '10.5px',
        color: '#0369A1'
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0284c7', fontWeight: 600 }}>
          <CheckCircle size={12} />
          {UI_STRINGS.auth.reassuranceNoPayment}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#059669', fontWeight: 600 }}>
          <CheckCircle size={12} />
          {UI_STRINGS.auth.reassuranceStartDiscover}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#D97706', fontWeight: 600 }}>
          <CheckCircle size={12} />
          {UI_STRINGS.auth.reassuranceUpgradeLater}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
        <div>
          <label htmlFor="reg-name" style={labelStyle}>
            {UI_STRINGS.auth.nameLabel} *
          </label>
          <input
            id="reg-name"
            type="text"
            required
            value={registerForm.name}
            onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={UI_STRINGS.auth.namePlaceholder}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="reg-mobile" style={labelStyle}>
            {UI_STRINGS.auth.mobileLabel} *
          </label>
          <input
            id="reg-mobile"
            type="tel"
            required
            value={registerForm.mobile_number}
            onChange={(e) => setRegisterForm((prev) => ({ ...prev, mobile_number: e.target.value }))}
            placeholder={UI_STRINGS.auth.mobilePlaceholder}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" style={labelStyle}>
          {UI_STRINGS.auth.emailLabel} *
        </label>
        <input
          id="reg-email"
          type="email"
          required
          value={registerForm.email}
          onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder={UI_STRINGS.auth.emailPlaceholder}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
        <div>
          <label htmlFor="reg-company-name" style={labelStyle}>
            {UI_STRINGS.auth.companyNameLabel} *
          </label>
          <input
            id="reg-company-name"
            type="text"
            required
            value={registerForm.company_name}
            onChange={(e) => setRegisterForm((prev) => ({ ...prev, company_name: e.target.value }))}
            placeholder={UI_STRINGS.auth.companyNamePlaceholder}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="reg-company-address" style={labelStyle}>
            {UI_STRINGS.auth.companyAddressLabel} *
          </label>
          <input
            id="reg-company-address"
            type="text"
            required
            value={registerForm.company_address}
            onChange={(e) => setRegisterForm((prev) => ({ ...prev, company_address: e.target.value }))}
            placeholder={UI_STRINGS.auth.companyAddressPlaceholder}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label htmlFor="reg-password" style={labelStyle}>
            {UI_STRINGS.auth.passwordLabel} *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={registerForm.password}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={UI_STRINGS.auth.passwordPlaceholder}
              style={{ ...inputStyle, paddingRight: '30px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '7px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="reg-confirm-password" style={labelStyle}>
            {UI_STRINGS.auth.confirmPasswordLabel} *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={registerForm.confirm_password}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
              placeholder={UI_STRINGS.auth.confirmPasswordPlaceholder}
              style={{ ...inputStyle, paddingRight: '30px' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '7px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        id="btn-register-submit"
        disabled={loading}
        style={{
          marginTop: '3px',
          width: '100%',
          height: '37px',
          backgroundColor: '#0284c7',
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '12.5px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 3px 10px rgba(2, 132, 199, 0.22)',
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? UI_STRINGS.auth.registering : UI_STRINGS.auth.createAccountButton}
      </button>

      <div style={{ textAlign: 'center', marginTop: '1px' }}>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {UI_STRINGS.auth.alreadyHaveAccount}
        </button>
      </div>
    </form>
  );
};
