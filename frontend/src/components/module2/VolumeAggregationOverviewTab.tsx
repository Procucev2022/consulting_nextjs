/**
 * Module 2 — Lever 4: Volume Aggregation Overview Tab
 * Compliant with Rule 7, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import React, { useState, useMemo } from 'react';
import type { VolumeAggregationOpportunity, VolumeAggregationOpportunityTier } from '../../types/module2VolumeAggregation';

interface VolumeAggregationOverviewTabProps {
  tier1: VolumeAggregationOpportunity[];
  tier2: VolumeAggregationOpportunity[];
  tier3: VolumeAggregationOpportunity[];
}

export const VolumeAggregationOverviewTab: React.FC<VolumeAggregationOverviewTabProps> = ({
  tier1,
  tier2,
  tier3
}) => {
  const [selectedTier, setSelectedTier] = useState<VolumeAggregationOpportunityTier | 'ALL' | 'GENUINE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const allOpportunities = useMemo(() => {
    return [...tier1, ...tier2, ...tier3];
  }, [tier1, tier2, tier3]);

  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter((opp) => {
      if (selectedTier === 'GENUINE' && !opp.isGenuineOpportunity) return false;
      if (selectedTier !== 'ALL' && selectedTier !== 'GENUINE' && opp.tier !== selectedTier) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        opp.materialCode.toLowerCase().includes(term) ||
        opp.materialDesc.toLowerCase().includes(term) ||
        opp.category.toLowerCase().includes(term) ||
        opp.unspscCode.toLowerCase().includes(term) ||
        opp.opportunityId.toLowerCase().includes(term)
      );
    });
  }, [allOpportunities, selectedTier, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'ALL', label: `All Records (${allOpportunities.length})` },
              {
                id: 'GENUINE',
                label: `Genuine Opportunities (${allOpportunities.filter((o) => o.isGenuineOpportunity).length})`
              },
              { id: 'TIER_1_IDENTICAL', label: `Tier 1: Identical (${tier1.length})` },
              { id: 'TIER_2_COMPARABLE', label: `Tier 2: Comparable (${tier2.length})` },
              { id: 'TIER_3_CATEGORY', label: `Tier 3: Category (${tier3.length})` }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id as VolumeAggregationOpportunityTier | 'ALL' | 'GENUINE')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: selectedTier === tab.id ? '#2563eb' : '#cbd5e1',
                backgroundColor: selectedTier === tab.id ? '#eff6ff' : '#ffffff',
                color: selectedTier === tab.id ? '#1d4ed8' : '#475569',
                fontSize: '13px',
                fontWeight: selectedTier === tab.id ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by material code, description, UNSPSC..."
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            width: '280px'
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '12px 16px' }}>Opportunity</th>
              <th style={{ padding: '12px 16px' }}>Tier</th>
              <th style={{ padding: '12px 16px' }}>Scope / Material</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Spend (₹ Cr)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aggregatable Qty</th>
              <th style={{ padding: '12px 16px' }}>Base UOM</th>
              <th style={{ padding: '12px 16px' }}>Plants</th>
              <th style={{ padding: '12px 16px' }}>Demand Class</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOpportunities.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No volume aggregation opportunities match your filter.
                </td>
              </tr>
            ) : (
              filteredOpportunities.map((opp) => {
                const isTier1 = opp.tier === 'TIER_1_IDENTICAL';
                const isTier2 = opp.tier === 'TIER_2_COMPARABLE';
                const tierColor = isTier1 ? '#047857' : isTier2 ? '#b45309' : '#4338ca';
                const tierBg = isTier1 ? '#ecfdf5' : isTier2 ? '#fffbeb' : '#eef2ff';

                return (
                  <tr key={opp.opportunityId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                      {opp.opportunityId}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: tierBg,
                          color: tierColor,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {opp.tier === 'TIER_1_IDENTICAL' ? 'Tier 1' : opp.tier === 'TIER_2_COMPARABLE' ? 'Tier 2' : 'Tier 3'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{opp.materialCode}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{opp.materialDesc}</div>
                      {opp.densityConversion?.applied ? (
                        <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px' }}>
                          ✓ Density: {opp.densityConversion.formula}
                        </div>
                      ) : opp.densityConversion ? (
                        <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                          ⚠️ Density Audit: Native volume preserved in {opp.densityConversion.sourceUom}
                        </div>
                      ) : null}
                      {(opp.eligibilityType === 'SINGLE_PURCHASE_NON_AGGREGATABLE' ||
                        opp.eligibilityType === 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN') && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          [Limited History — Review Required]
                        </div>
                      )}
                      {opp.eligibilityType === 'INCOMPATIBLE_UOM' && (
                        <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>
                          [Incompatible / Unverified UOM]
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ₹{opp.totalHistoricalSpendCr.toFixed(4)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {isTier2 ? (
                        <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600 }}>
                          CONDITIONAL
                        </span>
                      ) : opp.tier === 'TIER_3_CATEGORY' ? (
                        <span style={{ color: '#64748b', fontSize: '11px' }}>N/A (Umbrella)</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#10b981' }}>
                          {opp.aggregatableQuantity.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{opp.baseUom}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: opp.plantCount >= 2 ? '#ecfdf5' : '#f1f5f9',
                          color: opp.plantCount >= 2 ? '#047857' : '#475569',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {opp.plantCount} {opp.plantCount === 1 ? 'Plant' : 'Plants'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        title={opp.demandClassificationEvidence || opp.demandClassificationLabel}
                        style={{
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {opp.demandClassificationLabel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor:
                            opp.opportunityStatus === 'Candidate Identified'
                              ? '#eff6ff'
                              : opp.opportunityStatus === 'Technical Validation Required'
                              ? '#fffbeb'
                              : '#f8fafc',
                          color:
                            opp.opportunityStatus === 'Candidate Identified'
                              ? '#1d4ed8'
                              : opp.opportunityStatus === 'Technical Validation Required'
                              ? '#b45309'
                              : '#475569',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {opp.opportunityStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
