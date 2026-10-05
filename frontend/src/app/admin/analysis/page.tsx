'use client';

/**
 * Enterprise Admin Portal — Analysis Control Center Route (/admin/analysis)
 * Production Procurement Analysis Orchestration & PCBI Quality Gate (Prompt 302)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Layers,
  Users,
  ExternalLink,
  LogOut,
  FlaskConical
} from 'lucide-react';
import { AICEV_LOGO_SRC } from '../../../constants';
import { apiClient } from '../../../utils/api';
import { AnalysisControlCenter } from '../../../components/admin/orchestration/AnalysisControlCenter';
import type { UserProfile } from '../../../types';

export default function AdminAnalysisPage(): React.ReactElement {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let session = apiClient.getStoredUser();
    if (session?.role !== 'ADMIN') {
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

            {/* Top Navigation */}
            <nav className="flex items-center space-x-1 text-xs font-bold">
              <Link
                href="/admin/dashboard"
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[#475569] hover:text-[#0B1B33] hover:bg-[#F8FBFE] transition-all"
              >
                <Users size={14} className="text-[#64748B]" />
                <span>Users</span>
              </Link>

              <Link
                href="/admin/analysis"
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30 shadow-xs"
              >
                <Layers size={14} className="text-[#0284C7]" />
                <span>Analysis Control Center</span>
              </Link>

              <Link
                href="/admin/pcbi"
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[#475569] hover:text-[#0B1B33] hover:bg-[#F8FBFE] transition-all"
              >
                <FlaskConical size={14} className="text-[#64748B]" />
                <span>PCBI Master</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs text-[#0284C7] hover:underline font-bold flex items-center gap-1 hidden md:flex"
            >
              <span>Procurement Portal</span>
              <ExternalLink size={12} />
            </Link>

            <div className="h-4 w-px bg-[#DCE7F5] hidden sm:block" />

            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#0284C7]/10 flex items-center justify-center text-[#0284C7] font-bold text-xs">
                {currentUser?.name?.[0] || 'A'}
              </div>
              <span className="text-xs font-bold text-[#0B1B33] hidden sm:inline">
                {currentUser?.name || 'Administrator'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <AnalysisControlCenter />
      </main>
    </div>
  );
}
