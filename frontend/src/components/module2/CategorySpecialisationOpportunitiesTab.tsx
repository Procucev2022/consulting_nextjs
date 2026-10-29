'use client';

import React from 'react';
import type { CategorySpecialisationResult } from '../../types/module2CategorySpecialisation';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../constants/module2CategorySpecialisation';

interface OpportunitiesTabProps {
  data: CategorySpecialisationResult;
}

export const CategorySpecialisationOpportunitiesTab: React.FC<OpportunitiesTabProps> = ({
  data
}) => {
  const assumptions = data.opportunityHeadAssumptions;

  // Aggregate totals per head across all categories
  const headTotals = assumptions.map((a) => {
    let eligibleSpendInr = 0;
    let lowEstimateInr = 0;
    let baseEstimateInr = 0;
    let highEstimateInr = 0;
    let establishedCount = 0;

    for (const c of data.categories) {
      const match = c.opportunities.find((opp) => opp.headKey === a.key);
      if (match?.isEligibleEstablished) {
        eligibleSpendInr += match.eligibleAnnualSpendInr;
        lowEstimateInr += match.lowEstimateInr;
        baseEstimateInr += match.baseEstimateInr;
        highEstimateInr += match.highEstimateInr;
        establishedCount++;
      }
    }

    return {
      assumption: a,
      eligibleSpendCr: Number((eligibleSpendInr / 10000000).toFixed(2)),
      lowEstimateCr: Number((lowEstimateInr / 10000000).toFixed(2)),
      baseEstimateCr: Number((baseEstimateInr / 10000000).toFixed(2)),
      highEstimateCr: Number((highEstimateInr / 10000000).toFixed(2)),
      isEstablished: establishedCount > 0
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Heads Summary Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.OPPORTUNITIES_TABLE_TITLE}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Portfolio-level aggregation across the 10 Procucev Category Specialisation planning opportunity heads.
          </p>
        </div>

        {assumptions.length === 0 ? (
          <p style={{ margin: 0, padding: '16px', fontSize: '12px', color: '#475569' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.NO_D1_PLANNING_ASSUMPTIONS}
          </p>
        ) : <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 14px' }}>Code</th>
                <th style={{ padding: '10px 14px' }}>Opportunity Head Title</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Planning Assumptions (%)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Eligible Spend</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Low (Cr)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Base (Cr)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>High (Cr)</th>
                <th style={{ padding: '10px 14px' }}>Related Lever</th>
              </tr>
            </thead>
            <tbody>
              {headTotals.map((item) => (
                <tr key={item.assumption.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#2563eb' }}>
                    {item.assumption.code}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                    {item.assumption.title}
                    {item.assumption.appliesToOperatingCost && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', color: '#b45309', fontWeight: 700 }}>
                        [OPERATING COST POOL]
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#475569' }}>
                    {item.assumption.lowPct}% - {item.assumption.basePct}% - {item.assumption.highPct}%
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    {item.isEstablished
                      ? `₹${item.eligibleSpendCr.toFixed(2)} Cr`
                      : (item.assumption.key === 'HEAD-A' || item.assumption.key === 'HEAD-I' || item.assumption.key === 'HEAD-G')
                        ? 'Identified — Not Quantifiable'
                        : 'Not Established'}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>
                    {item.isEstablished
                      ? `₹${item.lowEstimateCr.toFixed(2)}`
                      : (item.assumption.key === 'HEAD-A' || item.assumption.key === 'HEAD-I' || item.assumption.key === 'HEAD-G')
                        ? 'Not Quantifiable'
                        : 'Data Gap'}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: item.isEstablished ? '#047857' : '#94a3b8' }}>
                    {item.isEstablished
                      ? `₹${item.baseEstimateCr.toFixed(2)}`
                      : (item.assumption.key === 'HEAD-A' || item.assumption.key === 'HEAD-I' || item.assumption.key === 'HEAD-G')
                        ? 'Not Quantifiable'
                        : 'Data Gap'}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>
                    {item.isEstablished
                      ? `₹${item.highEstimateCr.toFixed(2)}`
                      : (item.assumption.key === 'HEAD-A' || item.assumption.key === 'HEAD-I' || item.assumption.key === 'HEAD-G')
                        ? 'Not Quantifiable'
                        : 'Data Gap'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>
                    {item.assumption.relatedLever ? item.assumption.relatedLever.replace('_', ' ') : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      {/* Specific Governance Callouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
            Head J: Process & Transaction Efficiency
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#1e3a8a' }}>
            Strictly applies to independently established procurement operating costs (e.g. staffing, systems, overhead),
            not material purchase spend. In the absence of an operating cost baseline, eligible spend is marked
            as unestablished with ₹0 benefit.
          </p>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>
            Head E: Contract Coverage Improvement
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d' }}>
            Contract status is not maintained in standard transaction feeds. Per governance rules, no benefit is claimed
            without verifiable contract expiry and compliance registers.
          </p>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
            Head G: Alternative Supplier Development
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>
            Supplier concentration indicates single-source resilience risk. Monetary benefits require documented
            technical qualification trials, plant audits, and validated competitive price quotes.
          </p>
        </div>
      </div>
    </div>
  );
};
