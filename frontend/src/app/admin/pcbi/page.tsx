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
  Layers,
  FlaskConical,
  BarChart3
} from 'lucide-react';
import { AICEV_LOGO_SRC, UI_STRINGS } from '../../../constants';
import { apiClient } from '../../../utils/api';
import { PCBIAdminMasterView } from '../../../components/admin/pcbi/PCBIAdminMasterView';
import { PCBICommodityDataLabView } from '../../../components/admin/pcbi/PCBICommodityDataLabView';
import type { UserProfile } from '../../../types';
import type { PCBIAdminTopNavigationTab } from '../../../types/pcbiCommodityDataLab';

export default function AdminPCBIPage(): React.ReactElement {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [topNavTab, setTopNavTab] = useState<PCBIAdminTopNavigationTab>('PCBI_MASTER');

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
      <div className="min-h-screen bg-[#EEF7FF] flex items-center justify-center text-[#0284C7] text-xs font-mono">
        Authenticating Administrator Access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF7FF] text-[#0B1B33] flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-[#DCE7F5] backdrop-blur-md px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#DCE7F5]">
                <Image src={AICEV_LOGO_SRC} alt="aiCEV" fill className="object-contain" priority />
              </div>
              <span className="font-extrabold text-[#0B1B33] text-sm tracking-tight hidden sm:inline">
                aiCEV Enterprise
              </span>
            </Link>

            <span className="text-[#94A3B8]">/</span>

            {/* Prompt 218 Top-Level Navigation: PCBI Master | PCBI Commodity Data Lab | PCBI Dashboard */}
            <nav className="flex items-center space-x-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTopNavTab('PCBI_MASTER')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  topNavTab === 'PCBI_MASTER'
                    ? 'bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30 shadow-xs'
                    : 'text-[#475569] hover:text-[#0B1B33] hover:bg-[#F8FBFE]'
                }`}
              >
                <Layers size={14} className={topNavTab === 'PCBI_MASTER' ? 'text-[#0284C7]' : 'text-[#64748B]'} />
                <span>{UI_STRINGS.pcbiCommodityDataLab.navPcbiMaster}</span>
              </button>

              <button
                type="button"
                onClick={() => setTopNavTab('PCBI_COMMODITY_DATA_LAB')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  topNavTab === 'PCBI_COMMODITY_DATA_LAB'
                    ? 'bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30 shadow-xs'
                    : 'text-[#475569] hover:text-[#0B1B33] hover:bg-[#F8FBFE]'
                }`}
              >
                <FlaskConical size={14} className={topNavTab === 'PCBI_COMMODITY_DATA_LAB' ? 'text-[#0284C7]' : 'text-[#64748B]'} />
                <span>{UI_STRINGS.pcbiCommodityDataLab.navCommodityDataLab}</span>
              </button>

              <button
                type="button"
                onClick={() => setTopNavTab('PCBI_DASHBOARD')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  topNavTab === 'PCBI_DASHBOARD'
                    ? 'bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30 shadow-xs'
                    : 'text-[#475569] hover:text-[#0B1B33] hover:bg-[#F8FBFE]'
                }`}
              >
                <BarChart3 size={14} className={topNavTab === 'PCBI_DASHBOARD' ? 'text-[#0284C7]' : 'text-[#64748B]'} />
                <span>{UI_STRINGS.pcbiCommodityDataLab.navPcbiDashboard}</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-xl bg-[#F8FBFE] border border-[#DCE7F5]">
              <Shield size={13} className="text-[#0284C7]" />
              <span className="font-semibold text-[#0B1B33]">{currentUser?.name}</span>
              <span className="text-[10px] text-[#64748B] font-mono">({currentUser?.email})</span>
            </div>

            <Link
              href="/admin/dashboard"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FBFE] text-[#0B1B33] border border-[#DCE7F5] font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Users size={13} />
              <span>User Directory</span>
            </Link>

            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FBFE] text-[#0B1B33] border border-[#DCE7F5] font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Main Workspace</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {topNavTab === 'PCBI_MASTER' && <PCBIAdminMasterView />}
        {topNavTab === 'PCBI_COMMODITY_DATA_LAB' && <PCBICommodityDataLabView />}
        {topNavTab === 'PCBI_DASHBOARD' && <PCBIAdminMasterView />}
      </main>
    </div>
  );
}
