/**
 * Module 2 — Lever 4: Volume Aggregation Primary View Component
 * Compliant with Rule 7, 8, 9, 11, 15, max 300 lines, cyclomatic complexity <= 10
 */

import React, { useEffect, useState, useCallback } from 'react';
import type {
  VolumeAggregationResult,
  VolumeAggregationTab,
  VolumeAggregationViewProps
} from '../../types/module2VolumeAggregation';
import { UI_STRINGS } from '../../constants/uiStrings';
import { VOLUME_AGGREGATION_EXPORT_ENDPOINT } from '../../constants/module2VolumeAggregation';
import { loadVolumeAggregation } from '../../utils/volumeAggregationApi';
import { VolumeAggregationOverviewTab } from './VolumeAggregationOverviewTab';
import { VolumeAggregationPlantTab } from './VolumeAggregationPlantTab';
import { VolumeAggregationMaterialTab } from './VolumeAggregationMaterialTab';
import { VolumeAggregationTransactionTab } from './VolumeAggregationTransactionTab';
import { VolumeAggregationPoConsolidationTab } from './VolumeAggregationPoConsolidationTab';
import { useLatestRequestSequence } from '../../utils/useLatestRequestSequence';

export const VolumeAggregationView: React.FC<VolumeAggregationViewProps> = ({
  assessmentId,
  onBackToOverview
}) => {
  const [data, setData] = useState<VolumeAggregationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VolumeAggregationTab>('overview');
  const { beginRequest, isCurrentRequest, invalidateRequests } = useLatestRequestSequence();

  const fetchData = useCallback(async () => {
    const requestId = beginRequest();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await loadVolumeAggregation(assessmentId);
      if (!isCurrentRequest(requestId)) return;
      setData(result);
    } catch (err: unknown) {
      if (!isCurrentRequest(requestId)) return;
      setError(err instanceof Error ? err.message : UI_STRINGS.module2.volumeAggregation.unexpectedFailure);
    } finally {
      if (isCurrentRequest(requestId)) setLoading(false);
    }
  }, [assessmentId, beginRequest, isCurrentRequest]);

  useEffect(() => {
    void fetchData();
    return invalidateRequests;
  }, [fetchData, invalidateRequests]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          {UI_STRINGS.module2.volumeAggregation.loadingText}
        </div>
        <div style={{ fontSize: '13px' }}>{UI_STRINGS.module2.volumeAggregation.loadingDescription}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: '24px',
          margin: '24px 0',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b'
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
          {UI_STRINGS.module2.volumeAggregation.errorTitle}
        </div>
        <div style={{ fontSize: '13px', marginBottom: '12px' }}>
          {error || UI_STRINGS.module2.volumeAggregation.unexpectedFailure}
        </div>
        <button
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
          {UI_STRINGS.module2.volumeAggregation.retry}
        </button>
      </div>
    );
  }

  const cov = data.coverageSummary;
  const exportQuery = new URLSearchParams({ assessmentId: data.assessmentId });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          {onBackToOverview && (
            <button
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
              {UI_STRINGS.module2.volumeAggregation.backToOverview}
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {UI_STRINGS.module2.volumeAggregation.title}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {UI_STRINGS.module2.volumeAggregation.subtitle}
          </p>
        </div>

        {/* Declarative Virtual DOM Excel Download (Rule 15 Compliant) */}
        <a
          href={`${VOLUME_AGGREGATION_EXPORT_ENDPOINT}?${exportQuery.toString()}`}
          download={`Volume_Aggregation_${data.assessmentId}.xlsx`}
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
          📊 {UI_STRINGS.module2.volumeAggregation.exportButton}
        </a>
      </div>

      {/* 5 KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px'
        }}
      >
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.volumeAggregation.totalIncurredSpend}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {UI_STRINGS.common.croreAmount(cov.totalIncurredSpendCr.toFixed(4))}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {cov.grossMaterialSpendCr
              ? UI_STRINGS.module2.volumeAggregation.grossSpend(
                UI_STRINGS.common.croreAmount(cov.grossMaterialSpendCr.toFixed(4))
              )
              : UI_STRINGS.module2.volumeAggregation.transactionCount(cov.totalTransactionsCount.toLocaleString())}
            {cov.unmatchedAdjustmentsCount > 0
              ? UI_STRINGS.module2.volumeAggregation.adjustmentSpend(
                UI_STRINGS.common.croreAmount((cov.unmatchedAdjustmentsSpendInr / 10000000).toFixed(4))
              )
              : ''}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.volumeAggregation.genuineOpportunities}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            {UI_STRINGS.common.croreAmount(
              (cov.genuineOpportunitySpendCr ?? cov.potentiallyAggregatableSpendCr).toFixed(4)
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {UI_STRINGS.module2.volumeAggregation.genuineOpportunityCount(
              cov.genuineOpportunitiesCount || cov.genuineTier1OpportunitiesCount || cov.tier1IdenticalCount
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.volumeAggregation.uomCompatibleSpend}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
            {UI_STRINGS.common.croreAmount(
              (cov.uomCompatibleSpendCr ?? cov.eligiblePhysicalAggregationSpendCr ?? cov.totalIncurredSpendCr).toFixed(4)
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
            {UI_STRINGS.module2.volumeAggregation.limitedHistorySpend(
              UI_STRINGS.common.croreAmount((cov.limitedHistorySpendCr ?? cov.singleIsolatedPurchaseSpendCr).toFixed(4))
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.volumeAggregation.excludedPhysical}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>
            {UI_STRINGS.common.croreAmount(
              (cov.excludedPhysicalAggregationSpendCr ?? cov.uomIncompatibleSpendCr).toFixed(4)
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px' }}>
            {UI_STRINGS.module2.volumeAggregation.unresolvedUomCount(
              cov.excludedUnresolvedUomCount ?? cov.uomIncompatibleCount
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {UI_STRINGS.module2.volumeAggregation.savingsStatus}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#475569', marginTop: '6px' }}>
            {UI_STRINGS.module2.volumeAggregation.savingsStatusValue}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {UI_STRINGS.module2.volumeAggregation.savingsStatusSub}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
        {(
          [
            { id: 'overview', label: UI_STRINGS.module2.volumeAggregation.tabOverview },
            { id: 'plants', label: UI_STRINGS.module2.volumeAggregation.tabPlants },
            { id: 'materials', label: UI_STRINGS.module2.volumeAggregation.tabMaterials },
            { id: 'transactions', label: UI_STRINGS.module2.volumeAggregation.tabTransactions },
            { id: 'poConsolidation', label: UI_STRINGS.module2.volumeAggregation.tabPoConsolidation }
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #2563eb' : '2px solid transparent',
              background: 'none',
              color: activeTab === t.id ? '#1d4ed8' : '#64748b',
              fontWeight: activeTab === t.id ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <VolumeAggregationOverviewTab
          tier1={data.tier1Opportunities}
          tier2={data.tier2Opportunities}
          tier3={data.tier3Opportunities}
        />
      )}
      {activeTab === 'plants' && <VolumeAggregationPlantTab plantProfiles={data.plantProfiles} />}
      {activeTab === 'materials' && <VolumeAggregationMaterialTab materialProfiles={data.materialProfiles} />}
      {activeTab === 'transactions' && <VolumeAggregationTransactionTab transactions={data.transactions} />}
      {activeTab === 'poConsolidation' && (
        <VolumeAggregationPoConsolidationTab transactions={data.transactions} />
      )}
    </div>
  );
};
