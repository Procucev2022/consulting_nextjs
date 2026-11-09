/**
 * Module 2 — Lever 4: Volume Aggregation PO Consolidation Cadence Tab
 * Relocated from standalone engine into Lever 4: Volume Aggregation & Demand Pooling
 * Compliant with Rule 7, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import type { VolumeAggregationPoConsolidationTabProps } from '../../types/module2VolumeAggregation';
import type { LineItemMapping } from '../../types';
import { calculatePoConsolidation } from '../../utils/step2Calculators';
import { PoConsolidationSection } from '../poConsolidation';
import { UI_STRINGS } from '../../constants/uiStrings';

export const VolumeAggregationPoConsolidationTab: React.FC<VolumeAggregationPoConsolidationTabProps> = ({
  transactions
}) => {
  const poItems = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const mappedLineItems: LineItemMapping[] = transactions.map((t, idx) => {
      const lineTotal = t.total_spend_inr ?? 0;
      return {
        mapping_id: `MAP-AGG-${idx + 1}`,
        line_item_id: t.id || `TX-${idx + 1}`,
        material_code: t.material_code || `MAT-${idx + 1}`,
        material_desc: t.material_desc || UI_STRINGS.module2.volumeAggregation.materialLineItemFallback,
        raw_desc: t.material_desc || UI_STRINGS.module2.volumeAggregation.materialLineItemFallback,
        vendor_identified: t.vendor_name || UI_STRINGS.module2.volumeAggregation.supplierFallback,
        master_supplier_id: t.vendor_code || 'VND-001',
        unspsc_code: t.unspsc_code || '14111500',
        unspsc_category_name: t.spend_category || UI_STRINGS.module2.volumeAggregation.directMaterialsFallback,
        core_bucket: t.spend_category || UI_STRINGS.module2.volumeAggregation.directMaterialsFallback,
        ai_confidence: 95,
        status: 'Confirmed',
        unit_price: t.unit_price ?? 0,
        qty: t.quantity ?? 1,
        total_spend: lineTotal,
        amount_inr: lineTotal,
        inr_crores: lineTotal / 10000000,
        invoice_date: t.po_date || '2024-04-01',
        spend_year: 2024,
        po_number: t.po_number || `PO-${idx + 1}`
      };
    });

    return calculatePoConsolidation(mappedLineItems);
  }, [transactions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Analytical Signal Disclaimer Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          color: '#1e40af',
          fontSize: '13px',
          lineHeight: 1.5
        }}
      >
        <Info style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '2px' }}>
            {UI_STRINGS.module2.volumeAggregation.poConsolidationHeading}
          </div>
          <div>{UI_STRINGS.module2.volumeAggregation.poConsolidationSignalNote}</div>
        </div>
      </div>

      {/* Embedded PO Consolidation Analysis */}
      <PoConsolidationSection items={poItems} />
    </div>
  );
};
