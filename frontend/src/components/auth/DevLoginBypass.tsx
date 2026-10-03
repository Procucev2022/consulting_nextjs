'use client';

/**
 * Temporary Development Login & Quick Access Panel
 * Strictly isolated for local development / test environments.
 * Returns null in production environments.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import { DEV_TEMP_CREDENTIALS } from '../../constants/auth';

export interface DevLoginBypassProps {
  onFillCred: (email: string, pass: string) => void;
  onAdminBypass: () => void;
}

export const DevLoginBypass: React.FC<DevLoginBypassProps> = ({
  onFillCred,
  onAdminBypass
}) => {
  // Production Security Check: Strictly render only in local development.
  // Never enable via client/public environment variables in production.
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      marginTop: '16px',
      padding: '14px',
      backgroundColor: '#FFFBEB',
      border: '1px solid #FDE68A',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#B45309',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={13} className="text-amber-600" />
          {UI_STRINGS.auth.tempDevCredentialsBadge}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#92400E',
          backgroundColor: '#FEF3C7',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #FCD34D'
        }}>
          {UI_STRINGS.auth.devTestMode}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: '#92400E', lineHeight: 1.4 }}>
        {UI_STRINGS.auth.devBypassNotice}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
        {DEV_TEMP_CREDENTIALS.map((cred) => (
          <button
            key={cred.email}
            type="button"
            onClick={() => onFillCred(cred.email, cred.password)}
            style={{
              padding: '8px 10px',
              backgroundColor: '#FFFFFF',
              border: cred.role === 'ADMIN' ? '1px solid #BAE6FD' : '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#0B1B33',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease'
            }}
            title={`Fill ${cred.email}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontWeight: 700 }}>{cred.label}</span>
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: cred.role === 'ADMIN' ? '#E0F2FE' : '#F1F5F9',
                color: cred.role === 'ADMIN' ? '#0284c7' : '#475569'
              }}>{cred.badge}</span>
            </span>
            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>{cred.email}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdminBypass}
        style={{
          marginTop: '4px',
          padding: '9px 12px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: '8px',
          color: '#92400E',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <span>{UI_STRINGS.auth.goToAdminDirectly}</span>
      </button>
    </div>
  );
};
