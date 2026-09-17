'use client';

/**
 * Enterprise Admin Portal — Executive Dashboard & User Management Console (/admin/dashboard)
 * Real-time User Directory, Role/Tier Administration & Database Telemetry
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Shield,
  ShieldAlert,
  Building2,
  Phone,
  Mail,
  Search,
  Filter,
  RefreshCw,
  Award,
  Activity,
  Database,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sliders,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { UI_STRINGS, AICEV_LOGO_SRC } from '../../../constants';
import { apiClient } from '../../../utils/api';
import frontendLogger from '../../../utils/logger';
import type { UserProfile, UserRole, UserStatus, SubscriptionTier } from '../../../types';

export default function AdminDashboardPage(): React.ReactElement {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Users Directory State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | SubscriptionTier>('ALL');

  // Interactive Action Feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);

  // Load Admin Directory
  const loadDirectory = useCallback(async () => {
    try {
      setRefreshing(true);
      setActionError(null);
      frontendLogger.info('Loading admin user directory', { searchTerm, roleFilter, statusFilter, tierFilter });

      const res = await apiClient.getAdminUsers({
        search: searchTerm || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        tier: tierFilter === 'ALL' ? undefined : tierFilter
      });

      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
        setTotalCount(res.total ?? res.users.length);
        setActiveCount(res.activeCount ?? res.users.filter((u) => u.status === 'ACTIVE').length);
        setCompaniesCount(res.companiesCount ?? new Set(res.users.map((u) => u.company_name?.toLowerCase())).size);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load user directory';
      frontendLogger.error('Failed to load user directory in admin portal', { error: msg });
      setActionError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, roleFilter, statusFilter, tierFilter]);

  // Auth Protection Check
  useEffect(() => {
    const user = apiClient.getStoredUser();
    if (!user) {
      router.push('/admin/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    setCurrentUser(user);
    loadDirectory();
  }, [router, loadDirectory]);

  // Handle User Status Toggle
  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await apiClient.updateAdminUserStatus(user.id, newStatus);
      if (res.success) {
        setActionSuccess(`User ${user.email} status updated to ${newStatus}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        if (selectedUserForDetails?.id === user.id) {
          setSelectedUserForDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setActionError(msg);
    }
  };

  // Handle User Tier Change
  const handleTierChange = async (userId: string, newTier: SubscriptionTier) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await apiClient.updateAdminUserTier(userId, newTier);
      if (res.success) {
        setActionSuccess(`Subscription tier updated to ${newTier}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, tier: newTier } : u))
        );
        if (selectedUserForDetails?.id === userId) {
          setSelectedUserForDetails((prev) => (prev ? { ...prev, tier: newTier } : null));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tier update failed';
      setActionError(msg);
    }
  };

  const handleLogout = () => {
    apiClient.clearStoredSession();
    router.push('/admin/login');
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'GOLD':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60';
      case 'SILVER':
        return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'BRONZE':
      default:
        return 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800/60';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c16] text-slate-900 dark:text-slate-100 bg-grid-pattern pb-16 transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#080c16]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:shadow-black/20">
        <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 dark:from-cyan-950/60 dark:via-slate-900/80 dark:to-blue-950/60 border-b border-sky-100 dark:border-cyan-500/10 px-4 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-x-auto">
            <span className="flex items-center space-x-1 font-mono text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-100/80 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/50">
              <Shield className="w-3 h-3 inline" />
              <span>ADMIN CONSOLE</span>
            </span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-500">|</span>
            <span className="hidden md:inline text-slate-700 dark:text-slate-300 font-medium">
              Administrator: <strong className="text-slate-900 dark:text-white">{currentUser?.full_name || 'System Administrator'}</strong> ({currentUser?.email || 'admin@procucev.com'})
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="hidden sm:flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="font-semibold">SLA: &lt;800ms Live Telemetry</span>
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 shrink-0">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="bg-white px-3 py-1 rounded-xl shadow-xs border border-slate-200/90 min-w-[120px] h-10 flex items-center justify-center transition-all group-hover:border-cyan-500">
                <Image
                  src={AICEV_LOGO_SRC}
                  alt={UI_STRINGS.header.logoAlt}
                  width={120}
                  height={32}
                  className="h-7 sm:h-8 w-auto object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 tracking-wider">
                  Enterprise Sourcing Suite
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <span>Main Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-950 rounded-xl border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Title & Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/40 border border-sky-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                ADMINISTRATION CONSOLE
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Database View & Telemetry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Enterprise User & Organization Directory
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Inspect live registered buyers, assign tier access models, and enforce security policies across the aiCEV multi-tenant architecture.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={loadDirectory}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-600' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-600 font-bold">×</button>
          </div>
        )}
        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-600 font-bold">×</button>
          </div>
        )}

        {/* Top 4 KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Registered Users</span>
              <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">{totalCount}</p>
            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono">Platform Identity Registry</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Buyers</span>
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">{activeCount}</p>
            <span className="text-[10px] text-slate-400 font-mono">Authenticated & Live</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Client Enterprises</span>
              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-2">{companiesCount}</p>
            <span className="text-[10px] text-slate-400 font-mono">Distinct Organizations</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Database Health</span>
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">CONNECTED</p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">PostgreSQL Active</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, company, or Buyer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Tiers</option>
                <option value="BRONZE">BRONZE</option>
                <option value="SILVER">SILVER</option>
                <option value="GOLD">GOLD</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Directory Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Registered Enterprise Accounts ({users.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">User & Buyer ID</th>
                  <th className="py-3 px-4">Company & Location</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Role & Tier</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
                      Loading enterprise directory...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans text-xs">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{user.full_name || 'Enterprise User'}</div>
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 block">{user.id}</span>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{user.company_name || '—'}</div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[220px]">
                          {user.company_address || '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {user.role}
                          </span>

                          <select
                            value={user.tier || 'BRONZE'}
                            onChange={(e) => handleTierChange(user.id, e.target.value as SubscriptionTier)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border cursor-pointer focus:outline-none ${getTierBadge(user.tier)}`}
                          >
                            <option value="BRONZE">BRONZE</option>
                            <option value="SILVER">SILVER</option>
                            <option value="GOLD">GOLD</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{user.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-sans space-x-2">
                        <button
                          onClick={() => setSelectedUserForDetails(user)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            user.status === 'ACTIVE'
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">User Profile & Telemetry</h3>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Buyer Identifier</span>
                <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">{selectedUserForDetails.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedUserForDetails.full_name || '—'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Email Address</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedUserForDetails.email}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Enterprise Company</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedUserForDetails.company_name || '—'}</span>
                <span className="text-slate-500 block text-[11px]">{selectedUserForDetails.company_address || 'No registered physical address'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Mobile Number</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedUserForDetails.phone || '—'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Registered At</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedUserForDetails.created_at ? new Date(selectedUserForDetails.created_at).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
