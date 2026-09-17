'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Shield,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowLeft,
  LogOut,
  Copy,
  Check,
  CreditCard,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Trash2,
  UploadCloud,
  FileText,
  AlertCircle
} from 'lucide-react';
import { authApiClient } from '../../utils/authApi';
import { apiClient } from '../../utils/api';
import type { UserProfile, TenantMaster, RawDocumentIngestion } from '../../types';
import { AICEV_LOGO_SRC, UI_STRINGS } from '../../constants';

export default function ProfilePage(): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantMaster | null>(null);
  const [ingestionQueue, setIngestionQueue] = useState<RawDocumentIngestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Deleting document state
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [docActionMessage, setDocActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        const storedUser = authApiClient.getStoredUser();
        const storedToken = authApiClient.getStoredToken();

        // Redirect unauthenticated visitors to login page
        if (!storedUser && !storedToken) {
          router.push('/login');
          return;
        }

        // Admins belong in the Admin Portal, not the buyer profile page
        if (storedUser?.role === 'ADMIN') {
          router.push('/admin/dashboard');
          return;
        }

        if (storedUser && isMounted) {
          setUser(storedUser);
        }

        const activeBuyerId = storedUser?.id;

        const [meRes, tRes, ingRes] = await Promise.all([
          storedToken ? authApiClient.getMe(storedToken).catch(() => null) : Promise.resolve(null),
          apiClient.getTenant().catch(() => null),
          apiClient.getIngestionData(activeBuyerId).catch(() => null)
        ]);

        if (!isMounted) return;

        if (meRes?.user) {
          if (meRes.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
            return;
          }
          setUser(meRes.user);
          if (storedToken) authApiClient.setStoredSession(storedToken, meRes.user);
        }

        if (tRes) {
          setTenant(tRes);
        }

        if (ingRes?.queue) {
          const buyerDocs = activeBuyerId
            ? ingRes.queue.filter(
                (doc) => !doc.tenant_id || doc.tenant_id === activeBuyerId || doc.tenant_id === storedUser?.email
              )
            : ingRes.queue;
          setIngestionQueue(buyerDocs);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCopyBuyerId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogout = () => {
    authApiClient.clearStoredSession();
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(UI_STRINGS.auth.passwordMismatchError);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authApiClient.changePassword({
        currentPassword,
        newPassword
      });
      setPasswordSuccess(res.message || UI_STRINGS.auth.passwordChangedSuccess);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteDocument = async (docId?: string) => {
    if (!docId) return;
    setDeletingDocId(docId);
    setDocActionMessage(null);
    try {
      const activeBuyerId = user?.id || authApiClient.getStoredUser()?.id;
      const updatedQueue = await apiClient.deleteIngestionDocument(docId, activeBuyerId);
      const buyerDocs = (updatedQueue || []).filter(
        (doc) => !doc.tenant_id || doc.tenant_id === activeBuyerId || doc.tenant_id === user?.email
      );
      setIngestionQueue(buyerDocs);
      setDocActionMessage('Document successfully removed from repository.');
      setTimeout(() => setDocActionMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      setDocActionMessage(msg);
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleUseDocument = (item: RawDocumentIngestion) => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('procucev_uploaded_dataset', JSON.stringify({ doc: item }));
    }
    router.push('/');
  };

  if (loading || user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-mono">
            {user?.role === 'ADMIN' ? 'Redirecting to Admin Portal...' : 'Loading enterprise profile credentials...'}
          </p>
        </div>
      </div>
    );
  }

  const activeUser = user || {
    id: 'BUYER-DEMO-001',
    name: 'Enterprise Buyer',
    email: 'buyer@organization.com',
    mobile_number: '+91 98765 43210',
    company_name: tenant?.enterprise_name || 'Industrial Dynamics Corp',
    company_address: 'Enterprise Towers, Procurement Block, Peenya Industrial Area, Bengaluru',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    subscription_tier: 'ENTERPRISE_PRO',
    created_at: new Date().toISOString()
  };

  const initials = activeUser.name
    ? activeUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const formattedJoinDate = activeUser.created_at
    ? new Date(activeUser.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Active Member';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 bg-grid-pattern pb-16 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-cyan-700 transition-colors px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <div className="flex items-center space-x-2">
            <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              <Image
                src={AICEV_LOGO_SRC}
                alt="aiCEV Logo"
                width={80}
                height={22}
                className="h-4.5 w-auto object-contain"
                priority
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden md:inline">
              Enterprise Profile & Security
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {activeUser.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-100 border border-cyan-300 rounded-xl hover:bg-cyan-200 transition-all shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
              <span>Admin Directory</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Profile Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-100 p-6 sm:p-8 shadow-sm">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              {/* Avatar Circle */}
              <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-600 to-indigo-600 text-white text-2xl sm:text-3xl font-black shadow-lg shadow-cyan-600/20 ring-4 ring-white">
                <span>{initials}</span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Active Account" />
              </div>

              {/* Title & Bio */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{activeUser.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    activeUser.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                  }`}>
                    {activeUser.role} Account
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {activeUser.status}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-cyan-800 font-medium flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-cyan-600" />
                  <span>{activeUser.company_name}</span>
                </p>

                <p className="text-[11px] text-slate-500 flex items-center space-x-2 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>Member since {formattedJoinDate}</span>
                </p>
              </div>
            </div>

            {/* Quick Telemetry Chip */}
            <div className="flex flex-col sm:items-end space-y-2 bg-white border border-slate-200 p-3.5 rounded-2xl sm:min-w-[220px] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Buyer Identifier (ID)
              </span>
              <div className="flex items-center space-x-2">
                <code className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
                  {activeUser.id}
                </code>
                <button
                  type="button"
                  onClick={handleCopyBuyerId}
                  title="Copy Buyer ID"
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Unique Account Reference</span>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal & Contact Credentials */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-cyan-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Contact & User Information
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Full Name</span>
                <span className="font-bold text-slate-900 text-sm">{activeUser.name}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Organization Email</span>
                <div className="flex items-center space-x-1.5 text-slate-800 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-cyan-700 font-semibold">{activeUser.email}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Mobile Contact</span>
                <div className="flex items-center space-x-1.5 text-slate-800 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{activeUser.mobile_number}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Security & Role</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">
                    {activeUser.role === 'ADMIN' ? 'Full Enterprise Admin Privileges' : 'Standard Procurement Buyer Access'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Organization & Enterprise Details */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Enterprise & Facility Profile
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Company Name</span>
                <span className="font-bold text-slate-900 text-sm">{activeUser.company_name}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Company Address</span>
                <div className="flex items-start space-x-1.5 text-slate-700 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{activeUser.company_address}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Major Sector & Taxonomy</span>
                <div className="flex items-center space-x-1.5 text-slate-800 mt-0.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="font-semibold text-cyan-700">
                    {tenant?.major_sector || 'Chemical & Petrochemicals'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">{tenant?.minor_sector || 'Specialty Chemicals'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Primary Evaluation Currency</span>
                <div className="flex items-center space-x-1.5 text-slate-800 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono font-bold text-emerald-700">
                    {tenant?.base_currency || 'INR'} (Crores ₹ Cr)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Change Password & Security Management */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-cyan-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {UI_STRINGS.auth.changePasswordHeading}
              </h2>
              <p className="text-[11px] text-slate-500">
                {UI_STRINGS.auth.changePasswordSubheading}
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Current Password */}
            <div>
              <label htmlFor="curr-password" className="block text-slate-600 text-[11px] font-semibold mb-1.5">
                {UI_STRINGS.auth.currentPasswordLabel} *
              </label>
              <div className="relative">
                <input
                  id="curr-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-slate-600 text-[11px] font-semibold mb-1.5">
                {UI_STRINGS.auth.newPasswordLabel} (Min 6 chars) *
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="conf-password" className="block text-slate-600 text-[11px] font-semibold mb-1.5">
                {UI_STRINGS.auth.confirmPasswordLabel} *
              </label>
              <div className="relative">
                <input
                  id="conf-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                id="btn-change-password-submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                {passwordLoading ? (
                  <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{UI_STRINGS.auth.changePasswordButton}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section: Uploaded Procurement Documents Repository */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Uploaded Procurement Datasets & Object Store
                </h2>
                <p className="text-[11px] text-slate-500">
                  Manage multi-currency purchase history files and structured ERP documents
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-all self-start sm:self-auto"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-600" />
              <span>Upload New Dataset</span>
            </Link>
          </div>

          {docActionMessage && (
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-800 flex items-center space-x-2">
              <Check className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>{docActionMessage}</span>
            </div>
          )}

          {ingestionQueue.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-400" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">No Ingested Documents Found for this Account</p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Upload multi-currency purchase history spreadsheets (.xlsx, .csv) to begin AI diagnostics and spend optimization.
                </p>
              </div>
              <Link
                href="/"
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Purchase History Now</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {ingestionQueue.map((item) => (
                <div
                  key={item.doc_id || item.file_name}
                  className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-cyan-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-700 shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">{item.file_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700 border border-slate-300 uppercase">
                          {item.file_type || 'XLSX'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {item.ocr_status || 'Completed'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                        <span>Size: <strong className="text-slate-900">{item.file_size_mb} MB</strong></span>
                        <span>•</span>
                        <span>Rows: <strong className="text-slate-900">{item.records_count?.toLocaleString() ?? '0'}</strong></span>
                        <span>•</span>
                        <span>Evaluated Spend: <strong className="text-emerald-700">₹{(item.converted_inr_crores ?? 0).toFixed(2)} Cr</strong></span>
                        <span>•</span>
                        <span>Currencies: <strong className="text-cyan-800 font-semibold">{item.detected_currencies?.join(', ') || 'INR'}</strong></span>
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                        Uploaded on {item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : 'Recent'} • Doc ID: {item.doc_id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleUseDocument(item)}
                      className="px-3.5 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-300 hover:border-cyan-500 hover:bg-cyan-100 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                      title="Open and view in workspace"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Use this Document</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(item.doc_id)}
                      disabled={deletingDocId === item.doc_id}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 disabled:opacity-50 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                      title="Delete document and remove from object store"
                    >
                      {deletingDocId === item.doc_id ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
