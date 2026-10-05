import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SavingsTypeEvidenceSection } from '../../../src/components/savings/SavingsTypeEvidenceSection';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { evidenceApi } from '../../../src/utils/evidenceApi';

describe('SavingsTypeEvidenceSection Component (Prompt 306)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Level 1 comprehensive CTA and all 7 canonical savings type cards', () => {
    render(<SavingsTypeEvidenceSection jobId="job-test-101" className="custom-class" />);

    expect(screen.getByTestId('savings-type-evidence-section')).toHaveClass('custom-class');
    expect(screen.getByTestId('btn-download-savings-engine-evidence')).toBeInTheDocument();

    const expectedTypes = [
      'VENDOR_CONSOLIDATION',
      'BENCHMARK_PRICE_GAP',
      'STRATEGIC_SOURCING',
      'STRATEGIC_MARKET_VALUE',
      'PROCESS_PRODUCTIVITY',
      'COST_AVOIDANCE_RISK',
      'REALIZED_SAVINGS'
    ];

    for (const type of expectedTypes) {
      expect(screen.getByTestId(`evidence-card-${type}`)).toBeInTheDocument();
      expect(screen.getByTestId(`btn-view-details-${type}`)).toBeInTheDocument();
      expect(screen.getByTestId(`btn-download-evidence-${type}`)).toBeInTheDocument();
    }
  });

  it('opens details modal when View Details is clicked and closes it', async () => {
    const onViewDetails = vi.fn();
    render(<SavingsTypeEvidenceSection jobId="job-test-101" onViewDetails={onViewDetails} />);

    const viewBtn = screen.getByTestId('btn-view-details-VENDOR_CONSOLIDATION');
    fireEvent.click(viewBtn);

    expect(onViewDetails).toHaveBeenCalledWith('VENDOR_CONSOLIDATION');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Vendor Consolidation & Tail Rationalization');

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('handles Level 1 comprehensive download click', () => {
    const spy = vi.spyOn(evidenceApi, 'getWorkbookDownloadUrl');
    render(<SavingsTypeEvidenceSection jobId="job-test-101" />);

    const comprehensiveBtn = screen.getByTestId('btn-download-savings-engine-evidence');
    fireEvent.click(comprehensiveBtn);

    expect(spy).toHaveBeenCalledWith('job-test-101', 'SAVINGS_ENGINE_EVIDENCE');
  });

  it('handles Level 2 savings type evidence download click', () => {
    const spy = vi.spyOn(evidenceApi, 'getSavingsTypeDownloadUrl');
    render(<SavingsTypeEvidenceSection jobId="job-test-101" />);

    const downloadBtn = screen.getByTestId('btn-download-evidence-BENCHMARK_PRICE_GAP');
    fireEvent.click(downloadBtn);

    expect(spy).toHaveBeenCalledWith('job-test-101', 'BENCHMARK_PRICE_GAP');
  });
});
