import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefTraceabilityModal } from '../../src/components/executiveBrief/ExecutiveBriefTraceabilityModal';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';
import type { ExecutiveBriefTraceabilityItem } from '../../src/types';

describe('ExecutiveBriefTraceabilityModal', () => {
  const mockItem: ExecutiveBriefTraceabilityItem = {
    findingId: 'FIND-01',
    module: 'Module 1',
    category: 'Grinding Media & Mill Consumables',
    item: 'High Chrome Alloy Grinding Balls 60mm',
    supplier: 'AIA Engineering Ltd',
    erpRecord: 'PO-2024-88419',
    calculation: 'Rate Dispersion: ₹142.50/kg vs Median ₹128.20/kg',
    opportunity: 'Inter-plant corporate rate harmonization',
    savings: '₹24.60 Cr Approved'
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ExecutiveBriefTraceabilityModal
        isOpen={false}
        onClose={vi.fn()}
        activeItem={mockItem}
        items={[mockItem]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all 9 traceability steps when open', () => {
    const onClose = vi.fn();
    render(
      <ExecutiveBriefTraceabilityModal
        isOpen={true}
        onClose={onClose}
        activeItem={mockItem}
        items={[mockItem]}
      />
    );

    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.traceability.modalTitle)).toBeInTheDocument();
    expect(screen.getByText('FIND-01')).toBeInTheDocument();
    expect(screen.getByText('High Chrome Alloy Grinding Balls 60mm')).toBeInTheDocument();
    expect(screen.getByText('AIA Engineering Ltd')).toBeInTheDocument();
    expect(screen.getByText('₹24.60 Cr Approved')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-traceability-modal-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses first item as fallback when activeItem is null', () => {
    render(
      <ExecutiveBriefTraceabilityModal
        isOpen={true}
        onClose={vi.fn()}
        activeItem={null}
        items={[mockItem]}
      />
    );
    expect(screen.getByText('FIND-01')).toBeInTheDocument();
  });

  it('returns null when items is empty and activeItem is null', () => {
    const { container } = render(
      <ExecutiveBriefTraceabilityModal
        isOpen={true}
        onClose={vi.fn()}
        activeItem={null}
        items={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
