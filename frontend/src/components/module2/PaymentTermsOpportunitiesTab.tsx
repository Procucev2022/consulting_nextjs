'use client';

import React, { useState } from 'react';
import type { PaymentTermsOpportunitiesTabProps } from '../../types/module2PaymentTerms';
import { UI_STRINGS } from '../../constants/uiStrings';
import {
  DAYS_IN_STANDARD_YEAR,
  PAYMENT_TERMS_SIMULATION_CREDIT_DAY_OPTIONS,
  PAYMENT_TERMS_SIMULATION_DEFAULT_CREDIT_DAYS,
  PAYMENT_TERMS_SIMULATION_DEFAULT_SPEND_CR,
  PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS,
  STANDARD_CREDIT_INTERVAL_DAYS
} from '../../constants/module2PaymentTerms';

export const PaymentTermsOpportunitiesTab: React.FC<PaymentTermsOpportunitiesTabProps> = ({
  opportunities,
  coverageSummary
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [simSpendCr, setSimSpendCr] = useState<number>(PAYMENT_TERMS_SIMULATION_DEFAULT_SPEND_CR);
  const [simAdditionalDays, setSimAdditionalDays] = useState<number>(PAYMENT_TERMS_SIMULATION_DEFAULT_CREDIT_DAYS);

  // Procucev standard linear calculation verification (Prompt 448 Section B & C)
  const standardRatePercent = (PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS * 100).toFixed(1);
  const simFinancingBenefitCr = Number((simSpendCr * PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS *
    (simAdditionalDays / STANDARD_CREDIT_INTERVAL_DAYS)).toFixed(4));
  const simWcReleasedCr = Number(((simSpendCr / DAYS_IN_STANDARD_YEAR) * simAdditionalDays).toFixed(4));

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
          {UI_STRINGS.module2.paymentTerms.scenarioDisclaimer}{' '}
          {UI_STRINGS.module2.paymentTerms.scenarioRateNote(standardRatePercent, STANDARD_CREDIT_INTERVAL_DAYS)}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
              {UI_STRINGS.module2.paymentTerms.scenarioEligibleSpendLabel}
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
              {UI_STRINGS.module2.paymentTerms.scenarioAdditionalCreditDaysLabel}
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
              {PAYMENT_TERMS_SIMULATION_CREDIT_DAY_OPTIONS.map((days) => (
                <option value={days} key={days}>
                  {UI_STRINGS.module2.paymentTerms.scenarioAdditionalDaysOption(days)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              {UI_STRINGS.module2.paymentTerms.scenarioFinancingBenefitLabel}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857', marginTop: '2px' }}>
              {UI_STRINGS.common.croreAmount(simFinancingBenefitCr.toFixed(4))}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              {UI_STRINGS.module2.paymentTerms.scenarioFinancingFormula(
                simAdditionalDays,
                standardRatePercent,
                STANDARD_CREDIT_INTERVAL_DAYS
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              {UI_STRINGS.module2.paymentTerms.scenarioWorkingCapitalReleasedLabel}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
              {UI_STRINGS.common.croreAmount(simWcReleasedCr.toFixed(4))}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              {UI_STRINGS.module2.paymentTerms.scenarioWorkingCapitalFormula(simAdditionalDays, DAYS_IN_STANDARD_YEAR)}
            </div>
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
            {UI_STRINGS.module2.paymentTerms.unavailableOpportunitySummary(
              coverageSummary.overallStatusDisplayText,
              UI_STRINGS.common.croreAmount(coverageSummary.totalSpendAnalysedCr.toFixed(4)),
              coverageSummary.totalRecordsCount.toLocaleString()
            )}
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
              {UI_STRINGS.module2.paymentTerms.opportunitiesHeading(filteredOpps.length)}
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
                <th style={{ padding: '10px 16px' }}>{UI_STRINGS.module2.paymentTerms.opportunityHeaders.supplier}</th>
                <th style={{ padding: '10px 16px' }}>{UI_STRINGS.module2.paymentTerms.opportunityHeaders.category}</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                  {UI_STRINGS.module2.paymentTerms.opportunityHeaders.annualSpend}
                </th>
                <th style={{ padding: '10px 16px' }}>{UI_STRINGS.module2.paymentTerms.opportunityHeaders.currentTerms}</th>
                <th style={{ padding: '10px 16px' }}>{UI_STRINGS.module2.paymentTerms.opportunityHeaders.targetTerms}</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                  {UI_STRINGS.module2.paymentTerms.opportunityHeaders.extension}
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                  {UI_STRINGS.module2.paymentTerms.opportunityHeaders.financingBenefit}
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                  {UI_STRINGS.module2.paymentTerms.opportunityHeaders.workingCapitalReleased}
                </th>
                <th style={{ padding: '10px 16px' }}>{UI_STRINGS.module2.paymentTerms.opportunityHeaders.status}</th>
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
                    {UI_STRINGS.common.croreAmount(o.annualSpendCr.toFixed(4))}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#334155' }}>
                    {UI_STRINGS.module2.paymentTerms.currentTermsWithCreditDays(o.currentPaymentTerms, o.currentCreditDays)}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#047857', fontWeight: 600 }}>{o.targetPaymentTerms}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>
                    {UI_STRINGS.module2.paymentTerms.additionalCreditDays(o.additionalCreditDays)}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#047857', fontWeight: 600 }}>
                    {UI_STRINGS.common.croreAmount(o.indicativeAnnualFinancingBenefitCr.toFixed(4))}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>
                    {UI_STRINGS.common.croreAmount(o.indicativeWorkingCapitalReleasedCr.toFixed(4))}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#166534' }}>
                      {UI_STRINGS.module2.paymentTerms.availabilityLabels[o.availabilityStatus]}
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
