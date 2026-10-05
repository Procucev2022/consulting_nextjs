'use client';

/**
 * Enterprise Admin Portal Login Form Component
 * Dedicated administrative access gateway with RBAC security enforcement.
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ArrowRight, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import { apiClient } from '../../utils/api';
import frontendLogger from '../../utils/logger';
import type { AdminLoginFormProps } from '../../types';

export default function AdminLoginForm({
  onSuccess,
  onSwitchToCreate
}: AdminLoginFormProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: 'admin@procucev.com',
    password: 'Procucev@123'
  });

  const handleQuickFillAdmin = (): void => {
    setForm({
      email: 'admin@procucev.com',
      password: 'Procucev@123'
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

      if (res.user.role !== 'ADMIN') {
        frontendLogger.warn('Unauthorized access attempt by non-admin role', {
          userId: res.user.id,
          role: res.user.role
        });
        apiClient.clearStoredSession();
        setErrorMessage(UI_STRINGS.admin.accessDeniedMessage);
        setLoading(false);
        return;
      }

      setSuccessMessage(UI_STRINGS.admin.loginSuccessMessage);
      frontendLogger.info('Admin authenticated successfully', { userId: res.user.id });
      onSuccess(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : UI_STRINGS.common.error;
      frontendLogger.warn('Admin login failed', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-sky-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.admin.badgeAdminRole}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {UI_STRINGS.admin.loginHeading}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {UI_STRINGS.admin.loginSubheading}
        </p>
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={handleQuickFillAdmin}
          className="w-full py-2.5 px-4 rounded-xl border border-sky-500/30 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 hover:text-sky-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <UserCheck className="w-4 h-4 text-sky-400" />
          <span>{UI_STRINGS.admin.quickFillAdminButton}</span>
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-5 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="admin-login-email"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            {UI_STRINGS.admin.emailLabel}
          </label>
          <input
            id="admin-login-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={UI_STRINGS.admin.emailPlaceholder}
            className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="admin-login-password"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            {UI_STRINGS.admin.passwordLabel}
          </label>
          <div className="relative">
            <input
              id="admin-login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={UI_STRINGS.admin.passwordPlaceholder}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {UI_STRINGS.admin.loginHelperText}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? UI_STRINGS.admin.submittingLogin : UI_STRINGS.admin.submitLoginButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {onSwitchToCreate && (
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Need to provision or update admin account?{' '}
            <button
              type="button"
              onClick={onSwitchToCreate}
              className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline underline-offset-4"
            >
              {UI_STRINGS.admin.createTab}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
