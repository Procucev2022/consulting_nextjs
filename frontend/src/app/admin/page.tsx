'use client';

/**
 * Enterprise Admin Portal — User & Organization Directory
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UI_STRINGS, AICEV_LOGO_SRC } from '../../constants';
import { apiClient } from '../../utils/api';
import frontendLogger from '../../utils/logger';
import type { UserProfile, UserRole, UserStatus, SubscriptionTier } from '../../types';

export default function AdminPage(): React.ReactElement {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | SubscriptionTier>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);
    try {
      frontendLogger.info('Admin fetching users directory');
      const res = await apiClient.getAdminUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        tier: tierFilter
      });
      setUsers(res.users);
      setTotal(res.total);
      setActiveCount(res.activeCount);
      setSuspendedCount(res.suspendedCount);
      setCompaniesCount(res.companiesCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load user directory';
      frontendLogger.warn('Admin user fetch failed', { error: msg });
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, tierFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleStatusToggle = async (user: UserProfile): Promise<void> => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      frontendLogger.info('Admin toggling user status', { userId: user.id, newStatus });
      await apiClient.updateAdminUserStatus(user.id, newStatus);
      setActionSuccess(UI_STRINGS.admin.statusUpdateSuccess(user.name, newStatus));
      setTimeout(() => setActionSuccess(null), 3000);
      void loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setErrorMessage(msg);
    }
  };

  const handleTierChange = async (user: UserProfile, newTier: SubscriptionTier): Promise<void> => {
    try {
      frontendLogger.info('Admin updating user tier', { userId: user.id, newTier });
      await apiClient.updateAdminUserTier(user.id, newTier);
      setActionSuccess(UI_STRINGS.admin.tierUpdateSuccess(user.name, newTier));
      setTimeout(() => setActionSuccess(null), 3000);
      void loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update subscription tier';
      setErrorMessage(msg);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070b14',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Admin Top Navigation */}
      <header style={{
        backgroundColor: '#0b1120',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '4px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <Image
                src={AICEV_LOGO_SRC}
                alt={UI_STRINGS.header.logoAlt}
                width={140}
                height={38}
                priority
                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
          </Link>
          <span style={{
            fontSize: '12px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}>
            {UI_STRINGS.auth.quickAdmin}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/"
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}
          >
            ← {UI_STRINGS.admin.backToDashboard}
          </Link>
          <button
            type="button"
            onClick={() => { apiClient.clearStoredSession(); router.push('/login'); }}
            style={{
              fontSize: '13px',
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {UI_STRINGS.auth.logout}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
            {UI_STRINGS.admin.pageTitle}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            {UI_STRINGS.admin.pageSubtitle}
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div style={metricCardStyle('#38bdf8')}>
            <span style={metricLabelStyle}>{UI_STRINGS.admin.totalUsers}</span>
            <span style={metricValueStyle('#38bdf8')}>{total}</span>
          </div>
          <div style={metricCardStyle('#22c55e')}>
            <span style={metricLabelStyle}>{UI_STRINGS.admin.activeUsers}</span>
            <span style={metricValueStyle('#22c55e')}>{activeCount}</span>
          </div>
          <div style={metricCardStyle('#ef4444')}>
            <span style={metricLabelStyle}>{UI_STRINGS.admin.suspendedUsers}</span>
            <span style={metricValueStyle('#ef4444')}>{suspendedCount}</span>
          </div>
          <div style={metricCardStyle('#a855f7')}>
            <span style={metricLabelStyle}>{UI_STRINGS.admin.uniqueCompanies}</span>
            <span style={metricValueStyle('#a855f7')}>{companiesCount}</span>
          </div>
        </div>

        {/* Action / Error Banners */}
        {actionSuccess && (
          <div role="status" style={bannerStyle('rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.4)', '#86efac')}>
            <span>✓</span>
            <span>{actionSuccess}</span>
          </div>
        )}
        {errorMessage && (
          <div role="alert" style={bannerStyle('rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.4)', '#fca5a5')}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Search & Filters Toolbar */}
        <div style={{
          backgroundColor: '#0b1322',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <input
            id="admin-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={UI_STRINGS.admin.searchPlaceholder}
            style={{
              flex: '1 1 320px',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              id="filter-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
              style={selectStyle}
            >
              <option value="ALL">{UI_STRINGS.admin.allRoles}</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | UserStatus)}
              style={selectStyle}
            >
              <option value="ALL">{UI_STRINGS.admin.allStatuses}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>

            <select
              id="filter-tier"
              data-testid="filter-tier"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as 'ALL' | SubscriptionTier)}
              style={selectStyle}
            >
              <option value="ALL">{UI_STRINGS.admin.allTiers}</option>
              <option value="BRONZE">{UI_STRINGS.subscription.tierBronze}</option>
              <option value="SILVER">{UI_STRINGS.subscription.tierSilver}</option>
              <option value="GOLD">{UI_STRINGS.subscription.tierGold}</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: '#0b1322',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
              {UI_STRINGS.admin.userTableTitle}
            </h2>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              {UI_STRINGS.admin.userCountLabel(users.length)}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  <th style={thStyle}>{UI_STRINGS.admin.colName}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colMobile}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colEmail}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colCompany}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colAddress}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colRole}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colTier}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colStatus}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colJoined}</th>
                  <th style={thStyle}>{UI_STRINGS.admin.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      {UI_STRINGS.common.loading}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      {UI_STRINGS.admin.noUsersFound}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{u.id}</div>
                      </td>
                      <td style={tdStyle}>{u.mobile_number}</td>
                      <td style={tdStyle}>
                        <a href={`mailto:${u.email}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                          {u.email}
                        </a>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{u.company_name}</span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '240px', whiteSpace: 'normal', lineHeight: 1.4 }}>
                        {u.company_address}
                      </td>
                      <td style={tdStyle}>
                        <span style={roleBadgeStyle(u.role)}>{u.role}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={tierBadgeStyle(u.subscription_tier || 'BRONZE')}>
                            {u.subscription_tier || 'BRONZE'}
                          </span>
                          {u.role !== 'ADMIN' && (
                            <select
                              value={u.subscription_tier || 'BRONZE'}
                              aria-label={UI_STRINGS.admin.changeTier}
                              onChange={(e) => void handleTierChange(u, e.target.value as SubscriptionTier)}
                              style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(148, 163, 184, 0.25)',
                                borderRadius: '6px',
                                color: '#f8fafc',
                                fontSize: '11px',
                                padding: '2px 4px',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="BRONZE">{UI_STRINGS.subscription.bronzeBadgeText}</option>
                              <option value="SILVER">{UI_STRINGS.subscription.silverBadgeText}</option>
                              <option value="GOLD">{UI_STRINGS.subscription.goldBadgeText}</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={statusBadgeStyle(u.status)}>{u.status}</span>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#94a3b8' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            style={actionBtnStyle('rgba(56, 189, 248, 0.1)', 'rgba(56, 189, 248, 0.3)', '#38bdf8')}
                          >
                            {UI_STRINGS.admin.viewDetails}
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => void handleStatusToggle(u)}
                              style={actionBtnStyle(
                                u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
                                u.status === 'ACTIVE' ? '#ef4444' : '#22c55e'
                              )}
                            >
                              {u.status === 'ACTIVE' ? UI_STRINGS.admin.suspendButton : UI_STRINGS.admin.activateButton}
                            </button>
                          )}
                        </div>
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
      {selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                {UI_STRINGS.admin.userModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.auth.nameLabel}:</span>
                <span style={detailValueStyle}>{selectedUser.name}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.auth.mobileLabel}:</span>
                <span style={detailValueStyle}>{selectedUser.mobile_number}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.auth.emailLabel}:</span>
                <span style={detailValueStyle}>{selectedUser.email}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.auth.companyNameLabel}:</span>
                <span style={detailValueStyle}>{selectedUser.company_name}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.auth.companyAddressLabel}:</span>
                <span style={detailValueStyle}>{selectedUser.company_address}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.admin.colRole}:</span>
                <span style={roleBadgeStyle(selectedUser.role)}>{selectedUser.role}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.admin.colTier}:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={tierBadgeStyle(selectedUser.subscription_tier || 'BRONZE')}>
                    {selectedUser.subscription_tier || 'BRONZE'}
                  </span>
                  {selectedUser.role !== 'ADMIN' && (
                    <select
                      value={selectedUser.subscription_tier || 'BRONZE'}
                      aria-label={UI_STRINGS.admin.changeTier}
                      onChange={(e) => {
                        const newTier = e.target.value as SubscriptionTier;
                        setSelectedUser({ ...selectedUser, subscription_tier: newTier });
                        void handleTierChange(selectedUser, newTier);
                      }}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        padding: '2px 6px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="BRONZE">{UI_STRINGS.subscription.tierBronze}</option>
                      <option value="SILVER">{UI_STRINGS.subscription.tierSilver}</option>
                      <option value="GOLD">{UI_STRINGS.subscription.tierGold}</option>
                    </select>
                  )}
                </span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.admin.colStatus}:</span>
                <span style={statusBadgeStyle(selectedUser.status)}>{selectedUser.status}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>{UI_STRINGS.admin.colJoined}:</span>
                <span style={detailValueStyle}>{new Date(selectedUser.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {UI_STRINGS.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Helpers
const metricCardStyle = (accentColor: string): React.CSSProperties => ({
  backgroundColor: '#0b1322',
  border: `1px solid ${accentColor}33`,
  borderRadius: '12px',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
});

const metricLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const metricValueStyle = (color: string): React.CSSProperties => ({
  fontSize: '26px',
  fontWeight: 700,
  color
});

const bannerStyle = (bg: string, border: string, color: string): React.CSSProperties => ({
  padding: '12px 16px',
  backgroundColor: bg,
  border: `1px solid ${border}`,
  borderRadius: '8px',
  color,
  fontSize: '13px',
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
});

const selectStyle: React.CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.7)',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#f8fafc',
  fontSize: '13px',
  outline: 'none'
};

const thStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontWeight: 600,
  color: '#94a3b8',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle: React.CSSProperties = {
  padding: '14px',
  verticalAlign: 'middle'
};

const roleBadgeStyle = (role: UserRole): React.CSSProperties => ({
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: '9999px',
  fontSize: '11px',
  fontWeight: 700,
  backgroundColor: role === 'ADMIN' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)',
  color: role === 'ADMIN' ? '#38bdf8' : '#94a3b8',
  border: `1px solid ${role === 'ADMIN' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.3)'}`
});

