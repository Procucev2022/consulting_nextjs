import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPCBIPage from '../../../../src/app/admin/pcbi/page';
import { apiClient } from '../../../../src/utils/api';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

describe('AdminPCBIPage Component (/admin/pcbi)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();

    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-admin-1',
      name: 'Admin Tester',
      email: 'admin@procucev.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD',
      company_name: 'Procucev Admin',
      created_at: new Date().toISOString()
    });

    vi.spyOn(apiClient, 'clearStoredSession').mockImplementation(() => {});
  });

  it('renders PCBI admin page with header and PCBIAdminMasterView', async () => {
    render(<AdminPCBIPage />);

    await waitFor(() => {
      expect(screen.getByText('aiCEV Enterprise')).toBeInTheDocument();
      expect(screen.getAllByText('PCBI Master').length).toBeGreaterThan(0);
      expect(screen.getByText('Admin Tester')).toBeInTheDocument();
    });
  });

  it('renders "Return to Buyer Portal \u2014 Module 3" link pointing to correct Borosil assessment URL', async () => {
    render(<AdminPCBIPage />);

    await waitFor(() => {
      const returnLink = screen.getByRole('link', {
        name: /Return to Buyer Portal/i
      });
      expect(returnLink).toBeInTheDocument();
      expect(returnLink).toHaveAttribute(
        'href',
        '/?tab=module3&assessmentId=AIC-2026-0002'
      );
    });
  });

  it('handles logout button click and navigates to admin login', async () => {
    render(<AdminPCBIPage />);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);

    expect(apiClient.clearStoredSession).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/admin/login');
  });
});
