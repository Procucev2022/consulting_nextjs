import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MergeItemModal } from '../../../src/components/modals/MergeItemModal';
import { initialValidationRecords } from '../../../src/data/mockData';
import { UI_STRINGS, DEFAULT_MASTER_ITEMS } from '../../../src/constants';

describe('MergeItemModal Component', () => {
  const sampleRec = initialValidationRecords[initialValidationRecords.length - 1];

  it('renders null when not open or record is null', () => {
    const { container } = render(
      <MergeItemModal
        record={null}
        isOpen={false}
        onClose={vi.fn()}
        onMerge={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders master item choices, handles selection, and confirms merge', () => {
    const onMerge = vi.fn();
    const onClose = vi.fn();

    render(
      <MergeItemModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={onMerge}
      />
    );

    expect(screen.getByText(UI_STRINGS.modals.mergeItem.title)).toBeInTheDocument();
    expect(screen.getAllByText(sampleRec.raw_desc)[0]).toBeInTheDocument();

    // Select second master item
    const secondItem = DEFAULT_MASTER_ITEMS[1];
    const secondItemBtn = screen.getByText(secondItem.name);
    fireEvent.click(secondItemBtn);

    // Confirm merge
    const confirmBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.modals.mergeItem.confirmMerge, 'i')
    });
    fireEvent.click(confirmBtn);

    expect(onMerge).toHaveBeenCalledWith(
      sampleRec.record_id,
      secondItem.code,
      secondItem.name
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('handles default master item without clicking another option', () => {
    const onMerge = vi.fn();
    const onClose = vi.fn();

    render(
      <MergeItemModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={onMerge}
      />
    );

    const firstItem = DEFAULT_MASTER_ITEMS[0];
    const confirmBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.modals.mergeItem.confirmMerge, 'i')
    });
    fireEvent.click(confirmBtn);

    expect(onMerge).toHaveBeenCalledWith(
      sampleRec.record_id,
      firstItem.code,
      firstItem.name
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    const onClose = vi.fn();

    render(
      <MergeItemModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', {
      name: UI_STRINGS.common.cancel
    });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('returns early when validation fails on invalid record', () => {
    const onMerge = vi.fn();
    const onClose = vi.fn();

    render(
      <MergeItemModal
        record={{ ...sampleRec, record_id: '' }}
        isOpen={true}
        onClose={onClose}
        onMerge={onMerge}
      />
    );

    const confirmBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.modals.mergeItem.confirmMerge, 'i')
    });
    fireEvent.click(confirmBtn);

    expect(onMerge).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles fallback order quantity when order_quantity is undefined', () => {
    const onMerge = vi.fn();
    const onClose = vi.fn();

    render(
      <MergeItemModal
        record={{ ...sampleRec, order_quantity: undefined }}
        isOpen={true}
        onClose={onClose}
        onMerge={onMerge}
      />
    );

    expect(screen.getByText(/Qty:/i)).toBeInTheDocument();
  });

  it('renders issue description and handles ignore button click', () => {
    const onIgnore = vi.fn();
    const onClose = vi.fn();

    render(
      <MergeItemModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={vi.fn()}
        onIgnore={onIgnore}
      />
    );

    expect(screen.getByText(new RegExp(UI_STRINGS.modals.mergeItem.issueLabel, 'i'))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.mergeItem.issueDescription)).toBeInTheDocument();

    const ignoreBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeItem.ignoreButton, 'i') });
    expect(ignoreBtn).toBeInTheDocument();
    fireEvent.click(ignoreBtn);

    expect(onIgnore).toHaveBeenCalledWith(sampleRec.record_id);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles ignore button click when onIgnore is undefined without error', () => {
    const onClose = vi.fn();

    render(
      <MergeItemModal
        record={sampleRec}
        isOpen={true}
        onClose={onClose}
        onMerge={vi.fn()}
      />
    );

    const ignoreBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeItem.ignoreButton, 'i') });
    fireEvent.click(ignoreBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
