'use client';

/**
 * Enterprise Admin Portal Login (/admin/login)
 * Dedicated administrative access gateway with RBAC security enforcement.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, ShieldAlert, Lock, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';
import { UI_STRINGS, AICEV_LOGO_SRC } from '../../../constants';
import { apiClient } from '../../../utils/api';
import frontendLogger from '../../../utils/logger';
import type { LoginFormData } from '../../../types';

export default function AdminLoginPage(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const handleQuickFillAdmin = () => {
    setForm({
      email: 'admin@procucev.com',
      password: 'Admin@123456'
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      frontendLogger.info('Admin login authentication attempt', { email: form.email });
      const res = await apiClient.login(form);

      // Verify that user possesses administrator role
      if (res.user.role !== 'ADMIN') {
        frontendLogger.warn('Unauthorized access attempt to admin console by non-admin role', {
          userId: res.user.id,
          role: res.user.role
        });
        apiClient.clearStoredSession();
        setErrorMessage('Access Denied: Administrative privileges required. Only system administrators can access this console.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Administrator authenticated successfully. Redirecting to Admin Dashboard...');
      frontendLogger.info('Admin authenticated successfully', { userId: res.user.id });

      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      frontendLogger.warn('Admin login failed', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050811',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.15), transparent), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(99, 102, 241, 0.12), transparent)',
      color: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <header style={{
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
        backgroundColor: 'rgba(11, 17, 32, 0.8)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              padding: '5px 14px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <Image
                src={AICEV_LOGO_SRC}
                alt={UI_STRINGS.header.logoAlt}
                width={130}
                height={34}
                priority
                style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
          </Link>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171'
          }}>
            <ShieldAlert size={13} />
            Admin Portal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/login"
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            ← Client Login
          </Link>
          <Link
            href="/"
            style={{
              fontSize: '13px',
              color: '#38bdf8',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              fontWeight: 500
            }}
          >
            Buyer Portal
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0b1329',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.1)',
          padding: '36px 32px',
          backdropFilter: 'blur(16px)'
        }}>
          {/* Card Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              marginBottom: '16px'
            }}>
              <Lock size={26} />
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#f8fafc',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              Administrator Sign In
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.5
            }}>
              Authorized system operators & administrative personnel only
            </p>
          </div>

          {/* Quick Fill Admin Button */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              id="admin-quick-fill-btn"
              onClick={handleQuickFillAdmin}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={14} />
              Quick-Fill Admin Credentials (admin@procucev.com)
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#86efac',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label htmlFor="admin-email" style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                placeholder="admin@procucev.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: '#070c18',
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
              <label htmlFor="admin-password" style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    backgroundColor: '#070c18',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="admin-login-submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '12px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading ? '#0284c7' : '#0ea5e9',
                backgroundImage: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                transition: 'opacity 0.2s ease'
              }}
            >
              {loading ? (
                <>Authenticating Administrator...</>
              ) : (
                <>
                  Enter Admin Dashboard
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b'
          }}>
            Protected System. Access attempts are cryptographically signed and logged.
            <div style={{ marginTop: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: 500 }}>
              🚀 Deployment Test: Active &amp; Verified
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
