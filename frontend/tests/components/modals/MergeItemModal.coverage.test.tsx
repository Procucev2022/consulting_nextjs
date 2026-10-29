import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MergeItemModal } from '../../../src/components/modals/MergeItemModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { ValidationPreCheckRecord } from '../../../src/types';
import frontendLogger from '../../../src/utils/logger';
import type { FrontendLogEntry, LogLevel } from '../../../src/types/logger';

function logEntry(level: LogLevel, message: string): FrontendLogEntry {
  return { timestamp: '2026-10-11T12:00:00.000Z', level, service: 'consulting-frontend', message };
}

// Keeps logger output out of test runs while leaving the spies available for assertions.
function silenceLogger(): void {
  vi.spyOn(frontendLogger, 'debug').mockImplementation((message) => logEntry('debug', message));
  vi.spyOn(frontendLogger, 'info').mockImplementation((message) => logEntry('info', message));
  vi.spyOn(frontendLogger, 'warn').mockImplementation((message) => logEntry('warn', message));
  vi.spyOn(frontendLogger, 'error').mockImplementation((message) => logEntry('error', message));
}

type MasterItem = {
  code: string;
  name: string;
  category: string;
  column_l_code: string;
  aliases: string[];
};

type MergeItemProps = React.ComponentProps<typeof MergeItemModal>;

const incomingRecord: ValidationPreCheckRecord = {
  record_id: 'REC-001',
  column_l_code: '43211501',
  raw_desc: 'Industrial Heat Exchanger Tube Bundle 304L',
  core_category: 'Direct Materials',
  vendor_name: 'Apex Industrial Piping Ltd',
  order_quantity: 450,
  unit_price: 12500,
  spend_inr: 5625000,
  inr_crores: 0.5625,
  issue_flag: 'Unmapped Supplier Name',
  po_number: 'PO-2026-9001'
};

const customCandidates: MasterItem[] = [
  {
    code: 'ITM-HX-01',
    name: 'Heat Exchanger Tube Bundle',
    category: 'Direct Materials',
    column_l_code: '43211501',
    aliases: ['HX tube bundle', 'Exchanger tube']
  },
  {
    code: 'ITM-FL-02',
    name: 'Stainless Flange Class 150',
    category: 'Piping & Valving',
    column_l_code: '43211502',
    aliases: ['SS flange']
  }
];

describe('MergeItemModal', () => {
  const onMerge = vi.fn();
  const onClose = vi.fn();
  const onIgnore = vi.fn();

  const renderModal = (overrides: Partial<MergeItemProps> = {}): void => {
    render(
      <MergeItemModal
        record={incomingRecord}
        isOpen
        onClose={onClose}
        onMerge={onMerge}
        onIgnore={onIgnore}
        {...overrides}
      />
    );
  };

  const confirmButton = (): HTMLElement =>
    screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeItem.confirmMerge, 'i') });

  // The icon-only close button is the only button without visible text.
  const iconCloseButton = (): HTMLElement => {
    const button = screen.getAllByRole('button').find((element) => element.textContent?.trim() === '');
    if (!button) {
      throw new Error('Close icon button was not rendered');
    }
    return button;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    silenceLogger();
  });

  it('renders nothing while closed or when no record is provided', () => {
    const { container: closedContainer } = render(
      <MergeItemModal record={incomingRecord} isOpen={false} onClose={onClose} onMerge={onMerge} />
    );
    expect(closedContainer.firstChild).toBeNull();

    const { container: emptyContainer } = render(
      <MergeItemModal record={null} isOpen onClose={onClose} onMerge={onMerge} />
    );
    expect(emptyContainer.firstChild).toBeNull();
  });

  it('shows the incoming record details and the issue explanation', () => {
    renderModal();

    expect(screen.getByText(UI_STRINGS.modals.mergeItem.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.mergeItem.incomingItemLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.mergeItem.issueDescription)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.mergeItem.canonicalHint)).toBeInTheDocument();
  });

  it('derives a master item from the record when no custom list is given', () => {
    renderModal();

    expect(screen.getByText('ITM-43211501')).toBeInTheDocument();
    fireEvent.click(confirmButton());

    expect(onMerge).toHaveBeenCalledWith('REC-001', 'ITM-43211501', incomingRecord.raw_desc);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses fallback code, category, and column code when the record leaves them blank', () => {
    renderModal({ record: { ...incomingRecord, column_l_code: '', core_category: '' } });

    expect(screen.getByText('ITM-101')).toBeInTheDocument();
    fireEvent.click(confirmButton());

    expect(onMerge).toHaveBeenCalledWith('REC-001', 'ITM-101', incomingRecord.raw_desc);
  });

  it('does nothing when there is no master item to merge into', () => {
    renderModal({ record: { ...incomingRecord, raw_desc: '' } });

    fireEvent.click(confirmButton());

    expect(onMerge).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('merges into the candidate the user selects', () => {
    renderModal({ masterItems: customCandidates });

    fireEvent.click(screen.getByText('Stainless Flange Class 150'));
    fireEvent.click(confirmButton());

    expect(onMerge).toHaveBeenCalledWith('REC-001', 'ITM-FL-02', 'Stainless Flange Class 150');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to the first candidate when the selected one is no longer offered', () => {
    const { rerender } = render(
      <MergeItemModal
        record={incomingRecord}
        isOpen
        onClose={onClose}
        onMerge={onMerge}
        masterItems={customCandidates}
      />
    );
    fireEvent.click(screen.getByText('Stainless Flange Class 150'));

    rerender(
      <MergeItemModal
        record={incomingRecord}
        isOpen
        onClose={onClose}
        onMerge={onMerge}
        masterItems={[customCandidates[0]]}
      />
    );
    fireEvent.click(confirmButton());

    expect(onMerge).toHaveBeenCalledWith('REC-001', 'ITM-HX-01', 'Heat Exchanger Tube Bundle');
  });

  it('treats an empty custom list as missing and derives the candidate from the record', () => {
    renderModal({ masterItems: [] });

    expect(screen.getByText('ITM-43211501')).toBeInTheDocument();
  });

  it('rejects a merge when the record id is missing', () => {
    renderModal({ record: { ...incomingRecord, record_id: '' } });

    fireEvent.click(confirmButton());

    expect(onMerge).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a default quantity when the order quantity is missing', () => {
    renderModal({ record: { ...incomingRecord, order_quantity: undefined, inr_crores: undefined } });

    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('ignores the record through the ignore button and closes', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeItem.ignoreButton, 'i') }));

    expect(onIgnore).toHaveBeenCalledWith('REC-001');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on ignore without an ignore handler', () => {
    renderModal({ onIgnore: undefined });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.mergeItem.ignoreButton, 'i') }));

    expect(onIgnore).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the cancel button and from the header close icon', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.common.cancel }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(iconCloseButton());
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onMerge).not.toHaveBeenCalled();
  });
});
