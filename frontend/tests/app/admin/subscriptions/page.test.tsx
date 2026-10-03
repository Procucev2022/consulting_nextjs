import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminSubscriptionsPage from '@/app/admin/subscriptions/page';
import type { SubscriptionRecord, SubscriptionAuditEvent } from '@/types';

describe('AdminSubscriptionsPage Dashboard', () => {
  const mockSubscriptions: SubscriptionRecord[] = [
    {
      id: 'sub-1',
      customer_id: 'usr-1',
      tenant_id: 'TNT-CORP-1',
      customer_email: 'ceo@corp1.com',
      customer_name: 'Corp One CEO',
      company_name: 'Corp One',
      tier: 'GOLD',
      status: 'ACTIVE',
      commercial_status: 'PAYMENT_RECEIVED',
      payment_reference: 'INV-001',
      payment_confirmed: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sub-2',
      customer_id: 'usr-2',
      tenant_id: 'TNT-CORP-2',
      customer_email: 'finance@corp2.com',
      customer_name: 'Corp Two CFO',
      company_name: 'Corp Two',
      tier: 'SILVER',
      status: 'SUSPENDED',
      commercial_status: 'PAYMENT_RECEIVED',
      payment_reference: 'INV-002',
      payment_confirmed: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sub-3',
      customer_id: 'usr-3',
      tenant_id: 'TNT-CORP-3',
      customer_email: 'buyer@corp3.com',
      customer_name: 'Corp Three Buyer',
      company_name: 'Corp Three',
      tier: 'BRONZE',
      status: 'EXPIRED',
      commercial_status: 'QUOTED',
      payment_reference: '',
      payment_confirmed: false,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sub-4',
      customer_id: 'usr-4',
      tenant_id: 'TNT-CORP-4',
      customer_email: 'pending@corp4.com',
      customer_name: 'Corp Four User',
      company_name: 'Corp Four',
      tier: 'SILVER',
      status: 'PENDING_ACTIVATION',
      commercial_status: 'PAYMENT_RECEIVED',
      payment_reference: 'INV-004',
      payment_confirmed: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockAuditEvents: SubscriptionAuditEvent[] = [
    {
      id: 'evt-1',
      subscription_id: 'sub-1',
      tenant_id: 'TNT-CORP-1',
      action: 'SUBSCRIPTION_PROVISIONED',
      actor: 'admin@procucev.com',
      actor_role: 'ADMIN',
      timestamp: new Date().toISOString(),
      result: 'SUCCESS'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/subscription/admin/list')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, subscriptions: mockSubscriptions })
        } as Response);
      }
      if (url.includes('/api/subscription/admin/audit-trail')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, audit_events: mockAuditEvents })
        } as Response);
      }
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
    });
  });

  it('renders dashboard with title, filters, and subscription records', async () => {
    render(<AdminSubscriptionsPage />);

    expect(screen.getByTestId('admin-subscriptions-page')).toBeInTheDocument();
    expect(screen.getByText('Subscription & Entitlement Administration')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Corp One')).toBeInTheDocument();
      expect(screen.getByText('Corp Two')).toBeInTheDocument();
      expect(screen.getByText('Corp Three')).toBeInTheDocument();
      expect(screen.getByText('Corp Four')).toBeInTheDocument();
    });

    expect(screen.getByText('TNT-CORP-1')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
  });

  it('filters subscriptions by search query, tier, and status', async () => {
    render(<AdminSubscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Corp One')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search customer, email, company/i);
    fireEvent.change(searchInput, { target: { value: 'Corp Two' } });

    expect(screen.queryByText('Corp One')).not.toBeInTheDocument();
    expect(screen.getByText('Corp Two')).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Filter by tier
    const tierSelect = screen.getByDisplayValue('All Tiers');
    fireEvent.change(tierSelect, { target: { value: 'GOLD' } });
    expect(screen.getByText('Corp One')).toBeInTheDocument();
    expect(screen.queryByText('Corp Two')).not.toBeInTheDocument();

    // Filter by status
    fireEvent.change(tierSelect, { target: { value: 'ALL' } });
    const statusSelect = screen.getByDisplayValue('All States');
    fireEvent.change(statusSelect, { target: { value: 'SUSPENDED' } });
    expect(screen.getByText('Corp Two')).toBeInTheDocument();
    expect(screen.queryByText('Corp One')).not.toBeInTheDocument();
  });

  it('handles suspend and reactivate status changes', async () => {
    render(<AdminSubscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Corp One')).toBeInTheDocument();
    });

    const suspendBtn = screen.getByRole('button', { name: 'Suspend' });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/subscription/admin/sub-1/status',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    const reactivateBtn = screen.getByRole('button', { name: 'Reactivate' });
    fireEvent.click(reactivateBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/subscription/admin/sub-2/status',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  it('opens and closes the immutable audit trail modal', async () => {
    render(<AdminSubscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Corp One')).toBeInTheDocument();
    });

    const auditButtons = screen.getAllByRole('button', { name: 'Audit' });
    fireEvent.click(auditButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Immutable Subscription Audit Trail')).toBeInTheDocument();
      expect(screen.getByText('SUBSCRIPTION_PROVISIONED')).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find((btn) => btn.querySelector('svg.lucide-x'));
    if (closeBtn) fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Immutable Subscription Audit Trail')).not.toBeInTheDocument();
    });
  });

  it('opens provision modal and triggers onClose and onProvisionSuccess callbacks', async () => {
    render(<AdminSubscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Corp One')).toBeInTheDocument();
    });

    const openProvisionBtn = screen.getByTestId('open-provision-btn');
    fireEvent.click(openProvisionBtn);

    expect(screen.getByText('Provision Customer Subscription')).toBeInTheDocument();

    // Trigger close
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Provision Customer Subscription')).not.toBeInTheDocument();
    });
  });

  it('handles network failure during initial fetch gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    render(<AdminSubscriptionsPage />);

    await waitFor(() => {
      expect(screen.getByText('No subscription records found.')).toBeInTheDocument();
    });
  });
});
