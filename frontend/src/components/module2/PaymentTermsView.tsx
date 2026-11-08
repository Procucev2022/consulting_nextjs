'use client';
import { apiFetch } from '../../utils/apiFetch';

import React, { useState, useEffect, useCallback } from 'react';
import type { PaymentTermsResult, PaymentTermsViewProps } from '../../types/module2PaymentTerms';
import {
  API_REQUEST_ID_HEADER,
  assessmentIdQuerySchema,
  ERROR_CATEGORIES,
  PAYMENT_TERMS_ENDPOINT,
  paymentTermsResponseSchema,
  UI_STRINGS
} from '../../constants';
import { createClientRequestId } from '../../utils/requestId';
import { logger } from '../../utils/logger';
import { PaymentTermsCoverageTab } from './PaymentTermsCoverageTab';
import { PaymentTermsOpportunitiesTab } from './PaymentTermsOpportunitiesTab';
import { PaymentTermsSupplierTab } from './PaymentTermsSupplierTab';
import { PaymentTermsKpiHeader } from './PaymentTermsKpiHeader';
import { useLatestRequestSequence } from '../../utils/useLatestRequestSequence';

export const PaymentTermsView: React.FC<PaymentTermsViewProps> = ({
  assessmentId,
  onBackToOverview
}) => {
  const [data, setData] = useState<PaymentTermsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coverage' | 'opportunities' | 'suppliers'>('coverage');
  const { beginRequest, isCurrentRequest, invalidateRequests } = useLatestRequestSequence();

  const fetchData = useCallback(async () => {
    const requestSequence = beginRequest();
    const clientRequestId = createClientRequestId();
    setLoading(true);
    setError(null);
    setData(null);
    let response: Response | null = null;
    let invalidAssessment = false;
    try {
      const parsedAssessment = assessmentIdQuerySchema.safeParse({ assessmentId });
      if (!parsedAssessment.success) {
        invalidAssessment = true;
        throw parsedAssessment.error;
      }
      const query = new URLSearchParams(parsedAssessment.data);
      const path = `${PAYMENT_TERMS_ENDPOINT}?${query.toString()}`;
      const res = await apiFetch(path, { headers: { [API_REQUEST_ID_HEADER]: clientRequestId } });
      response = res;
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: unknown = await res.json();
      if (!isCurrentRequest(requestSequence)) return;
      const parsedPayload = paymentTermsResponseSchema.safeParse(json);
      if (!parsedPayload.success) {
        const payloadMessage = typeof json === 'object' && json !== null && !Array.isArray(json)
          ? (json as Record<string, unknown>).message
          : undefined;
        const detail = typeof payloadMessage === 'string' && payloadMessage.trim()
          ? payloadMessage
          : UI_STRINGS.module2.paymentTerms.invalidResponseDetail;
        throw new Error(detail);
      }
      setData(parsedPayload.data.data);
    } catch (err: unknown) {
      if (!isCurrentRequest(requestSequence)) return;
      const requestId = response?.headers.get(API_REQUEST_ID_HEADER) || clientRequestId;
      const errorDetail = invalidAssessment
        ? UI_STRINGS.module2.paymentTerms.missingAssessment
        : err instanceof Error ? err.message : String(err);
      const statusCode = response?.status ?? 0;
      const errorCategory = invalidAssessment
        ? ERROR_CATEGORIES.VALIDATION_ERROR
        : response === null
        ? ERROR_CATEGORIES.NETWORK_ERROR
        : statusCode === 401 || statusCode === 403
          ? ERROR_CATEGORIES.AUTH_ERROR
          : statusCode === 404
            ? ERROR_CATEGORIES.NOT_FOUND_ERROR
            : statusCode === 429
              ? ERROR_CATEGORIES.RATE_LIMIT_ERROR
              : statusCode >= 400 && statusCode < 500
                ? ERROR_CATEGORIES.VALIDATION_ERROR
                : ERROR_CATEGORIES.SERVER_ERROR;
      const paymentTermsStrings = UI_STRINGS.module2.paymentTerms;
      const message = invalidAssessment
        ? paymentTermsStrings.missingAssessment
        : response === null
        ? paymentTermsStrings.networkFailure(errorDetail, requestId)
        : !response.ok
          ? paymentTermsStrings.httpFailure(statusCode, requestId)
          : paymentTermsStrings.responseFailure(errorDetail, requestId);
      const context = {
        action: 'module2.payment-terms.load',
        method: 'GET',
        path: PAYMENT_TERMS_ENDPOINT,
        assessmentId: invalidAssessment ? undefined : assessmentId.trim(),
        statusCode,
        requestId,
        errorCategory
      };
      if (invalidAssessment) {
        logger.warn('Payment Terms analysis request rejected before fetch', context, err);
      } else {
        logger.error('Payment Terms analysis request failed', context, err);
      }
      setError(message);
    } finally {
      if (isCurrentRequest(requestSequence)) setLoading(false);
    }
  }, [assessmentId, beginRequest, isCurrentRequest]);

  useEffect(() => {
    void fetchData();
    return invalidateRequests;
  }, [fetchData, invalidateRequests]);

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{UI_STRINGS.module2.paymentTerms.loadingText}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '14px' }}>
          {UI_STRINGS.module2.paymentTerms.errorTitle}
        </div>
        <p style={{ margin: '8px 0', fontSize: '13px', color: '#b91c1c' }}>
          {error || UI_STRINGS.module2.paymentTerms.unexpectedFailure(UI_STRINGS.common.notAvailable)}
        </p>
        <button
          type="button"
          onClick={fetchData}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          {UI_STRINGS.module2.paymentTerms.retry}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0 0 6px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {UI_STRINGS.module2.paymentTerms.backToOverview}
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {UI_STRINGS.module2.paymentTerms.title}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {UI_STRINGS.module2.paymentTerms.subtitle}
          </p>
        </div>

        {/* Declarative Virtual DOM Excel Download */}
        <a
          href={`/api/module2/sourcing/payment-terms/export-excel?assessmentId=${assessmentId}`}
          download={`Payment_Terms_${assessmentId}.xlsx`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#047857',
            color: '#ffffff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          📊 {UI_STRINGS.module2.paymentTerms.exportButton}
        </a>
      </div>

      {/* Payment Terms KPI Cards, Explicit Disclosure & Planning Scenario */}
      <PaymentTermsKpiHeader coverageSummary={data.coverageSummary} />

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
        {(
          [
            { id: 'coverage', label: UI_STRINGS.module2.paymentTerms.tabCoverage },
            { id: 'opportunities', label: UI_STRINGS.module2.paymentTerms.tabOpportunities },
            { id: 'suppliers', label: UI_STRINGS.module2.paymentTerms.tabSuppliers }
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            data-testid={`payment-terms-tab-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #2563eb' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === t.id ? '#2563eb' : '#64748b',
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'coverage' && <PaymentTermsCoverageTab coverageSummary={data.coverageSummary} />}
      {activeTab === 'opportunities' && (
        <PaymentTermsOpportunitiesTab
          opportunities={data.opportunities}
          coverageSummary={data.coverageSummary}
        />
      )}
      {activeTab === 'suppliers' && (
        <PaymentTermsSupplierTab
          supplierProfiles={data.supplierProfiles}
          coverageRecords={data.coverageRecords}
        />
      )}
    </div>
  );
};
