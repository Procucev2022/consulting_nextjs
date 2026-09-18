import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MergeVendorModal } from '../../../src/components/modals/MergeVendorModal';
import { initialValidationRecords } from '../../../src/data/mockData';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('MergeVendorModal Component', () => {
  const sampleRec = {
    record_id: 'REC-001',
    column_l_code: '43211501',
    raw_desc: 'Industrial Heat Exchanger Tube Bundle 304L',
    core_category: 'Direct Materials',
    vendor_name: 'Apex Industrial Piping Ltd',
    order_quantity: 450,
    unit_price: 12500,
    spend_inr: 5625000,
    issue_flag: 'VENDOR_NAME_ANOMALY' as const,
    po_number: 'PO-2026-9001'
  };

  const secondRec = {
    record_id: 'REC-002',
    column_l_code: '43211502',
    raw_desc: 'Stainless Steel Flange Class 150',
    core_category: 'Piping & Valving',
    vendor_name: 'Bharat Forge & Fittings',
    order_quantity: 1200,
    unit_price: 3400,
    spend_inr: 4080000,
    issue_flag: 'PRICE_ANOMALY' as const,
    po_number: 'PO-2026-9002'
  };

  const realMasterSuppliers = [
    {
      id: `VEN-${sampleRec.vendor_name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}-001`,
      name: sampleRec.vendor_name,
      subsidiaries: [`${sampleRec.vendor_name} Corporate`, `${sampleRec.vendor_name} Logistics`]
    },
    {
      id: `VEN-${secondRec.vendor_name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}-001`,
      name: secondRec.vendor_name,
      subsidiaries: [`${secondRec.vendor_name} Global`, `${secondRec.vendor_name} Express`]
    }
  ];

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
        masterSuppliers={realMasterSuppliers}
      />
    );

    expect(screen.getByText(UI_STRINGS.modals.mergeVendor.title)).toBeInTheDocument();
    expect(screen.getAllByText(sampleRec.vendor_name)[0]).toBeInTheDocument();

    // Select second master supplier
    const secondVendorBtn = screen.getAllByText(secondRec.vendor_name)[0];
    fireEvent.click(secondVendorBtn);

    // Confirm merge
    const confirmBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
    fireEvent.click(confirmBtn);

    expect(onMerge).toHaveBeenCalledWith(
      sampleRec.record_id,
      realMasterSuppliers[1].id,
      secondRec.vendor_name
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

    const cancelBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.common.cancel, 'i') });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders issue description and handles ignore button click', () => {
    const onIgnore = vi.fn();
    const onClose = vi.fn();

    render(
      <MergeVendorModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={vi.fn()}
        onIgnore={onIgnore}
      />
    );

    expect(screen.getByText(new RegExp(UI_STRINGS.modals.mergeVendor.issueLabel, 'i'))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.mergeVendor.issueDescription)).toBeInTheDocument();

    const ignoreBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.ignoreButton, 'i') });
    expect(ignoreBtn).toBeInTheDocument();
    fireEvent.click(ignoreBtn);

    expect(onIgnore).toHaveBeenCalledWith(sampleRec.record_id);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles ignore button click when onIgnore is undefined without error', () => {
    const onClose = vi.fn();

    render(
      <MergeVendorModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={vi.fn()}
      />
    );

    const ignoreBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.ignoreButton, 'i') });
    fireEvent.click(ignoreBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles default master supplier without clicking another option', () => {
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

    const confirmBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
    fireEvent.click(confirmBtn);
    expect(onMerge).toHaveBeenCalledWith(
      sampleRec.record_id,
      realMasterSuppliers[0].id,
      sampleRec.vendor_name
    );
  });

  it('returns early when validation fails on invalid record', () => {
    const onMerge = vi.fn();
    const onClose = vi.fn();
    render(
      <MergeVendorModal
        record={{ ...sampleRec, record_id: '' }}
        isOpen={true}
        onClose={onClose}
        onMerge={onMerge}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeVendor.confirmMerge, 'i') });
    fireEvent.click(confirmBtn);
    expect(onMerge).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

