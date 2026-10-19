'use client';

import React, { useState } from 'react';
import type {
  CategorySpecialisationProfile,
  CategoryOpportunityBenefit
} from '../../types/module2CategorySpecialisation';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../constants/module2CategorySpecialisation';

interface CategoriesTabProps {
  categories: CategorySpecialisationProfile[];
  initialSelectedCategory?: string;
}

export const CategorySpecialisationCategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  initialSelectedCategory
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    initialSelectedCategory || null
  );

  const toggleExpand = (catName: string) => {
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.CATEGORIES_TABLE_TITLE}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Multi-dimensional evaluation of procurement categories. Click any row to inspect opportunity heads and evidence.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 14px' }}>Category</th>
                <th style={{ padding: '10px 14px' }}>Priority</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Annual Spend</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Share (%)</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Tx / Supp / Mat</th>
                <th style={{ padding: '10px 14px' }}>Top Vendor Share</th>
                <th style={{ padding: '10px 14px' }}>Resourcing Approach</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const isExpanded = expandedCategory === c.categoryName;
                return (
                  <React.Fragment key={c.categoryName}>
                    <tr
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleExpand(c.categoryName)}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {c.categoryName}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor:
                              c.priority === 'PRIORITY_A' ? '#fef2f2' : c.priority === 'PRIORITY_B' ? '#fefce8' : '#f0fdf4',
                            color:
                              c.priority === 'PRIORITY_A' ? '#991b1b' : c.priority === 'PRIORITY_B' ? '#854d0e' : '#166534'
                          }}
                        >
                          {c.priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        ₹{c.annualSpendCr.toFixed(2)} Cr
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>
                        {c.spendSharePct}%
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569' }}>
                        {c.transactionCount} / {c.distinctSuppliersCount} / {c.distinctMaterialsCount}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {c.topSupplierConcentrationPct}% (HHI: {c.herfindahlIndex})
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155', fontSize: '11px' }}>
                        {c.recommendedApproach.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            background: '#ffffff',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(c.categoryName);
                          }}
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>

                    {/* Drill-Down Section */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <td colSpan={8} style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#334155' }}>
                              <strong>Prioritisation Rationale:</strong> {c.priorityRationale}
                            </div>
                            <div style={{ fontSize: '12px', color: '#334155' }}>
                              <strong>Resourcing Rationale:</strong> {c.approachRationale}
                            </div>
                            <div style={{ fontSize: '12px', color: '#991b1b' }}>
                              <strong>Data Disclosures:</strong> {c.dataLimitations}
                            </div>

                            {/* Opportunities Table for Category */}
                            <div style={{ marginTop: '8px' }}>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                Opportunity Heads for {c.categoryName}
                              </h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', backgroundColor: '#ffffff' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                                    <th style={{ padding: '6px 8px' }}>Head Code & Title</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Eligible Spend</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Assumption (%)</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Base Benefit</th>
                                    <th style={{ padding: '6px 8px' }}>Calculation Rationale</th>
                                    <th style={{ padding: '6px 8px' }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.opportunities.map((opp: CategoryOpportunityBenefit) => (
                                    <tr key={opp.headKey} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                                        {opp.headCode}: {opp.headTitle}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                        {opp.isEligibleEstablished
                                          ? `₹${opp.eligibleAnnualSpendCr.toFixed(2)} Cr`
                                          : 'Not Established'}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                        {opp.lowAssumptionPct}% - {opp.baseAssumptionPct}% - {opp.highAssumptionPct}%
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                                        {opp.isEligibleEstablished
                                          ? `₹${opp.baseEstimateCr.toFixed(2)} Cr`
                                          : '₹0.00 Cr'}
                                      </td>
                                      <td style={{ padding: '6px 8px', color: '#475569' }}>
                                        {opp.calculationRationale}
                                      </td>
                                      <td style={{ padding: '6px 8px', color: '#64748b' }}>
                                        {opp.dataAndEvidenceStatus.replace(/_/g, ' ')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
