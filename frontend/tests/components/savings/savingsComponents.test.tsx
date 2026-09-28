import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavingsWaterfallSection } from '../../../src/components/savings/SavingsWaterfallSection';
import { OverlapDeduplicationTable } from '../../../src/components/savings/OverlapDeduplicationTable';
import { ActionPlanTracker } from '../../../src/components/savings/ActionPlanTracker';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type {
  SavingsWaterfallMetrics,
  OpportunityOverlapGroup,
  SavingsOpportunityItem,
  ActionPlanItem
} from '../../../src/types/savings';

const mockWaterfall: SavingsWaterfallMetrics = {
  total_spend_inr_cr: 100.0,
  addressable_spend_inr_cr: 92.0,
  identified_opportunities_count: 18,
  gross_potential_savings_inr_cr: 18.5,
  deduplicated_overlap_inr_cr: 4.9,
  net_potential_savings_inr_cr: 13.6,
  validated_savings_inr_cr: 9.8,
  approved_savings_inr_cr: 6.5,
  realized_savings_inr_cr: 3.2
};

const mockOverlaps: OpportunityOverlapGroup[] = [
  {
    overlap_id: 'OVL-GRP-001',
    item: 'Bearing 6205 PCBI vs Vendor Consolidation vs E-Auction',
    vendor: 'SKF India Ltd',
    primary_opportunity_id: 'OPP-PCBI-001',
    primary_engine: 'PCBI_PRICE',
    primary_savings_inr: 10000000,
    total_gross_savings_inr: 22000000,
    total_deduplicated_inr: 12000000,
    total_net_savings_inr: 10000000,
    overlapping_opportunities: [
      {
        opportunity_id: 'OPP-PCBI-001',
        source_engine: 'PCBI_PRICE',
        gross_savings_inr: 10000000,
        deduplicated_amount_inr: 0,
        net_savings_inr: 10000000
      },
      {
        opportunity_id: 'OPP-EAUC-002',
        source_engine: 'E_AUCTION',
        gross_savings_inr: 7000000,
        deduplicated_amount_inr: 7000000,
        net_savings_inr: 0
      }
    ]
  }
];

const mockOpportunities: SavingsOpportunityItem[] = [
  {
    opportunity_id: 'OPP-PCBI-001',
    source_module: 'MODULE_3_PCBI',
    source_engine: 'PCBI_PRICE',
    category: 'Direct Materials',
    item: 'MAT-BRG-6205',
    vendor: 'SKF India Ltd',
    plant: 'Pune Plant',
    spend_inr: 100000000,
    spend_inr_cr: 10.0,
    potential_savings_inr: 10000000,
    potential_savings_inr_cr: 1.0,
    is_overlapping: true,
    net_savings_inr: 10000000,
    net_savings_inr_cr: 1.0,
    status: 'VALIDATED',
    owner: 'Procurement',
    timeline: '30 Days',
    created_at: '2026-09-20T00:00:00Z'
  }
];

const mockActionPlans: ActionPlanItem[] = [
  {
    id: 'ACT-001',
    opportunity_id: 'OPP-PCBI-001',
    action: 'Renegotiate Bearing 6205 index formula against steel price deflation',
    owner: 'Procurement',
    department: 'Direct Sourcing',
    target_date: '2026-10-15',
    priority: 'HIGH',
    expected_value_inr: 10000000,
    expected_value_inr_cr: 1.0,
    status: 'In Progress',
    comments: 'Supplier accepted initial benchmark data, contract addendum under review',
    created_at: '2026-09-20T00:00:00Z',
    updated_at: '2026-09-20T00:00:00Z'
  },
  {
    id: 'ACT-002',
    opportunity_id: 'OPP-VEND-002',
    action: 'Medium Priority Action',
    owner: 'SCM',
    department: 'Logistics',
    target_date: '2026-11-15',
    priority: 'MEDIUM',
    expected_value_inr: 5000000,
    expected_value_inr_cr: 0.5,
    status: 'Open',
    created_at: '2026-09-20T00:00:00Z',
    updated_at: '2026-09-20T00:00:00Z'
  },
  {
    id: 'ACT-003',
    opportunity_id: 'OPP-PO-003',
    action: 'Low Priority Action',
    owner: 'Plant',
    department: 'Operations',
    target_date: '2026-12-15',
    priority: 'LOW',
    expected_value_inr: 2000000,
    expected_value_inr_cr: undefined as unknown as number,
    status: 'Completed',
    created_at: '2026-09-20T00:00:00Z',
    updated_at: '2026-09-20T00:00:00Z'
  }
];

