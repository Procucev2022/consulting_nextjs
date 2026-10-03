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
    <div data-testid="admin-subscriptions-page" className="min-h-screen bg-[#EEF7FF] text-[#0B1B33] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCE7F5] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
              <Link href="/admin" className="flex items-center gap-1 hover:text-[#0284C7] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin User Directory</span>
              </Link>
              <span>/</span>
              <span className="text-[#0284C7] font-bold">Subscription Management</span>
            </div>
            <h1 className="text-2xl font-black text-[#0B1B33] flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-[#0284C7]" />
              <span>Subscription & Entitlement Administration</span>
            </h1>
            <p className="text-xs text-[#475569] mt-1">
              Offline commercial provisioning, OTP validation and customer activation lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSubscriptions}
              data-testid="refresh-subscriptions-btn"
              className="p-2.5 bg-white border border-[#DCE7F5] hover:bg-[#F8FBFE] rounded-xl text-[#64748B] hover:text-[#0B1B33] shadow-xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsProvisionOpen(true)}
              data-testid="open-provision-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Subscription</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search customer, email, company, or tenant ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE7F5] rounded-xl text-xs text-[#0B1B33] placeholder-[#64748B] focus:outline-none focus:border-[#0284C7]"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#DCE7F5] rounded-xl text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7] cursor-pointer"
          >
            <option value="ALL">All Tiers</option>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#DCE7F5] rounded-xl text-xs text-[#0B1B33] focus:outline-none focus:border-[#0284C7] cursor-pointer"
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

        <div className="bg-white border border-[#DCE7F5] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FBFE] text-[#0B1B33] uppercase tracking-wider text-[10px] border-b border-[#DCE7F5]">
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
              <tbody className="divide-y divide-[#DCE7F5]">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-[#64748B]">Loading subscriptions...</td></tr>
                ) : filteredSubscriptions.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-[#64748B]">No subscription records found.</td></tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#EEF7FF] transition-colors bg-white">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0B1B33]">{sub.company_name}</div>
                        <div className="text-[11px] text-[#64748B]">{sub.customer_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#0284C7]">{sub.tenant_id}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold">
                          {sub.tier === 'GOLD' ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : sub.tier === 'SILVER' ? <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" /> : <Shield className="w-3.5 h-3.5 text-amber-700" />}
                          <span>{sub.tier}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#475569]">{sub.payment_reference || '—'}</td>
                      <td className="py-3.5 px-4 text-[#64748B] text-[11px]">{new Date(sub.end_date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedAuditSubId(sub.id); fetchAuditEvents(sub.id); }}
                          className="px-2 py-1 bg-[#F8FBFE] hover:bg-[#EEF7FF] border border-[#DCE7F5] rounded text-[11px] text-[#0B1B33] cursor-pointer"
                        >
                          Audit
                        </button>
                        {sub.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sub.id, 'SUSPENDED')}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-[11px] text-red-700 cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                        {sub.status === 'SUSPENDED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sub.id, 'ACTIVE')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] text-emerald-700 cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-white border border-[#DCE7F5] rounded-2xl shadow-2xl p-6 text-[#0B1B33]">
              <button
                type="button"
                onClick={() => setSelectedAuditSubId(null)}
                className="absolute top-4 right-4 text-[#64748B] hover:text-[#0B1B33] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-[#0284C7]" />
                <h3 className="text-base font-bold text-[#0B1B33]">Immutable Subscription Audit Trail</h3>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-[#DCE7F5] text-xs">
                {auditEvents.map((evt) => (
                  <div key={evt.id} className="py-2.5">
                    <div className="flex items-center justify-between text-[#64748B] text-[10px]">
                      <span>{new Date(evt.timestamp).toLocaleString()}</span>
                      <span className="font-bold text-[#0284C7]">{evt.actor} ({evt.actor_role})</span>
                    </div>
                    <div className="font-bold text-[#0B1B33] mt-0.5">{evt.action}</div>
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
