'use client';

/**
 * Admin Subscription Management Dashboard (Prompt 288 §14 & §35)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Plus,
  ArrowLeft,
  RefreshCw,
  Crown,
  Sparkles,
  Shield,
  History,
  X
} from 'lucide-react';
import type { SubscriptionRecord, SubscriptionAuditEvent } from '../../../types';
import { ProvisionSubscriptionModal } from '../../../components/admin/ProvisionSubscriptionModal';

const BADGE_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
  PENDING_ACTIVATION: 'bg-amber-950 text-amber-400 border border-amber-800',
  SUSPENDED: 'bg-red-950 text-red-400 border border-red-800'
};

function getStatusBadgeClass(status: string): string {
  return BADGE_CLASSES[status] || 'bg-slate-800 text-slate-400 border border-slate-700';
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [auditEvents, setAuditEvents] = useState<SubscriptionAuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [selectedAuditSubId, setSelectedAuditSubId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/subscription/admin/list');
      const data = await res.json();
      if (data.success) setSubscriptions(data.subscriptions || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAuditEvents = useCallback(async (subId?: string) => {
    try {
      const url = subId
        ? `/api/subscription/admin/audit-trail?subscription_id=${subId}`
        : '/api/subscription/admin/audit-trail';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setAuditEvents(data.audit_events || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchAuditEvents();
  }, [fetchSubscriptions, fetchAuditEvents]);

  const handleStatusChange = async (id: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') => {
    try {
      const res = await fetch(`/api/subscription/admin/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchSubscriptions();
        await fetchAuditEvents();
      }
    } catch {
      // silent
    }
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        sub.customer_name.toLowerCase().includes(q) ||
        sub.customer_email.toLowerCase().includes(q) ||
        sub.company_name.toLowerCase().includes(q) ||
        sub.tenant_id.toLowerCase().includes(q);
      const matchesTier = tierFilter === 'ALL' || sub.tier === tierFilter;
      const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [subscriptions, searchQuery, tierFilter, statusFilter]);

  return (
    <div data-testid="admin-subscriptions-page" className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link href="/admin" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin User Directory</span>
              </Link>
              <span>/</span>
              <span className="text-cyan-400 font-bold">Subscription Management</span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
              <span>Subscription & Entitlement Administration</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Offline commercial provisioning, OTP validation and customer activation lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSubscriptions}
              data-testid="refresh-subscriptions-btn"
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsProvisionOpen(true)}
              data-testid="open-provision-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Subscription</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search customer, email, company, or tenant ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="ALL">All Tiers</option>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="ALL">All States</option>
            <option value="FREE">Free</option>
            <option value="PENDING_ACTIVATION">Pending Activation</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Company / Customer</th>
                  <th className="py-3.5 px-4 font-bold">Tenant ID</th>
                  <th className="py-3.5 px-4 font-bold">Tier</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Payment Ref</th>
                  <th className="py-3.5 px-4 font-bold">Expiry Date</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-500">Loading subscriptions...</td></tr>
                ) : filteredSubscriptions.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-500">No subscription records found.</td></tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{sub.company_name}</div>
                        <div className="text-[11px] text-slate-400">{sub.customer_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400">{sub.tenant_id}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold">
                          {sub.tier === 'GOLD' ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : sub.tier === 'SILVER' ? <Sparkles className="w-3.5 h-3.5 text-sky-400" /> : <Shield className="w-3.5 h-3.5 text-amber-700" />}
                          <span>{sub.tier}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">{sub.payment_reference || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">{new Date(sub.end_date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedAuditSubId(sub.id); fetchAuditEvents(sub.id); }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300"
                        >
                          Audit
                        </button>
                        {sub.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sub.id, 'SUSPENDED')}
                            className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800 rounded text-[11px] text-red-300"
                          >
                            Suspend
                          </button>
                        )}
                        {sub.status === 'SUSPENDED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sub.id, 'ACTIVE')}
                            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 rounded text-[11px] text-emerald-300"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedAuditSubId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
              <button
                type="button"
                onClick={() => setSelectedAuditSubId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Immutable Subscription Audit Trail</h3>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-800 text-xs">
                {auditEvents.map((evt) => (
                  <div key={evt.id} className="py-2.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{new Date(evt.timestamp).toLocaleString()}</span>
                      <span className="font-bold text-cyan-400">{evt.actor} ({evt.actor_role})</span>
                    </div>
                    <div className="font-bold text-white mt-0.5">{evt.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ProvisionSubscriptionModal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        onProvisionSuccess={() => { fetchSubscriptions(); fetchAuditEvents(); }}
      />
    </div>
  );
}
