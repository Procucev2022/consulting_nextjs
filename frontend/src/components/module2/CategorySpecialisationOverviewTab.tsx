'use client';

import React from 'react';
import type { CategorySpecialisationResult } from '../../types/module2CategorySpecialisation';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../constants/module2CategorySpecialisation';

interface OverviewTabProps {
  data: CategorySpecialisationResult;
  onSelectCategory?: (categoryName: string) => void;
}

export const CategorySpecialisationOverviewTab: React.FC<OverviewTabProps> = ({
  data,
  onSelectCategory
}) => {
  const sum = data.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Gross vs Net Comparison Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '20px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
          {CATEGORY_SPECIALISATION_UI_STRINGS.OPPORTUNITY_GROSS_VS_NET_TITLE}
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
          Gross tentative opportunities represent the sum of monetisable opportunity heads with established commercial mechanisms.
          Strategic governance (Head A) and specialist deployment (Head I) are reported as unquantified capability opportunities.
          Net indicative opportunities deduplicate cross-lever overlaps (Levers 1, 2, 3, 4, 8) and exclude amounts requiring commercial review.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Gross Box */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #cbd5e1'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              GROSS TENTATIVE OPPORTUNITY (PRE-DEDUPLICATION)
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Base Estimate:</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                ₹{sum.grossTentativeOpportunityBaseCr.toFixed(2)} Cr
              </span>
            </div>
            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span>Low Range: ₹{sum.grossTentativeOpportunityLowCr.toFixed(2)} Cr</span>
              <span>High Range: ₹{sum.grossTentativeOpportunityHighCr.toFixed(2)} Cr</span>
            </div>
          </div>

          {/* Net Box */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#ecfdf5',
              borderRadius: '6px',
              border: '1px solid #a7f3d0'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#065f46' }}>
              NET INDICATIVE OPPORTUNITY (CONFIRMED DEDUPLICATED)
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', color: '#047857' }}>Base Estimate:</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#065f46' }}>
                ₹{sum.netIndicativeOpportunityBaseCr.toFixed(2)} Cr
              </span>
            </div>
            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#047857' }}>
              <span>Low Range: ₹{sum.netIndicativeOpportunityLowCr.toFixed(2)} Cr</span>
              <span>High Range: ₹{sum.netIndicativeOpportunityHighCr.toFixed(2)} Cr</span>
            </div>
          </div>
        </div>

        {sum.opportunitiesRequiringOverlapReviewCount > 0 && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#fffbeb',
              borderRadius: '6px',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#92400e'
            }}
          >
            <span>
              ⚠️ <strong>{sum.opportunitiesRequiringOverlapReviewCount}</strong> opportunity line items totaling{' '}
              <strong>₹{sum.overlapReviewAmountCr.toFixed(2)} Cr</strong> require cross-lever review (Levers 1, 2, 3, 4, 8)
              and are excluded from the net total.
            </span>
          </div>
        )}

        {(sum.unquantifiedOpportunitiesCount ?? 0) > 0 && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              fontSize: '12px',
              color: '#1e40af'
            }}
          >
            ℹ️ <strong>{sum.unquantifiedOpportunitiesCount}</strong> opportunity items (including Strategic Category Governance,
            Technical Domain Expertise Deployment, Single-Source Resilience Risks, and Data Gaps) are identified as capability & resilience recommendations without automatic monetary savings.
          </div>
        )}
      </div>

      {/* Priority & Resourcing Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Category Prioritisation Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.PRIORITY_BREAKDOWN_TITLE}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                Priority A — Strategic Category
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{sum.priorityACount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#854d0e', fontWeight: 600 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                Priority B — Optimisation Candidate
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{sum.priorityBCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                Priority C — Routine Category
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{sum.priorityCCount}</span>
            </div>
          </div>
        </div>

        {/* Resourcing Approach Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.RESOURCE_RECOMMENDATIONS_TITLE}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Dedicated Category Manager:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{sum.dedicatedManagerCount} categories</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Shared Category Manager:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{sum.sharedManagerCount} categories</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Centralised Category Management:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{sum.centralisedManagementCount} categories</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Standard or Automated Procurement:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{sum.automatedProcurementCount} categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories by Spend Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
          Top Strategic Categories Assessed
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '10px 16px' }}>Category</th>
              <th style={{ padding: '10px 16px' }}>Priority</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>Annual Spend</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>Spend Share</th>
              <th style={{ padding: '10px 16px' }}>Recommended Resourcing</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.slice(0, 5).map((c) => (
              <tr
                key={c.categoryName}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: onSelectCategory ? 'pointer' : 'default' }}
                onClick={() => onSelectCategory?.(c.categoryName)}
              >
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e293b' }}>{c.categoryName}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: c.priority === 'PRIORITY_A' ? '#fef2f2' : c.priority === 'PRIORITY_B' ? '#fefce8' : '#f0fdf4',
                      color: c.priority === 'PRIORITY_A' ? '#991b1b' : c.priority === 'PRIORITY_B' ? '#854d0e' : '#166534'
                    }}
                  >
                    {c.priority.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  ₹{c.annualSpendCr.toFixed(2)} Cr
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }}>{c.spendSharePct}%</td>
                <td style={{ padding: '10px 16px', color: '#334155' }}>
                  {c.recommendedApproach.replace(/_/g, ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