describe('Savings Components Suite', () => {
  describe('SavingsWaterfallSection', () => {
    it('renders all 7 savings waterfall stages with provided metrics', () => {
      render(<SavingsWaterfallSection waterfallMetrics={mockWaterfall} />);

      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.totalSpend)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.addressableSpend)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.identifiedOpportunities)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.potentialSavings)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.validatedSavings)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.approvedSavings)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.realizedSavings)).toBeInTheDocument();
      expect(screen.getByText('₹100.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹3.20 Cr')).toBeInTheDocument();
    });

    it('renders default metrics when waterfallMetrics prop is omitted', () => {
      render(<SavingsWaterfallSection waterfallMetrics={undefined as unknown as SavingsWaterfallMetrics} />);
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.steps.totalSpend)).toBeInTheDocument();
    });

    it('handles zero spend waterfall metrics gracefully', () => {
      render(
        <SavingsWaterfallSection
          waterfallMetrics={{
            total_spend_inr_cr: 0,
            addressable_spend_inr_cr: 0,
            identified_opportunities_count: 0,
            gross_potential_savings_inr_cr: 0,
            deduplicated_overlap_inr_cr: 0,
            net_potential_savings_inr_cr: 0,
            validated_savings_inr_cr: 0,
            approved_savings_inr_cr: 0,
            realized_savings_inr_cr: 0
          }}
        />
      );
      expect(screen.getByText(UI_STRINGS.module4.savingsWaterfall.title)).toBeInTheDocument();
    });
  });

  describe('OverlapDeduplicationTable', () => {
    it('renders overlap groups, badges, and triggers onUpdateStatus', () => {
      const handleUpdateStatus = vi.fn();
      render(
        <OverlapDeduplicationTable
          overlaps={mockOverlaps}
          opportunities={mockOpportunities}
          onUpdateStatus={handleUpdateStatus}
        />
      );

      expect(screen.getByText(UI_STRINGS.module4.overlapDeduplication.title)).toBeInTheDocument();
      expect(screen.getByText(/Bearing 6205 PCBI vs Vendor Consolidation vs E-Auction/)).toBeInTheDocument();
      expect(screen.getByText(/SKF India Ltd • OVL-GRP-001/)).toBeInTheDocument();

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
      fireEvent.change(selects[0], { target: { value: 'APPROVED' } });
      expect(handleUpdateStatus).toHaveBeenCalledWith('OPP-PCBI-001', 'APPROVED');
    });

    it('renders defaults when overlaps prop is omitted', () => {
      render(
        <OverlapDeduplicationTable
          overlaps={undefined as unknown as OpportunityOverlapGroup[]}
          opportunities={[]}
          onUpdateStatus={vi.fn()}
        />
      );
      expect(screen.getByText(UI_STRINGS.module4.overlapDeduplication.title)).toBeInTheDocument();
    });
  });

  describe('ActionPlanTracker', () => {
    it('renders action items, priority tags, and triggers onUpdateAction', () => {
      const handleUpdateAction = vi.fn();
      render(
        <ActionPlanTracker
          actionPlans={mockActionPlans}
          onUpdateAction={handleUpdateAction}
        />
      );

      expect(screen.getByText(UI_STRINGS.module4.actionPlan.title)).toBeInTheDocument();
      expect(screen.getByText('ACT-001')).toBeInTheDocument();
      expect(screen.getByText(/Renegotiate Bearing 6205/)).toBeInTheDocument();
      expect(screen.getByText('Direct Sourcing')).toBeInTheDocument();

      const selects = screen.getAllByRole('combobox');
      // Update owner (first combobox in row)
      const ownerSelect = selects[0];
      fireEvent.change(ownerSelect, { target: { value: 'Finance' } });
      expect(handleUpdateAction).toHaveBeenCalledWith('ACT-001', { owner: 'Finance' });

      // Update status (second combobox in row)
      const statusSelect = selects[1];
      fireEvent.change(statusSelect, { target: { value: 'Completed' } });
      expect(handleUpdateAction).toHaveBeenCalledWith('ACT-001', { status: 'Completed' });
    });

    it('renders defaults when actionPlans prop is omitted', () => {
      render(
        <ActionPlanTracker
          actionPlans={undefined as unknown as ActionPlanItem[]}
          onUpdateAction={vi.fn()}
        />
      );
      expect(screen.getByText(UI_STRINGS.module4.actionPlan.title)).toBeInTheDocument();
    });
  });
});
