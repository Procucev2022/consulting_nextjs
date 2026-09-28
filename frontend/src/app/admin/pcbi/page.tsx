'use client';

/**
 * Enterprise Admin Portal — PCBI Master Administration Route (/admin/pcbi)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield,
  Users,
  ExternalLink,
  LogOut,
  Layers
} from 'lucide-react';
import { AICEV_LOGO_SRC } from '../../../constants';
import { apiClient } from '../../../utils/api';
import { PCBIAdminMasterView } from '../../../components/admin/pcbi/PCBIAdminMasterView';
import type { UserProfile } from '../../../types';

export default function AdminPCBIPage(): React.ReactElement {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let session = apiClient.getStoredUser();
    if (session?.role !== 'ADMIN') {
      // Auto-seed development admin session
      const devAdmin: UserProfile = {
        id: 'usr-admin-sriman',
        name: 'Sriman Admin',
        email: 'sriman@procucev.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        subscription_tier: 'GOLD',
        company_name: 'Procucev Enterprise Solutions Pvt Ltd',
        created_at: new Date().toISOString()
      };
      apiClient.setStoredSession('dev-temp-token-sriman', devAdmin);
      session = devAdmin;
    }
    setCurrentUser(session);
    setLoading(false);
  }, [router]);

  const handleLogout = (): void => {
    apiClient.clearStoredSession();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 text-xs font-mono">
        Authenticating Administrator Access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/30">
                <Image src={AICEV_LOGO_SRC} alt="aiCEV" fill className="object-contain" priority />
              </div>
              <span className="font-extrabold text-white text-sm tracking-tight hidden sm:inline">
                aiCEV Enterprise
              </span>
            </Link>

            <span className="text-slate-600">/</span>

            <nav className="flex items-center space-x-1 text-xs font-bold">
              <Link
                href="/admin/dashboard"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <Users size={14} />
                <span>User Directory</span>
              </Link>
              <span className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-400" />
                <span>PCBI Master</span>
              </span>
            </nav>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
              <Shield size={13} className="text-cyan-400" />
              <span className="font-semibold text-white">{currentUser?.name}</span>
              <span className="text-[10px] text-cyan-300 font-mono">({currentUser?.email})</span>
            </div>

            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 transition-all"
            >
              <span>Main Workspace</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 font-bold flex items-center gap-1.5 transition-all"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <PCBIAdminMasterView />
      </main>
    </div>
  );
}
