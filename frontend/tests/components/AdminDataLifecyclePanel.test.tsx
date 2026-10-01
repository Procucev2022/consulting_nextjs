import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDataLifecyclePanel } from '../../src/components/admin/AdminDataLifecyclePanel';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('AdminDataLifecyclePanel Component (Prompt 254)', () => {
  it('renders with default records and policy notice', () => {
    render(<AdminDataLifecyclePanel />);

    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.adminLifecycleTitle)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.enterprisePrivacy.adminLifecyclePolicy).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('DS-2024-CUST-8902')).toBeInTheDocument();
    expect(screen.getByText('Customer_Purchase_History_FY22_24.xlsx')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('LOCKED_ACTIVE_CONTRACT')).toBeInTheDocument();
  });

  it('renders custom lifecycle records and applies className', () => {
    const customRecords = [
      {
        datasetId: 'DS-CUSTOM-001',
        tenantId: 'TNT-CUSTOM-001',
        datasetName: 'Custom_Spend_Data.csv',
        datasetCreated: '2025-01-15T10:00:00.000Z',
        datasetStatus: 'PENDING_VALIDATION' as const,
        lastProcessed: '2025-01-16T12:00:00.000Z',
        retentionStatus: 'Retention active under 3-year contract',
        deletionEligibility: 'ELIGIBLE_UPON_CONTRACT_EXPIRY'
      }
    ];

    const { container } = render(
      <AdminDataLifecyclePanel records={customRecords} className="custom-panel-class" />
    );

    expect(container.firstChild).toHaveClass('custom-panel-class');
    expect(screen.getByText('DS-CUSTOM-001')).toBeInTheDocument();
    expect(screen.getByText('Custom_Spend_Data.csv')).toBeInTheDocument();
    expect(screen.getByText('PENDING_VALIDATION')).toBeInTheDocument();
    expect(screen.getByText('ELIGIBLE_UPON_CONTRACT_EXPIRY')).toBeInTheDocument();
  });
});
