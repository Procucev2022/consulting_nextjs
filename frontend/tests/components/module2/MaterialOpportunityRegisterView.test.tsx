import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MaterialOpportunityRegisterView } from '../../../src/components/module2/MaterialOpportunityRegisterView';
import { Module2OpportunityRegisterApi } from '../../../src/utils/module2OpportunityRegisterApi';
import type { MaterialOpportunityItem } from '../../../src/types/module2OpportunityRegister';

const mockOpportunities: MaterialOpportunityItem[] = [
  {
    opportunityId: 'OPP-AIC-2026-0002-DPI-0001',
    opportunityType: 'DIRECT_PRICE_IMPROVEMENT',
    category: 'Raw Materials',
    materialCode: '100DP001IM',
    materialDescription: 'DOLOMITE POWDER (IMPORTED)',
    uom: 'MT',
    supportingTransactionCount: 25,
    supportingTransactionIds: ['TX-1'],
    historicalSpendInr: 293321980,
    historicalSpendCr: 29.3322,
    suppliersInvolved: ['COMEFAR ASIA'],
    plantsInvolved: ['1120'],
    rationale: 'Direct price dispersion against lowest unit price',
    calculationMethodology: 'Weighted average price delta against lowest transaction rate',
    sourceFields: ['Material Code', 'Unit Price', 'PO Number'],
    dataQualityChecks: ['Normalized to INR'],
    comparabilityChecks: ['SAME_MATERIAL_CODE'],
    confidenceLevel: 'HIGH',
    reviewFlags: ['DISPERSION_VERIFIED'],
    requiredProcurementAction: 'Negotiate price alignment',
    responsibleValidationTeam: 'Category Management',
    status: 'IDENTIFIED',
    defensibleOpportunityValueInr: 177647260,
    defensibleOpportunityValueCr: 17.7647
  },
  {
    opportunityId: 'OPP-AIC-2026-0002-SC-0001',
    opportunityType: 'SUPPLIER_CONSOLIDATION',
    category: 'Chemicals',
    materialCode: '100SUA01I',
    materialDescription: 'SODIUM ANTIMONATE',
    uom: 'KG',
    supportingTransactionCount: 22,
    supportingTransactionIds: ['TX-2'],
    historicalSpendInr: 418000000,
    historicalSpendCr: 41.8,
    suppliersInvolved: ['Supplier Alpha', 'Supplier Beta'],
    plantsInvolved: ['1120', '1130'],
    rationale: 'Multiple suppliers supplying identical material code',
    calculationMethodology: 'Multi-vendor supply analysis',
    sourceFields: ['Material Code', 'Supplier'],
    dataQualityChecks: ['Unit consistency verified'],
    comparabilityChecks: ['IDENTICAL_MATERIAL_CODE'],
    confidenceLevel: 'HIGH',
    reviewFlags: [],
    requiredProcurementAction: 'Vendor base consolidation via e-Auction',
    responsibleValidationTeam: 'Strategic Sourcing',
    status: 'IDENTIFIED',
    defensibleOpportunityValueInr: null,
    defensibleOpportunityValueCr: null
  },
  {
    opportunityId: 'OPP-AIC-2026-0002-VDC-0001',
    opportunityType: 'VOLUME_DEMAND_CONSOLIDATION',
    category: 'Chemicals',
    materialCode: '100SA02G',
    materialDescription: 'SODA ASH DENSE GHCL',
    uom: 'MT',
    supportingTransactionCount: 45,
    supportingTransactionIds: ['TX-3'],
    historicalSpendInr: 581170000,
    historicalSpendCr: 58.117,
    suppliersInvolved: ['GHCL LTD'],
    plantsInvolved: ['1120', '1130'],
    rationale: 'High volume recurring demand across multiple plants',
    calculationMethodology: 'Temporal and lot size aggregation',
    sourceFields: ['Material Code', 'Plant', 'PO Date'],
    dataQualityChecks: ['Recurring predictable'],
    comparabilityChecks: ['MULTI_PLANT_PO_AGGREGATION'],
    confidenceLevel: 'HIGH',
    reviewFlags: [],
    requiredProcurementAction: 'Consolidate annual volume under single rate contract',
    responsibleValidationTeam: 'Central Procurement',
    status: 'IDENTIFIED',
    defensibleOpportunityValueInr: null,
    defensibleOpportunityValueCr: null
  },
  {
    opportunityId: 'OPP-AIC-2026-0002-SPR-0001',
    opportunityType: 'SPECIFICATION_PROCESS_REVIEW',
    category: 'Packaging',
    materialCode: 'BOX-A / BOX-B',
    materialDescription: 'CORRUGATED BOX',
    uom: 'NOS',
    supportingTransactionCount: 11,
    supportingTransactionIds: ['TX-4'],
    historicalSpendInr: 2200000,
    historicalSpendCr: 0.22,
    suppliersInvolved: ['Vendor 1'],
    plantsInvolved: ['1120', '1130'],
    rationale: 'Potential dimensional rationalisation',
    calculationMethodology: 'Text similarity comparison',
    sourceFields: ['Material Description'],
    dataQualityChecks: ['Missing technical specification data'],
    comparabilityChecks: ['TEXT_SIMILARITY_MATCH'],
    confidenceLevel: 'LOW',
    reviewFlags: ['TECHNICAL_REVIEW_REQUIRED'],
    requiredProcurementAction: 'Engineering qualification of standard box dimension',
    responsibleValidationTeam: 'Technical Review Committee',
    status: 'UNDER_REVIEW',
    defensibleOpportunityValueInr: null,
    defensibleOpportunityValueCr: null
  }
];

