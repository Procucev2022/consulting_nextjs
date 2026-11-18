import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminBuyerBlockedCard from '../../../src/components/admin/AdminBuyerBlockedCard';
import { UI_STRINGS } from '../../../src/constants';

describe('AdminBuyerBlockedCard Component', () => {
  it('renders descriptive access-restriction notice and workspace link for non-admin user', () => {
    render(
      <AdminBuyerBlockedCard
        blockedUser={{
          id: 'usr-buyer-1',
          name: 'Anurag Shaw',
          email: 'anurag@company.com',
          role: 'USER',
          status: 'ACTIVE',
          subscription_tier: 'BRONZE'
        }}
      />
    );

    expect(screen.getByTestId('admin-buyer-blocked-panel')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.buyerAccessBlockedTitle })).toBeInTheDocument();
    expect(
      screen.getByText(UI_STRINGS.admin.buyerAccessBlockedDescription('anurag@company.com', 'USER'))
    ).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.admin.buyerAccessBlockedActionGuidance)).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: UI_STRINGS.admin.returnToWorkspaceButton });
    expect(backLink).toHaveAttribute('href', '/');
  });
});
