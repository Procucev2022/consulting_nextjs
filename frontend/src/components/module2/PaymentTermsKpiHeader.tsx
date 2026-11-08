'use client';

import React from 'react';
import type { PaymentTermsKpiHeaderProps } from '../../types/module2PaymentTerms';
import { UI_STRINGS } from '../../constants/uiStrings';

export const PaymentTermsKpiHeader: React.FC<PaymentTermsKpiHeaderProps> = ({ coverageSummary: cov }) => {
  const isDataUnavailable = cov.overallDataAvailabilityStatus === 'DATA_UNAVAILABLE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="payment-terms-kpi-header">
      {/* Explicit Business Disclosure Banner when Payment Terms Data Unavailable */}
      {isDataUnavailable && (
        <div
          data-testid="payment-terms-data-unavailable-disclosure"
          style={{
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#92400e', letterSpacing: '0.05em' }}>
            {UI_STRINGS.module2.paymentTerms.benefitCannotBeAscertainedTitle}
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '20px' }}>
            {UI_STRINGS.module2.paymentTerms.benefitCannotBeAscertainedMessage}
          </p>
        </div>
      )}

      {/* 5 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.paymentTerms.kpiTotalSpendAnalysed}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            ₹{cov.totalSpendAnalysedCr.toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {UI_STRINGS.module2.paymentTerms.transactionsAnalysed(cov.totalRecordsCount.toLocaleString())}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.paymentTerms.kpiDataAvailabilityStatus}
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              marginTop: '6px',
              color: isDataUnavailable ? '#b45309' : '#047857'
            }}
          >
            {isDataUnavailable ? UI_STRINGS.module2.paymentTerms.actualCreditDaysUnavailable : cov.overallStatusDisplayText}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {UI_STRINGS.module2.paymentTerms.verifiedAndMissingPercentages(
              cov.verifiedSpendPct.toFixed(1),
              cov.missingSpendPct.toFixed(1)
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.paymentTerms.kpiVerifiedSpend}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
            ₹{cov.verifiedSpendCr.toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
            {UI_STRINGS.module2.paymentTerms.verifiedRecords(cov.completeRecordsCount.toLocaleString())}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {isDataUnavailable
              ? UI_STRINGS.module2.paymentTerms.actualWorkingCapitalBenefitLabel
              : UI_STRINGS.module2.paymentTerms.kpiWorkingCapitalReleased}
          </div>
          <div
            style={{
              fontSize: isDataUnavailable ? '11px' : '20px',
              fontWeight: 700,
              color: isDataUnavailable ? '#b45309' : '#2563eb',
              marginTop: '4px',
              lineHeight: '16px'
            }}
          >
            {isDataUnavailable
              ? UI_STRINGS.module2.paymentTerms.actualWorkingCapitalBenefitUnavailable
              : `₹${cov.totalWorkingCapitalReleasedCr.toFixed(4)} Cr`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {isDataUnavailable
              ? UI_STRINGS.module2.paymentTerms.commerciallyValidatedZero
              : UI_STRINGS.module2.paymentTerms.segregatedFromFinancingBenefits}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {isDataUnavailable
              ? UI_STRINGS.module2.paymentTerms.actualAnnualFinancingBenefitLabel
              : UI_STRINGS.module2.paymentTerms.kpiFinancingBenefit}
          </div>
          <div
            style={{
              fontSize: isDataUnavailable ? '11px' : '20px',
              fontWeight: 700,
              color: isDataUnavailable ? '#b45309' : '#0f172a',
              marginTop: '4px',
              lineHeight: '16px'
            }}
          >
            {isDataUnavailable
              ? UI_STRINGS.module2.paymentTerms.actualFinancingBenefitUnavailable
              : `₹${cov.totalFinancingBenefitCr.toFixed(4)} Cr`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {isDataUnavailable
              ? UI_STRINGS.module2.paymentTerms.additionalCreditDaysUnavailable
              : UI_STRINGS.module2.paymentTerms.kpiFinancingBenefitSub}
          </div>
        </div>
      </div>

      {/* Illustrative Planning Scenario Callout */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
            {UI_STRINGS.module2.paymentTerms.planningScenarioTitle}
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>
            {UI_STRINGS.module2.paymentTerms.planningScenarioMetrics(
              ((cov.totalSpendAnalysedCr / 365) * 30).toFixed(4),
              (cov.totalSpendAnalysedCr * 0.015).toFixed(4)
            )}
          </div>
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#1e3a8a', lineHeight: '16px', fontStyle: 'italic' }}>
          {UI_STRINGS.module2.paymentTerms.planningScenarioDisclaimer}
        </p>
      </div>
    </div>
  );
};
