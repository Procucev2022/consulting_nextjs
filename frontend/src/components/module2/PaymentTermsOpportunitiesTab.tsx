'use client';

import React, { useState } from 'react';
import type { PaymentTermsOpportunitiesTabProps } from '../../types/module2PaymentTerms';
import { UI_STRINGS } from '../../constants/uiStrings';

export const PaymentTermsOpportunitiesTab: React.FC<PaymentTermsOpportunitiesTabProps> = ({
  opportunities,
  coverageSummary
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [simSpendCr, setSimSpendCr] = useState<number>(120);
  const [simAdditionalDays, setSimAdditionalDays] = useState<number>(30);

  // Procucev standard linear calculation verification (Prompt 448 Section B & C)
  const simFinancingBenefitCr = Number((simSpendCr * 0.015 * (simAdditionalDays / 30)).toFixed(4));
  const simWcReleasedCr = Number(((simSpendCr / 365) * simAdditionalDays).toFixed(4));

  const filteredOpps = opportunities.filter((o) => {
    const q = searchTerm.toLowerCase();
    return (
      o.supplierName.toLowerCase().includes(q) ||
      o.supplierCode.toLowerCase().includes(q) ||
      o.spendCategory.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Interactive Simulation Sandbox */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
            {UI_STRINGS.module2.paymentTerms.scenarioBoxTitle}
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              letterSpacing: '0.03em'
            }}
          >
            {UI_STRINGS.module2.paymentTerms.scenarioGovernanceTag}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 12px 0', lineHeight: 1.5 }}>
          {UI_STRINGS.module2.paymentTerms.scenarioDisclaimer} {UI_STRINGS.module2.paymentTerms.scenarioRateNote}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
              Eligible Annual Spend (₹ Cr)
            </label>
            <input
              type="number"
              value={simSpendCr}
              onChange={(e) => setSimSpendCr(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
                fontSize: '13px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
              Illustrative Additional Credit Days (Unapproved)
            </label>
            <select
              value={simAdditionalDays}
              onChange={(e) => setSimAdditionalDays(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
                fontSize: '13px'
              }}
            >
              <option value={15}>15 Additional Days (Illustrative Scenario)</option>
              <option value={30}>30 Additional Days (Illustrative Scenario)</option>
              <option value={45}>45 Additional Days (Illustrative Scenario)</option>
              <option value={60}>60 Additional Days (Illustrative Scenario)</option>
              <option value={90}>90 Additional Days (Illustrative Scenario)</option>
            </select>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ILLUSTRATIVE FINANCING BENEFIT</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857', marginTop: '2px' }}>
              ₹{simFinancingBenefitCr.toFixed(4)} Cr
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Spend × 1.5% × ({simAdditionalDays}/30) [Unapproved]</div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ILLUSTRATIVE WC RELEASED</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
              ₹{simWcReleasedCr.toFixed(4)} Cr
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Spend / 365 × {simAdditionalDays}d [Unapproved]</div>
          </div>
        </div>
      </div>

      {/* Opportunities List or Data Unavailable Banner */}
      {opportunities.length === 0 ? (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#92400e' }}>
            {UI_STRINGS.module2.paymentTerms.dataUnavailableMessage}
          </div>
          <p style={{ fontSize: '13px', color: '#b45309', margin: '8px auto 0 auto', maxWidth: '600px' }}>
            {UI_STRINGS.module2.paymentTerms.dataUnavailableSub}
          </p>
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#78350f', fontWeight: 500 }}>
            Status: {coverageSummary.overallStatusDisplayText} | Analysed Spend: ₹{coverageSummary.totalSpendAnalysedCr.toFixed(4)} Cr ({coverageSummary.totalRecordsCount.toLocaleString()} transactions)
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
              Verified Payment Terms Opportunities ({filteredOpps.length})
            </div>
            <input
              type="text"
              placeholder={UI_STRINGS.module2.paymentTerms.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                width: '280px'
              }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 16px' }}>Supplier</th>
                <th style={{ padding: '10px 16px' }}>Category</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Annual Spend</th>
                <th style={{ padding: '10px 16px' }}>Current Terms</th>
                <th style={{ padding: '10px 16px' }}>Target Terms</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Extension</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Financing Benefit</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>WC Released</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpps.map((o) => (
                <tr key={o.opportunityId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{o.supplierName}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{o.supplierCode}</div>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#475569' }}>{o.spendCategory}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    ₹{o.annualSpendCr.toFixed(4)} Cr
                  </td>
                  <td style={{ padding: '10px 16px', color: '#334155' }}>{o.currentPaymentTerms} ({o.currentCreditDays}d)</td>
                  <td style={{ padding: '10px 16px', color: '#047857', fontWeight: 600 }}>{o.targetPaymentTerms}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>
                    +{o.additionalCreditDays} days
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#047857', fontWeight: 600 }}>
                    ₹{o.indicativeAnnualFinancingBenefitCr.toFixed(4)} Cr
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>
                    ₹{o.indicativeWorkingCapitalReleasedCr.toFixed(4)} Cr
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#166534' }}>
                      {o.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
