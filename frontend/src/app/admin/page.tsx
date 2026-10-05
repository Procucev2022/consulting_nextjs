'use client';

/**
 * Enterprise Admin Portal Gateway (/admin)
 * Dedicated entry point where administrators can sign in or create/provision admin details
 * for admin@procucev.com with password Procucev@123.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { UI_STRINGS, AICEV_LOGO_SRC } from '../../constants';
import { apiClient } from '../../utils/api';
import frontendLogger from '../../utils/logger';
import AdminLoginForm from '../../components/admin/AdminLoginForm';
import CreateAdminDetailsForm from '../../components/admin/CreateAdminDetailsForm';
import AdminActiveSessionCard from '../../components/admin/AdminActiveSessionCard';
import type { AdminGatewayTab, UserProfile } from '../../types';

export default function AdminPage(): React.ReactElement {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminGatewayTab>('LOGIN');
  const [activeAdmin, setActiveAdmin] = useState<UserProfile | null>(null);

  useEffect(() => {
    const user = apiClient.getStoredUser();
    if (user?.role === 'ADMIN') {
      setActiveAdmin(user);
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile): void => {
    setActiveAdmin(user);
    frontendLogger.info('Admin logged in at /admin page', { email: user.email });
    setTimeout(() => {
      router.push('/admin/dashboard');
    }, 700);
  };

  const handleCreateSuccess = (user: UserProfile): void => {
    frontendLogger.info('Admin details created at /admin page', { email: user.email });
    setActiveTab('LOGIN');
  };

  const handleSignOut = (): void => {
    apiClient.clearStoredSession();
    setActiveAdmin(null);
    frontendLogger.info('Admin signed out from /admin page');
  };

  const handleOpenDashboard = (): void => {
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambience Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-sky-500/15 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-white/95 px-3 py-1.5 rounded-lg flex items-center shadow-md">
              <Image
                src={AICEV_LOGO_SRC}
                alt="aiCEV Procucev"
                width={110}
                height={28}
                className="h-7 w-auto object-contain"
                priority
              />
            </div>
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <span className="text-xs font-semibold text-sky-400 tracking-wider hidden sm:inline-block">
              {UI_STRINGS.admin.gatewayTitle}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.admin.backToDashboard}</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 z-10 max-w-2xl w-full mx-auto my-auto">
        {/* Active Session Notification if logged in */}
        {activeAdmin && (
          <AdminActiveSessionCard
            user={activeAdmin}
            onSignOut={handleSignOut}
            onOpenDashboard={handleOpenDashboard}
            onOpenCreateAdmin={() => setActiveTab('CREATE_ADMIN')}
          />
        )}

        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="Admin Navigation Tabs"
          className="w-full flex p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6 shadow-inner"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'LOGIN'}
            data-testid="admin-login-tab"
            onClick={() => setActiveTab('LOGIN')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'LOGIN'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{UI_STRINGS.admin.loginTab}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'CREATE_ADMIN'}
            data-testid="admin-create-tab"
            onClick={() => setActiveTab('CREATE_ADMIN')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'CREATE_ADMIN'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{UI_STRINGS.admin.createTab}</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'LOGIN' ? (
          <AdminLoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToCreate={() => setActiveTab('CREATE_ADMIN')}
          />
        ) : (
          <CreateAdminDetailsForm
            onSuccess={handleCreateSuccess}
            onSwitchToLogin={() => setActiveTab('LOGIN')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-slate-900 text-center text-xs text-slate-500 z-10">
        <p>
          &copy; {new Date().getFullYear()} Procucev aiCEV Strategic Sourcing Suite. Enterprise Admin Access Gateway.
        </p>
      </footer>
    </div>
  );
}
