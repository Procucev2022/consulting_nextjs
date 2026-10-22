'use client';

import React from 'react';
import type { PaymentTermsKpiHeaderProps } from '../../types/module2PaymentTerms';
import { PAYMENT_TERMS_UI_STRINGS } from '../../constants/module2PaymentTerms';

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
            {PAYMENT_TERMS_UI_STRINGS.BENEFIT_CANNOT_BE_ASCERTAINED_TITLE}
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '20px' }}>
            {PAYMENT_TERMS_UI_STRINGS.BENEFIT_CANNOT_BE_ASCERTAINED_MESSAGE}
          </p>
        </div>
      )}

      {/* 5 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {PAYMENT_TERMS_UI_STRINGS.KPI_TOTAL_SPEND_ANALYSED}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            ₹{cov.totalSpendAnalysedCr.toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {cov.totalRecordsCount.toLocaleString()} transactions analysed
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {PAYMENT_TERMS_UI_STRINGS.KPI_DATA_AVAILABILITY_STATUS}
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              marginTop: '6px',
              color: isDataUnavailable ? '#b45309' : '#047857'
            }}
          >
            {isDataUnavailable ? 'DATA UNAVAILABLE' : cov.overallStatusDisplayText}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {cov.verifiedSpendPct.toFixed(1)}% verified | {cov.missingSpendPct.toFixed(1)}% missing
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {PAYMENT_TERMS_UI_STRINGS.KPI_VERIFIED_SPEND}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
            ₹{cov.verifiedSpendCr.toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
            {cov.completeRecordsCount.toLocaleString()} verified records
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {isDataUnavailable ? 'Actual Working Capital Benefit' : PAYMENT_TERMS_UI_STRINGS.KPI_WORKING_CAPITAL_RELEASED}
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
              ? PAYMENT_TERMS_UI_STRINGS.ACTUAL_WC_BENEFIT_UNAVAILABLE
              : `₹${cov.totalWorkingCapitalReleasedCr.toFixed(4)} Cr`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {isDataUnavailable ? 'Commercially validated: ₹0' : 'Segregated from financing benefits'}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {isDataUnavailable ? 'Actual Annual Financing Benefit' : PAYMENT_TERMS_UI_STRINGS.KPI_FINANCING_BENEFIT}
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
              ? PAYMENT_TERMS_UI_STRINGS.ACTUAL_FINANCING_BENEFIT_UNAVAILABLE
              : `₹${cov.totalFinancingBenefitCr.toFixed(4)} Cr`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {isDataUnavailable
              ? 'Additional credit days: DATA UNAVAILABLE'
              : PAYMENT_TERMS_UI_STRINGS.KPI_FINANCING_BENEFIT_SUB}
          </div>
        </div>
      </div>

      {/* Illustrative Planning Scenario Callout */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
            {PAYMENT_TERMS_UI_STRINGS.PLANNING_SCENARIO_TITLE}
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>
            Indicative WC: ₹{((cov.totalSpendAnalysedCr / 365) * 30).toFixed(4)} Cr | Financing: ₹{(cov.totalSpendAnalysedCr * 0.015).toFixed(4)} Cr
          </div>
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#1e3a8a', lineHeight: '16px', fontStyle: 'italic' }}>
          {PAYMENT_TERMS_UI_STRINGS.PLANNING_SCENARIO_DISCLAIMER}
        </p>
      </div>
    </div>
  );
};
