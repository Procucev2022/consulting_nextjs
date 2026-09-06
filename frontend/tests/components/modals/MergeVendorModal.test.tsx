import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MergeVendorModal } from '../../../src/components/modals/MergeVendorModal';
import { initialValidationRecords } from '../../../src/data/mockData';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('MergeVendorModal Component', () => {
  const sampleRec = initialValidationRecords[0];

  it('renders null when not open or record is null', () => {
    const { container } = render(
      <MergeVendorModal
        record={null}
        isOpen={false}
        onClose={vi.fn()}
        onMerge={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders supplier choices, handles selection, and confirms merge', () => {
    const onMerge = vi.fn();
    const onClose = vi.fn();

    render(
      <MergeVendorModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={onMerge}
      />
    );

    expect(screen.getByText(UI_STRINGS.modals.mergeVendor.title)).toBeInTheDocument();
    expect(screen.getByText(sampleRec.vendor_name)).toBeInTheDocument();

    // Select second master supplier
    const amcorBtn = screen.getByText('Amcor Packaging Group Global');
    fireEvent.click(amcorBtn);

    // Confirm merge
    const confirmBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
    fireEvent.click(confirmBtn);

    expect(onMerge).toHaveBeenCalledWith(
      sampleRec.record_id,
      'SUP-AMCOR-001',
      'Amcor Packaging Group Global'
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('handles close button', () => {
    const onClose = vi.fn();
    render(
      <MergeVendorModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
