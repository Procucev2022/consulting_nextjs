/**
 * Module 2 — Lever 4: Volume Aggregation Primary View Component
 * Compliant with Rule 7, 8, 9, 11, 15, max 300 lines, cyclomatic complexity <= 10
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { VolumeAggregationResult } from '../../types/module2VolumeAggregation';
import { VOLUME_AGGREGATION_UI_STRINGS } from '../../constants/module2VolumeAggregation';
import { VolumeAggregationOverviewTab } from './VolumeAggregationOverviewTab';
import { VolumeAggregationPlantTab } from './VolumeAggregationPlantTab';
import { VolumeAggregationMaterialTab } from './VolumeAggregationMaterialTab';
import { VolumeAggregationTransactionTab } from './VolumeAggregationTransactionTab';
import { VolumeAggregationPoConsolidationTab } from './VolumeAggregationPoConsolidationTab';

interface VolumeAggregationViewProps {
  assessmentId: string;
  onBackToOverview?: () => void;
}

export const VolumeAggregationView: React.FC<VolumeAggregationViewProps> = ({
  assessmentId,
  onBackToOverview
}) => {
  const [data, setData] = useState<VolumeAggregationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'plants' | 'materials' | 'transactions' | 'poConsolidation'
  >('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/module2/sourcing/volume-aggregation?assessmentId=${assessmentId}`);
      if (!res.ok) {
        throw new Error(`Failed to load Volume Aggregation analysis (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Invalid server response structure');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          {VOLUME_AGGREGATION_UI_STRINGS.LOADING_TEXT}
        </div>
        <div style={{ fontSize: '13px' }}>Evaluating cross-plant demand pooling and UOM compatibility...</div>
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
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Analysis Load Failed</div>
        <div style={{ fontSize: '13px', marginBottom: '12px' }}>{error || 'Unable to load dataset.'}</div>
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
          Retry Analysis
        </button>
      </div>
    );
  }

  const cov = data.coverageSummary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
      {/* Header */}
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
              ← Back to Levers Overview
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {VOLUME_AGGREGATION_UI_STRINGS.TITLE}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {VOLUME_AGGREGATION_UI_STRINGS.SUBTITLE}
          </p>
        </div>

        {/* Declarative Virtual DOM Excel Download (Rule 15 Compliant) */}
        <a
          href={`/api/module2/sourcing/volume-aggregation/export-excel?assessmentId=${assessmentId}`}
          download={`Volume_Aggregation_${assessmentId}.xlsx`}
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
          📊 {VOLUME_AGGREGATION_UI_STRINGS.EXPORT_BUTTON}
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
            {VOLUME_AGGREGATION_UI_STRINGS.KPI_TOTAL_INCURRED_SPEND}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            ₹{cov.totalIncurredSpendCr.toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {cov.grossMaterialSpendCr ? `Gross: ₹${cov.grossMaterialSpendCr.toFixed(4)} Cr` : `${cov.totalTransactionsCount.toLocaleString()} txs`}
            {cov.unmatchedAdjustmentsCount > 0 ? ` (Adj: ₹${(cov.unmatchedAdjustmentsSpendInr / 10000000).toFixed(4)} Cr)` : ''}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {VOLUME_AGGREGATION_UI_STRINGS.KPI_GENUINE_OPPORTUNITIES}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            ₹{(cov.genuineOpportunitySpendCr ?? cov.potentiallyAggregatableSpendCr).toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {cov.genuineOpportunitiesCount || cov.genuineTier1OpportunitiesCount || cov.tier1IdenticalCount} genuine multi-plant opportunities
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {VOLUME_AGGREGATION_UI_STRINGS.KPI_UOM_COMPATIBLE}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
            ₹{(cov.uomCompatibleSpendCr ?? cov.eligiblePhysicalAggregationSpendCr ?? cov.totalIncurredSpendCr).toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
            Includes ₹{(cov.limitedHistorySpendCr ?? cov.singleIsolatedPurchaseSpendCr).toFixed(4)} Cr limited history
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {VOLUME_AGGREGATION_UI_STRINGS.KPI_EXCLUDED_PHYSICAL}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>
            ₹{(cov.excludedPhysicalAggregationSpendCr ?? cov.uomIncompatibleSpendCr).toFixed(4)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px' }}>
            {cov.excludedUnresolvedUomCount ?? cov.uomIncompatibleCount} records (Ambiguous UOM)
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {VOLUME_AGGREGATION_UI_STRINGS.KPI_SAVINGS_STATUS}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#475569', marginTop: '6px' }}>
            {VOLUME_AGGREGATION_UI_STRINGS.SAVINGS_STATUS_VALUE}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {VOLUME_AGGREGATION_UI_STRINGS.SAVINGS_STATUS_SUB}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
        {(
          [
            { id: 'overview', label: VOLUME_AGGREGATION_UI_STRINGS.TAB_OVERVIEW },
            { id: 'plants', label: VOLUME_AGGREGATION_UI_STRINGS.TAB_PLANTS },
            { id: 'materials', label: VOLUME_AGGREGATION_UI_STRINGS.TAB_MATERIALS },
            { id: 'transactions', label: VOLUME_AGGREGATION_UI_STRINGS.TAB_TRANSACTIONS },
            { id: 'poConsolidation', label: VOLUME_AGGREGATION_UI_STRINGS.TAB_PO_CONSOLIDATION }
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

      {/* Tab Content */}
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
