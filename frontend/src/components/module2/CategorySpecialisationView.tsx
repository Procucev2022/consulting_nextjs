'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CategorySpecialisationResult } from '../../types/module2CategorySpecialisation';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../constants/module2CategorySpecialisation';
import { CategorySpecialisationOverviewTab } from './CategorySpecialisationOverviewTab';
import { CategorySpecialisationCategoriesTab } from './CategorySpecialisationCategoriesTab';
import { CategorySpecialisationOpportunitiesTab } from './CategorySpecialisationOpportunitiesTab';
import { CategorySpecialisationOverlapTab } from './CategorySpecialisationOverlapTab';

interface CategorySpecialisationViewProps {
  assessmentId: string;
  onBackToOverview?: () => void;
}

export const CategorySpecialisationView: React.FC<CategorySpecialisationViewProps> = ({
  assessmentId,
  onBackToOverview
}) => {
  const [data, setData] = useState<CategorySpecialisationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'opportunities' | 'overlaps'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/module2/sourcing/category-specialisation?assessmentId=${encodeURIComponent(assessmentId)}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch Lever 6 Category Specialisation analysis (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || 'Invalid API response payload');
      }
      setData(json.data);
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

  const handleSelectCategoryFromOverview = (catName: string) => {
    setSelectedCategory(catName);
    setActiveTab('categories');
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>Analyzing procurement categories and opportunity heads...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '14px' }}>Unable to load Category Specialisation analysis</div>
        <p style={{ margin: '8px 0', fontSize: '13px', color: '#b91c1c' }}>{error || 'No data returned.'}</p>
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
          Retry Analysis
        </button>
      </div>
    );
  }

  const sum = data.summary;

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
              ← Back to Levers Overview
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.TITLE}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.SUBTITLE}
          </p>
        </div>

        {/* Declarative Excel Download */}
        <a
          href={`/api/module2/sourcing/category-specialisation/export-excel?assessmentId=${assessmentId}`}
          download={`Category_Specialisation_${assessmentId}.xlsx`}
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
          📊 {CATEGORY_SPECIALISATION_UI_STRINGS.EXPORT_BUTTON}
        </a>
      </div>

      {/* Mandatory Planning Disclaimer Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#1e40af',
          fontWeight: 600
        }}
      >
        <span>ℹ️ {data.generalDisclaimer}</span>
      </div>

      {/* 5 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.KPI_TOTAL_SPEND_ASSESSED}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            ₹{sum.totalProcurementSpendCr.toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Full portfolio transaction baseline
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.KPI_CATEGORIES_ASSESSED}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {sum.categoriesAssessedCount} Categories
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {sum.priorityACount} Strategic | {sum.priorityBCount} Optimisation | {sum.priorityCCount} Routine
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.KPI_GROSS_OPPORTUNITY}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
            ₹{sum.grossTentativeOpportunityBaseCr.toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Range: ₹{sum.grossTentativeOpportunityLowCr.toFixed(2)} – ₹{sum.grossTentativeOpportunityHighCr.toFixed(2)} Cr
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#047857', fontWeight: 500 }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.KPI_NET_OPPORTUNITY}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#065f46', marginTop: '4px' }}>
            ₹{sum.netIndicativeOpportunityBaseCr.toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
            Range: ₹{sum.netIndicativeOpportunityLowCr.toFixed(2)} – ₹{sum.netIndicativeOpportunityHighCr.toFixed(2)} Cr
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.KPI_OVERLAP_REVIEW}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#92400e', marginTop: '4px' }}>
            ₹{sum.overlapReviewAmountCr.toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
            {sum.opportunitiesRequiringOverlapReviewCount} items excluded from Net
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '8px' }}>
        {[
          { id: 'overview', label: CATEGORY_SPECIALISATION_UI_STRINGS.TAB_OVERVIEW },
          { id: 'categories', label: CATEGORY_SPECIALISATION_UI_STRINGS.TAB_CATEGORIES },
          { id: 'opportunities', label: CATEGORY_SPECIALISATION_UI_STRINGS.TAB_OPPORTUNITIES },
          { id: 'overlaps', label: CATEGORY_SPECIALISATION_UI_STRINGS.TAB_OVERLAPS }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`category-specialisation-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === tab.id ? '#2563eb' : '#64748b',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <CategorySpecialisationOverviewTab data={data} onSelectCategory={handleSelectCategoryFromOverview} />
      )}
      {activeTab === 'categories' && (
        <CategorySpecialisationCategoriesTab
          categories={data.categories}
          initialSelectedCategory={selectedCategory}
        />
      )}
      {activeTab === 'opportunities' && (
        <CategorySpecialisationOpportunitiesTab data={data} />
      )}
      {activeTab === 'overlaps' && (
        <CategorySpecialisationOverlapTab overlapItems={data.overlapItems} />
      )}

      {/* Governance & Methodology Disclosures */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
          {CATEGORY_SPECIALISATION_UI_STRINGS.GOVERNANCE_DISCLOSURE_TITLE}
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
          {data.methodologyDisclosures.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
