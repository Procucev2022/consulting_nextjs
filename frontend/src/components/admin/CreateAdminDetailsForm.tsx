'use client';

/**
 * Enterprise Admin Details Creation / Provisioning Form Component
 * Enables creation and configuration of administrative account details:
 * admin@procucev.com with password Procucev@123.
 */

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { UI_STRINGS, DEFAULT_ADMIN_DETAILS } from '../../constants';
import { apiClient } from '../../utils/api';
import frontendLogger from '../../utils/logger';
import type { CreateAdminDetailsFormProps, CreateAdminDetailsPayload, UserProfile } from '../../types';

export default function CreateAdminDetailsForm({
  onSuccess,
  onSwitchToLogin
}: CreateAdminDetailsFormProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);

  const [form, setForm] = useState<CreateAdminDetailsPayload>({
    name: DEFAULT_ADMIN_DETAILS.name,
    email: DEFAULT_ADMIN_DETAILS.email,
    mobile_number: DEFAULT_ADMIN_DETAILS.mobile_number,
    company_name: DEFAULT_ADMIN_DETAILS.company_name,
    company_address: DEFAULT_ADMIN_DETAILS.company_address,
    password: DEFAULT_ADMIN_DETAILS.password,
    confirm_password: DEFAULT_ADMIN_DETAILS.password,
    role: DEFAULT_ADMIN_DETAILS.role,
    subscription_tier: DEFAULT_ADMIN_DETAILS.subscription_tier
  });

  const handleFillDefaultDetails = (): void => {
    setForm({
      name: DEFAULT_ADMIN_DETAILS.name,
      email: DEFAULT_ADMIN_DETAILS.email,
      mobile_number: DEFAULT_ADMIN_DETAILS.mobile_number,
      company_name: DEFAULT_ADMIN_DETAILS.company_name,
      company_address: DEFAULT_ADMIN_DETAILS.company_address,
      password: DEFAULT_ADMIN_DETAILS.password,
      confirm_password: DEFAULT_ADMIN_DETAILS.password,
      role: DEFAULT_ADMIN_DETAILS.role,
      subscription_tier: DEFAULT_ADMIN_DETAILS.subscription_tier
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (form.password !== form.confirm_password) {
      setErrorMessage('Passwords do not match. Please ensure both password fields are identical.');
      setLoading(false);
      return;
    }

    try {
      frontendLogger.info('Provisioning administrator details', { email: form.email });
      const res = await apiClient.createAdminUser(form);

      setCreatedUser(res.user);
      setSuccessMessage(UI_STRINGS.admin.createSuccessMessage);
      frontendLogger.info('Administrator details provisioned', { userId: res.user.id });
      onSuccess(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : UI_STRINGS.common.error;
      frontendLogger.warn('Admin provisioning failed', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-sky-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.admin.badgeGoldTier}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {UI_STRINGS.admin.createHeading}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {UI_STRINGS.admin.createSubheading}
        </p>
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={handleFillDefaultDetails}
          className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>{UI_STRINGS.admin.fillDefaultDetailsButton}</span>
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
          <div>
            <div className="font-semibold">{successMessage}</div>
            {createdUser && (
              <div className="text-xs text-emerald-300/80 mt-1 font-mono">
                Email: {createdUser.email} | Role: {createdUser.role} | Tier: {createdUser.subscription_tier}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="create-admin-name"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {UI_STRINGS.admin.fullNameLabel}
            </label>
            <input
              id="create-admin-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={UI_STRINGS.admin.fullNamePlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="create-admin-email"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {UI_STRINGS.admin.emailLabel}
            </label>
            <input
              id="create-admin-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={UI_STRINGS.admin.emailPlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="create-admin-mobile"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {UI_STRINGS.admin.mobileLabel}
            </label>
            <input
              id="create-admin-mobile"
              type="text"
              required
              value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
              placeholder={UI_STRINGS.admin.mobilePlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="create-admin-company"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {UI_STRINGS.admin.companyNameLabel}
            </label>
            <input
              id="create-admin-company"
              type="text"
              required
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder={UI_STRINGS.admin.companyNamePlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="create-admin-address"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            {UI_STRINGS.admin.companyAddressLabel}
          </label>
          <input
            id="create-admin-address"
            type="text"
            required
            value={form.company_address}
            onChange={(e) => setForm({ ...form, company_address: e.target.value })}
            placeholder={UI_STRINGS.admin.companyAddressPlaceholder}
            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="create-admin-password"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {UI_STRINGS.admin.passwordLabel}
            </label>
            <input
              id="create-admin-password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={UI_STRINGS.admin.passwordPlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="create-admin-confirm-password"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {UI_STRINGS.admin.confirmPasswordLabel}
            </label>
            <input
              id="create-admin-confirm-password"
              type="password"
              required
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              placeholder={UI_STRINGS.admin.passwordPlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          {UI_STRINGS.admin.createHelperText}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer mt-2"
        >
          <span>{loading ? UI_STRINGS.admin.submittingCreate : UI_STRINGS.admin.submitCreateButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Already configured admin details?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline underline-offset-4"
            >
              {UI_STRINGS.admin.loginTab}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
