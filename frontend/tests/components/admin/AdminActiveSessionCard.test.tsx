import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminActiveSessionCard from '../../../src/components/admin/AdminActiveSessionCard';
import { UI_STRINGS } from '../../../src/constants';

describe('AdminActiveSessionCard Component', () => {
  const mockUser = {
    id: 'usr-admin-001',
    name: 'System Administrator',
    email: 'admin@procucev.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    subscription_tier: 'GOLD'
  };

  it('renders active administrator information and action buttons', () => {
    render(
      <AdminActiveSessionCard
        user={mockUser}
        onSignOut={vi.fn()}
        onOpenDashboard={vi.fn()}
        onOpenCreateAdmin={vi.fn()}
      />
    );

    expect(screen.getByText('System Administrator')).toBeInTheDocument();
    expect(screen.getByText('admin@procucev.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: UI_STRINGS.admin.openDashboardButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.signOutButton })).toBeInTheDocument();
  });

  it('triggers onSignOut callback when sign out button is clicked', () => {
    const onSignOut = vi.fn();
    render(
      <AdminActiveSessionCard
        user={mockUser}
        onSignOut={onSignOut}
        onOpenDashboard={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.signOutButton }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenDashboard callback when open dashboard button is clicked', () => {
    const onOpenDashboard = vi.fn();
    render(
      <AdminActiveSessionCard
        user={mockUser}
        onSignOut={vi.fn()}
        onOpenDashboard={onOpenDashboard}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.openDashboardButton }));
    expect(onOpenDashboard).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenCreateAdmin when create admin action is clicked', () => {
    const onOpenCreateAdmin = vi.fn();
    render(
      <AdminActiveSessionCard
        user={mockUser}
        onSignOut={vi.fn()}
        onOpenDashboard={vi.fn()}
        onOpenCreateAdmin={onOpenCreateAdmin}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.createHeading }));
    expect(onOpenCreateAdmin).toHaveBeenCalledTimes(1);
  });

  it('renders fallback administrator name when user.name is empty and handles missing onOpenCreateAdmin', () => {
    const userWithoutName = {
      ...mockUser,
      name: ''
    };

    render(
      <AdminActiveSessionCard
        user={userWithoutName}
        onSignOut={vi.fn()}
        onOpenDashboard={vi.fn()}
      />
    );

    expect(screen.getByText('System Administrator')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: UI_STRINGS.admin.createHeading })).not.toBeInTheDocument();
  });
});