const statusBadgeStyle = (status: UserStatus): React.CSSProperties => ({
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: '9999px',
  fontSize: '11px',
  fontWeight: 700,
  backgroundColor: status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
  color: status === 'ACTIVE' ? '#86efac' : '#fca5a5',
  border: `1px solid ${status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
});

const actionBtnStyle = (bg: string, border: string, color: string): React.CSSProperties => ({
  padding: '5px 10px',
  backgroundColor: bg,
  border: `1px solid ${border}`,
  borderRadius: '6px',
  color,
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer'
});

const detailRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  gap: '12px',
  padding: '6px 0',
  borderBottom: '1px solid rgba(148, 163, 184, 0.08)'
};

const detailLabelStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontWeight: 600
};

const detailValueStyle: React.CSSProperties = {
  color: '#f8fafc',
  wordBreak: 'break-word'
};

const tierBadgeStyle = (tier: SubscriptionTier | string): React.CSSProperties => {
  if (tier === 'GOLD') {
    return {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      color: '#fbbf24',
      border: '1px solid rgba(245, 158, 11, 0.5)'
    };
  }
  if (tier === 'SILVER') {
    return {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: 'rgba(203, 213, 225, 0.2)',
      color: '#e2e8f0',
      border: '1px solid rgba(203, 213, 225, 0.4)'
    };
  }
  return {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: 'rgba(180, 83, 9, 0.2)',
    color: '#d97706',
    border: '1px solid rgba(180, 83, 9, 0.4)'
  };
};

