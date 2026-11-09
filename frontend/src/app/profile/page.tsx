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
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { authApiClient } from '../../utils/authApi';
import { apiClient } from '../../utils/api';
import frontendLogger from '../../utils/logger';
import type { UserProfile, TenantMaster, RawDocumentIngestion, IngestionQueuePageCursor } from '../../types';
import { AICEV_LOGO_SRC, PASSWORD_MINIMUM_LENGTH, UI_STRINGS } from '../../constants';

export default function ProfilePage(): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantMaster | null>(null);
  const [ingestionQueue, setIngestionQueue] = useState<RawDocumentIngestion[]>([]);
  const [queueCursor, setQueueCursor] = useState<IngestionQueuePageCursor | null>(null);
  const [hasMoreIngestionDocuments, setHasMoreIngestionDocuments] = useState(false);
  const [isLoadingMoreIngestionDocuments, setIsLoadingMoreIngestionDocuments] = useState(false);
  const [totalIngestionDocuments, setTotalIngestionDocuments] = useState(0);
  const [profileLoadWarnings, setProfileLoadWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Theme Mode State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('procucev_theme');
      if (storedTheme === 'dark' || (!storedTheme && document.documentElement.classList.contains('dark'))) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        setTheme('light');
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (typeof window !== 'undefined') {
        localStorage.setItem('procucev_theme', 'dark');
      }
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      if (typeof window !== 'undefined') {
        localStorage.setItem('procucev_theme', 'light');
      }
    }
  };

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
        const loadWarnings: string[] = [];
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

        let meRes = null;
        if (storedToken) {
          try {
            meRes = await authApiClient.getMe(storedToken);
          } catch (error: unknown) {
            frontendLogger.warn('Profile refresh failed; evaluating the saved profile fallback', {
              action: 'profile.auth.refresh',
              userId: storedUser?.id,
              fallback: storedUser ? 'saved-profile' : 'login-redirect'
            }, error);
            if (storedUser) {
              const reason = error instanceof Error ? error.message : UI_STRINGS.header.userProfile.unknownLoadFailure;
              loadWarnings.push(UI_STRINGS.header.userProfile.profileRefreshFailed(reason));
            }
          }
        }

        if (!isMounted) return;

        const activeUser = meRes?.user || storedUser;
        if (!activeUser) {
          frontendLogger.warn('Profile access redirected because no verified buyer profile was available', {
            action: 'profile.auth',
            hadStoredToken: Boolean(storedToken)
          });
          authApiClient.clearStoredSession();
          router.push('/login');
          return;
        }

        if (activeUser.role === 'ADMIN') {
          router.push('/admin/dashboard');
          return;
        }

        setUser(activeUser);
        if (meRes?.user && storedToken) authApiClient.setStoredSession(storedToken, meRes.user);

        const activeTenantId = activeUser.tenant_id || undefined;
        if (!activeTenantId) {
          frontendLogger.warn('Profile data loading skipped because the verified user has no assigned tenant', {
            action: 'profile.tenant_assignment',
            userId: activeUser.id,
            role: activeUser.role
          });
          setTenant(null);
          setIngestionQueue([]);
          setQueueCursor(null);
          setHasMoreIngestionDocuments(false);
          setTotalIngestionDocuments(0);
          setProfileLoadWarnings(loadWarnings);
          return;
        }

        const [tenantResult, ingestionResult] = await Promise.allSettled([
          apiClient.getTenant(activeTenantId),
          apiClient.getIngestionData(activeTenantId)
        ]);

        if (!isMounted) return;

        if (tenantResult.status === 'fulfilled') {
          setTenant(tenantResult.value);
        } else {
          frontendLogger.error('Profile organization details failed to load', {
            action: 'profile.tenant.load',
            tenantId: activeTenantId,
            fallback: 'keep-profile-without-organization-details'
          }, tenantResult.reason);
          const reason = tenantResult.reason instanceof Error
            ? tenantResult.reason.message : UI_STRINGS.header.userProfile.unknownLoadFailure;
          loadWarnings.push(UI_STRINGS.header.userProfile.tenantLoadFailed(reason));
        }

        if (ingestionResult.status === 'fulfilled') {
          const ingRes = ingestionResult.value;
          if (ingRes.queue) setIngestionQueue(ingRes.queue.filter((doc) => doc.tenant_id === activeTenantId));
          if (ingRes.pagination?.queue) {
            setQueueCursor(ingRes.pagination.queue.nextCursor);
            setHasMoreIngestionDocuments(ingRes.pagination.queue.hasMore);
          }
          if (ingRes.summary) setTotalIngestionDocuments(ingRes.summary.totalFiles);
        } else {
          frontendLogger.error('Profile ingestion documents failed to load', {
            action: 'profile.ingestion.load',
            tenantId: activeTenantId,
            fallback: 'keep-profile-without-ingestion-documents'
          }, ingestionResult.reason);
          const reason = ingestionResult.reason instanceof Error
            ? ingestionResult.reason.message : UI_STRINGS.header.userProfile.unknownLoadFailure;
          loadWarnings.push(UI_STRINGS.header.userProfile.ingestionLoadFailed(reason));
        }
        setProfileLoadWarnings(loadWarnings);
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

  const handleLoadMoreIngestionDocuments = async (): Promise<void> => {
    if (!queueCursor || !hasMoreIngestionDocuments || isLoadingMoreIngestionDocuments || !user?.tenant_id) return;
    setIsLoadingMoreIngestionDocuments(true);
    try {
      const nextPage = await apiClient.getIngestionData(user.tenant_id, { queueCursor });
      setIngestionQueue((current) => {
        const documentsById = new Map(current.map((document) => [document.doc_id, document]));
        nextPage.queue.forEach((document) => documentsById.set(document.doc_id, document));
        return [...documentsById.values()];
      });
      setQueueCursor(nextPage.pagination.queue.nextCursor);
      setHasMoreIngestionDocuments(nextPage.pagination.queue.hasMore);
      if (nextPage.summary) setTotalIngestionDocuments(nextPage.summary.totalFiles);
    } catch (error: unknown) {
      frontendLogger.warn('Could not load the next D1 ingestion-document page', {
        action: 'profile.ingestion.loadMore', tenantId: user.tenant_id, cursor: queueCursor
      }, error);
      setDocActionMessage(error instanceof Error ? error.message : UI_STRINGS.module1.loadMoreIngestionDocumentsFailed);
    } finally {
      setIsLoadingMoreIngestionDocuments(false);
    }
  };

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

    if (newPassword.length < PASSWORD_MINIMUM_LENGTH) {
      setPasswordError(UI_STRINGS.profile.passwordMinimumLengthError(PASSWORD_MINIMUM_LENGTH));
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
      const hasErrorMessage = err instanceof Error && Boolean(err.message);
      frontendLogger.warn('Profile password update failed', {
        action: 'profile.password.change',
        userId: user?.id,
        tenantId: user?.tenant_id,
        fallback: hasErrorMessage ? 'caught-error-message' : 'localized-guidance'
      }, err);
      const msg = hasErrorMessage ? (err as Error).message : UI_STRINGS.profile.passwordChangeFallbackError;
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
      const activeTenantId = user?.tenant_id || authApiClient.getStoredUser()?.tenant_id || undefined;
      if (!activeTenantId) {
        setDocActionMessage(UI_STRINGS.auth.tenantAssignmentRequired);
        return;
      }
      const updatedQueue = await apiClient.deleteIngestionDocument(docId, activeTenantId);
      const buyerDocs = (updatedQueue || []).filter((doc) => doc.tenant_id === activeTenantId);
      setIngestionQueue(buyerDocs);
      setDocActionMessage(UI_STRINGS.profile.documentDeleted);
      setTimeout(() => setDocActionMessage(null), 3000);
    } catch (err: unknown) {
      const hasErrorMessage = err instanceof Error && Boolean(err.message);
      frontendLogger.error('Profile ingestion document deletion failed', {
        action: 'profile.ingestion.delete',
        tenantId: user?.tenant_id,
        documentId: docId,
        fallback: hasErrorMessage ? 'caught-error-message' : 'localized-guidance'
      }, err);
      const msg = hasErrorMessage ? (err as Error).message : UI_STRINGS.profile.deleteDocumentFallbackError;
      setDocActionMessage(msg);
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleUseDocument = (item: RawDocumentIngestion) => {
    router.push(`/?documentId=${encodeURIComponent(item.doc_id)}`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#EEF7FF] text-[#0B1B33] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] font-mono">
            {UI_STRINGS.profile.loadingCredentials}
          </p>
        </div>
      </div>
    );
  }

  const activeUser = user;

  const initials = activeUser.name
    ? activeUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : UI_STRINGS.profile.fallbackInitials;

  const formattedJoinDate = activeUser.created_at
    ? new Date(activeUser.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : UI_STRINGS.profile.activeMemberFallback;

  return (
    <div className="min-h-screen bg-[#EEF7FF] text-[#0B1B33] bg-grid-pattern pb-16 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#080c16]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#EEF4FC] hover:bg-slate-200 dark:hover:bg-[#DCE7F5] border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.profile.backToDashboard}</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
          <div className="flex items-center space-x-2">
            <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              <Image
                src={AICEV_LOGO_SRC}
                alt={UI_STRINGS.header.logoAlt}
                width={80}
                height={22}
                className="h-4.5 w-auto object-contain"
                priority
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden md:inline">
              {UI_STRINGS.profile.enterpriseProfileSecurity}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-xl p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => toggleTheme('light')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/90'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={UI_STRINGS.profile.themeLightTitle}
            >
              <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`} />
              <span className="text-[11px] hidden sm:inline">{UI_STRINGS.profile.themeLightLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleTheme('dark')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-[#EEF4FC] text-cyan-400 shadow-xs font-bold border border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={UI_STRINGS.profile.themeDarkTitle}
            >
              <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-400'}`} />
              <span className="text-[11px] hidden sm:inline">{UI_STRINGS.profile.themeDarkLabel}</span>
            </button>
          </div>

          {activeUser.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 rounded-xl hover:bg-cyan-200 dark:hover:bg-cyan-900 transition-all shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
              <span>{UI_STRINGS.profile.adminDirectory}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">{UI_STRINGS.auth.logout}</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {profileLoadWarnings.length > 0 && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{profileLoadWarnings.join(' ')}</p>
          </div>
        )}
        {/* Profile Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/40 border border-sky-100 dark:border-cyan-500/20 p-6 sm:p-8 shadow-sm dark:shadow-xl">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              {/* Avatar Circle */}
              <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-600 to-indigo-600 text-white text-2xl sm:text-3xl font-black shadow-lg shadow-cyan-600/20 ring-4 ring-white dark:ring-slate-800">
                <span>{initials}</span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title={UI_STRINGS.profile.activeAccount} />
              </div>

              {/* Title & Bio */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{activeUser.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    activeUser.role === 'ADMIN'
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                      : 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                  }`}>
                    {UI_STRINGS.profile.accountRole(activeUser.role)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {activeUser.status}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-cyan-800 dark:text-cyan-300 font-medium flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <span>{activeUser.company_name}</span>
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span>{UI_STRINGS.profile.memberSince(formattedJoinDate)}</span>
                </p>
              </div>
            </div>

            {/* Quick Telemetry Chip */}
            <div className="flex flex-col sm:items-end space-y-2 bg-white dark:bg-white border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl sm:min-w-[220px] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                {UI_STRINGS.profile.buyerIdentifier}
              </span>
              <div className="flex items-center space-x-2">
                <code className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-1 rounded border border-cyan-200 dark:border-cyan-800">
                  {activeUser.id}
                </code>
                <button
                  type="button"
                  onClick={handleCopyBuyerId}
                  title={UI_STRINGS.profile.copyBuyerId}
                  className="p-1 rounded bg-slate-100 dark:bg-[#EEF4FC] hover:bg-slate-200 dark:hover:bg-[#DCE7F5] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{UI_STRINGS.profile.uniqueAccountReference}</span>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal & Contact Credentials */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-lg space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {UI_STRINGS.profile.contactUserInformation}
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.fullName}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{activeUser.name}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.organizationEmail}</span>
                <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-semibold">{activeUser.email}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.mobileContact}</span>
                <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span className="font-mono">{activeUser.mobile_number}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.securityRole}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {activeUser.role === 'ADMIN' ? UI_STRINGS.profile.fullEnterpriseAdminPrivileges : UI_STRINGS.profile.standardProcurementBuyerAccess}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Organization & Enterprise Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-lg space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {UI_STRINGS.profile.enterpriseFacilityProfile}
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.companyName}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{activeUser.company_name}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.companyAddress}</span>
                <div className="flex items-start space-x-1.5 text-slate-700 dark:text-slate-300 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{activeUser.company_address}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.majorSectorTaxonomy}</span>
                <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 mt-0.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                    {tenant?.major_sector || UI_STRINGS.profile.fallbackMajorSector}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-600 dark:text-slate-400">{tenant?.minor_sector || UI_STRINGS.profile.fallbackMinorSector}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">{UI_STRINGS.profile.primaryEvaluationCurrency}</span>
                <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {UI_STRINGS.profile.evaluationCurrency(tenant?.base_currency || UI_STRINGS.profile.fallbackCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Change Password & Security Management */}
        <div className="p-6 rounded-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-lg space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {UI_STRINGS.auth.changePasswordHeading}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {UI_STRINGS.auth.changePasswordSubheading}
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div role="status" className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Current Password */}
            <div>
              <label htmlFor="curr-password" className="block text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
                {UI_STRINGS.auth.currentPasswordLabel} *
              </label>
              <div className="relative">
                <input
                  id="curr-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={UI_STRINGS.auth.passwordPlaceholder}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  aria-label={showCurrentPassword ? UI_STRINGS.profile.hideCurrentPassword : UI_STRINGS.profile.showCurrentPassword}
                >
                  {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
                {UI_STRINGS.profile.passwordMinimumLabel(PASSWORD_MINIMUM_LENGTH)}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={UI_STRINGS.auth.passwordPlaceholder}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  aria-label={showNewPassword ? UI_STRINGS.profile.hideNewPassword : UI_STRINGS.profile.showNewPassword}
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="conf-password" className="block text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
                {UI_STRINGS.auth.confirmPasswordLabel} *
              </label>
              <div className="relative">
                <input
                  id="conf-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={UI_STRINGS.auth.passwordPlaceholder}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  aria-label={showConfirmPassword ? UI_STRINGS.profile.hideConfirmPassword : UI_STRINGS.profile.showConfirmPassword}
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
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                {passwordLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{UI_STRINGS.profile.updatingPassword}</span>
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
        <div className="p-6 rounded-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {UI_STRINGS.profile.uploadedDatasetsHeading}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {UI_STRINGS.profile.uploadedDatasetsDescription}
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-all self-start sm:self-auto"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.profile.uploadNewDataset}</span>
            </Link>
          </div>

          {docActionMessage && (
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-800 dark:text-cyan-300 flex items-center space-x-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{docActionMessage}</span>
            </div>
          )}

          {ingestionQueue.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50 dark:bg-[#F8FBFE] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{UI_STRINGS.profile.noIngestedDocuments}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                  {UI_STRINGS.profile.noIngestedDocumentsDescription}
                </p>
              </div>
              <Link
                href="/"
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{UI_STRINGS.profile.uploadPurchaseHistory}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500" aria-live="polite">
                {UI_STRINGS.module1.showingIngestionDocuments(ingestionQueue.length, totalIngestionDocuments)}
              </p>
              {ingestionQueue.map((item) => (
                <div
                  key={item.doc_id || item.file_name}
                  className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{item.file_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-[#EEF4FC] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 uppercase">
                          {item.file_type || UI_STRINGS.profile.fileTypeFallback}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {item.ocr_status || UI_STRINGS.common.completed}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <span>{UI_STRINGS.profile.fileSizeLabel} <strong className="text-slate-900 dark:text-slate-200">{item.file_size_mb} {UI_STRINGS.profile.fileSizeUnit}</strong></span>
                        <span>•</span>
                        <span>{UI_STRINGS.profile.rowsLabel} <strong className="text-slate-900 dark:text-slate-200">{item.records_count?.toLocaleString() ?? '0'}</strong></span>
                        <span>•</span>
                        <span>{UI_STRINGS.profile.evaluatedSpendLabel} <strong className="text-emerald-700 dark:text-emerald-400">{UI_STRINGS.common.croreAmount((item.converted_inr_crores ?? 0).toFixed(2))}</strong></span>
                        <span>•</span>
                        <span>{UI_STRINGS.profile.currenciesLabel} <strong className="text-cyan-800 dark:text-cyan-300 font-semibold">{item.detected_currencies?.join(', ') || UI_STRINGS.profile.fallbackCurrency}</strong></span>
                      </div>

                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                        {UI_STRINGS.profile.documentDetails(item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : UI_STRINGS.profile.recentUploadFallback, item.doc_id)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleUseDocument(item)}
                      className="px-3.5 py-1.5 text-xs font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 hover:border-cyan-500 dark:hover:border-cyan-600 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                      title={UI_STRINGS.profile.openDocumentTitle}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{UI_STRINGS.profile.useDocument}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(item.doc_id)}
                      disabled={deletingDocId === item.doc_id}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 disabled:opacity-50 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                      title={UI_STRINGS.profile.deleteDocumentTitle}
                    >
                      {deletingDocId === item.doc_id ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      )}
                      <span>{UI_STRINGS.profile.deleteDocument}</span>
                    </button>
                  </div>
                </div>
              ))}
              {hasMoreIngestionDocuments && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleLoadMoreIngestionDocuments}
                    disabled={isLoadingMoreIngestionDocuments}
                    className="px-4 py-2 text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 disabled:opacity-60 rounded-lg border border-cyan-200 transition-colors"
                  >
                    {isLoadingMoreIngestionDocuments
                      ? UI_STRINGS.module1.loadingMoreIngestionDocuments
                      : UI_STRINGS.module1.loadMoreIngestionDocuments}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
