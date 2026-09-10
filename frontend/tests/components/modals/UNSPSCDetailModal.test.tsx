import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UNSPSCDetailModal } from '../../../src/components/modals/UNSPSCDetailModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { UNSPSCCommodityRecord } from '../../../src/types';

describe('UNSPSCDetailModal Component', () => {
  const sampleRecord: UNSPSCCommodityRecord = {
    commodityCode: '10502909',
    commodityTitle: 'Fresh cut african boxwood',
    classCode: '10502900',
    classTitle: 'Fresh cut single species greens',
    familyCode: '10500000',
    familyTitle: 'Fresh cut greenery',
    segmentCode: '10000000',
    segmentTitle: 'Live Plant & Animal Material and Accessories & Supplies',
    coreBucket: 'Packaging Materials'
  };

  it('renders null when not open or record is null', () => {
    const { container: c1 } = render(
      <UNSPSCDetailModal
        record={null}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <UNSPSCDetailModal
        record={sampleRecord}
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders complete 4-level taxonomy hierarchy, codes, titles, and triggers onClose handlers', () => {
    const onClose = vi.fn();

    render(
      <UNSPSCDetailModal
        record={sampleRecord}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Header elements
    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.badgeLevel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.colLPrefix(sampleRecord.commodityCode))).toBeInTheDocument();

    // Commodity & Class highlights (can appear in banner & hierarchy cards)
    expect(screen.getAllByText(sampleRecord.commodityTitle).length).toBeGreaterThan(0);
    expect(screen.getAllByText(sampleRecord.classTitle).length).toBeGreaterThan(0);
    expect(screen.getByText(sampleRecord.coreBucket!)).toBeInTheDocument();

    // 4-Level UNSPSC Hierarchy
    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.level1Name)).toBeInTheDocument();
    expect(screen.getByText(sampleRecord.segmentTitle)).toBeInTheDocument();
    expect(screen.getByText(sampleRecord.segmentCode)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.level2Name)).toBeInTheDocument();
    expect(screen.getByText(sampleRecord.familyTitle)).toBeInTheDocument();
    expect(screen.getByText(sampleRecord.familyCode)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.level3Name)).toBeInTheDocument();
    expect(screen.getByText(sampleRecord.classCode)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.level4Name)).toBeInTheDocument();

    // 8-Digit Code breakdown
    expect(screen.getByText(UI_STRINGS.modals.unspscDetail.digitBreakdownTitle)).toBeInTheDocument();

    // Click Top Close Button
    const closeButtons = screen.getAllByRole('button', { name: UI_STRINGS.modals.unspscDetail.closeBtn });
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Click Bottom Close Button
    fireEvent.click(closeButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('handles record without optional coreBucket', () => {
    const recordWithoutBucket: UNSPSCCommodityRecord = {
      ...sampleRecord,
      coreBucket: undefined
    };

    render(
      <UNSPSCDetailModal
        record={recordWithoutBucket}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getAllByText(sampleRecord.commodityTitle).length).toBeGreaterThan(0);
    expect(screen.queryByText('Packaging Materials')).not.toBeInTheDocument();
  });
});
