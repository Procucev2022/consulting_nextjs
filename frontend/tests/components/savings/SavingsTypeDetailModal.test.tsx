import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavingsTypeDetailModal } from '../../../src/components/savings/SavingsTypeDetailModal';
import type { SavingsTypeEvidenceInventoryItem } from '../../../src/types/evidenceWorkbook';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('SavingsTypeDetailModal Component (Prompt 306)', () => {
  const sampleItem: SavingsTypeEvidenceInventoryItem = {
    savingsType: 'BENCHMARK_PRICE_GAP',
    initiativeId: 'OPP-003',
    filename: '04B_Benchmark_Price_Gap_Evidence.xlsx',
    title: 'Benchmark Price Gap Analysis',
    description: 'PCBI direct commodity price variance derivation against published indices.',
    grossAmountCr: 80.67,
    overlapAmountCr: 40.20,
    netAmountCr: 29.73,
    classificationNote: 'Exclusion-adjusted net opportunity after ₹40.20 Cr overlap and ₹10.74 Cr exclusions.',
    sheetCount: 5,
    isAvailable: true,
    requiredRole: 'ADMIN'
  };

  it('renders nothing when isOpen is false or item is null', () => {
    const { container: c1 } = render(
      <SavingsTypeDetailModal
        isOpen={false}
        item={sampleItem}
        jobId="job-001"
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <SavingsTypeDetailModal
        isOpen={true}
        item={null}
        jobId="job-001"
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders modal details and triggers callbacks', () => {
    const onClose = vi.fn();
    const onDownload = vi.fn();

    render(
      <SavingsTypeDetailModal
        isOpen={true}
        item={sampleItem}
        jobId="job-001"
        onClose={onClose}
        onDownload={onDownload}
      />
    );

    expect(screen.getByText('Benchmark Price Gap Analysis')).toBeInTheDocument();
    expect(screen.getByText('OPP-003')).toBeInTheDocument();
    expect(screen.getByText('₹80.67 Cr')).toBeInTheDocument();
    expect(screen.getByText('-₹40.20 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹29.73 Cr')).toBeInTheDocument();
    expect(screen.getByText(sampleItem.classificationNote!)).toBeInTheDocument();

    // Trigger download
    const downloadBtn = screen.getByText(UI_STRINGS.evidence.savingsTypes.btnEvidenceExcelDownload);
    fireEvent.click(downloadBtn);
    expect(onDownload).toHaveBeenCalledWith('BENCHMARK_PRICE_GAP');

    // Trigger close
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