describe('MaterialOpportunityRegisterView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders table rows for all opportunity types', async () => {
    vi.spyOn(Module2OpportunityRegisterApi, 'getOpportunityRegister').mockResolvedValue({
      assessmentId: 'AIC-2026-0002',
      customerName: 'Borosil Ltd',
      generatedAt: '2026-10-26T00:00:00.000Z',
      summary: {} as any,
      opportunities: mockOpportunities,
      exclusionsSummary: {}
    });

    render(<MaterialOpportunityRegisterView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('DOLOMITE POWDER (IMPORTED)')).toBeInTheDocument();
    });

    expect(screen.getByText('100DP001IM')).toBeInTheDocument();
    expect(screen.getByText('100SUA01I')).toBeInTheDocument();
    expect(screen.getByText('100SA02G')).toBeInTheDocument();
    expect(screen.getByText('BOX-A / BOX-B')).toBeInTheDocument();
    expect(screen.getByText('₹17.76')).toBeInTheDocument();
  });

  it('opens and closes evidence drawer when row is clicked', async () => {
    vi.spyOn(Module2OpportunityRegisterApi, 'getOpportunityRegister').mockResolvedValue({
      assessmentId: 'AIC-2026-0002',
      customerName: 'Borosil Ltd',
      generatedAt: '2026-10-26T00:00:00.000Z',
      summary: {} as any,
      opportunities: mockOpportunities,
      exclusionsSummary: {}
    });

    render(<MaterialOpportunityRegisterView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('100DP001IM')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('100DP001IM'));

    await waitFor(() => {
      expect(screen.getByText('100DP001IM — DOLOMITE POWDER (IMPORTED)')).toBeInTheDocument();
    });

    expect(screen.getByText(/Weighted average price delta against lowest transaction rate/)).toBeInTheDocument();

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('100DP001IM — DOLOMITE POWDER (IMPORTED)')).not.toBeInTheDocument();
    });

    // Also open modal for item with null defensible value (e.g. 100SUA01I) to exercise Pending Commercial Agreement branch
    fireEvent.click(screen.getByText('100SUA01I'));
    await waitFor(() => {
      expect(screen.getByText('Pending Commercial Agreement')).toBeInTheDocument();
    });

    // Close using X button
    const xCloseBtn = screen.getByText('×');
    fireEvent.click(xCloseBtn);
    await waitFor(() => {
      expect(screen.queryByText('Pending Commercial Agreement')).not.toBeInTheDocument();
    });
  });

  it('handles type filter, status filter, and search input', async () => {
    const apiSpy = vi.spyOn(Module2OpportunityRegisterApi, 'getOpportunityRegister').mockResolvedValue({
      assessmentId: 'AIC-2026-0002',
      customerName: 'Borosil Ltd',
      generatedAt: '2026-10-26T00:00:00.000Z',
      summary: {} as any,
      opportunities: mockOpportunities,
      exclusionsSummary: {}
    });

    render(<MaterialOpportunityRegisterView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search code, description, supplier...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search code, description, supplier...');
    fireEvent.change(searchInput, { target: { value: 'Dolomite' } });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'DIRECT_PRICE_IMPROVEMENT' } });
    fireEvent.change(selects[1], { target: { value: 'IDENTIFIED' } });

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DIRECT_PRICE_IMPROVEMENT',
          status: 'IDENTIFIED',
          search: 'Dolomite'
        })
      );
    });
  });

  it('triggers CSV export when Export Traceable CSV is clicked', async () => {
    vi.spyOn(Module2OpportunityRegisterApi, 'getOpportunityRegister').mockResolvedValue({
      assessmentId: 'AIC-2026-0002',
      customerName: 'Borosil Ltd',
      generatedAt: '2026-10-26T00:00:00.000Z',
      summary: {} as any,
      opportunities: mockOpportunities,
      exclusionsSummary: {}
    });

    const exportSpy = vi.spyOn(Module2OpportunityRegisterApi, 'getExportCsvUrl');

    render(<MaterialOpportunityRegisterView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('Export Traceable CSV')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export Traceable CSV'));
    expect(exportSpy).toHaveBeenCalledWith('AIC-2026-0002');
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('handles error gracefully when load fails', async () => {
    vi.spyOn(Module2OpportunityRegisterApi, 'getOpportunityRegister').mockRejectedValue(
      new Error('Failed to load')
    );

    render(<MaterialOpportunityRegisterView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText('No matching opportunities found.')).toBeInTheDocument();
    });
  });
});
