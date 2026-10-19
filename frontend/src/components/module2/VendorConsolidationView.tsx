'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw, AlertCircle, Download, ArrowLeft, Users, ShieldAlert,
  Layers, Package, Factory, Clock
} from 'lucide-react';
import type {
  VendorConsolidationResult,
  CategoryConsolidationProfile,
  SameMaterialOpportunity
} from '../../types/module2VendorConsolidation';
import { UI_STRINGS } from '../../constants';
import { Module2StrategicSourcingApi } from '../../utils/module2StrategicSourcingApi';
import { VendorConsolidationKpiCards } from './VendorConsolidationKpiCards';
import { VendorConsolidationCategoryTable } from './VendorConsolidationCategoryTable';
import { VendorConsolidationSupplierTable } from './VendorConsolidationSupplierTable';
import { VendorConsolidationMaterialTable } from './VendorConsolidationMaterialTable';
import { VendorConsolidationTransactionTable } from './VendorConsolidationTransactionTable';
import { VendorConsolidationMappingQueueTable } from './VendorConsolidationMappingQueueTable';

export interface VendorConsolidationViewProps {
  assessmentId: string;
  onBackToOverview?: () => void;
}

export type DimensionType = 'UNSPSC' | 'SOURCE_GROUP' | 'MATERIALS' | 'MAPPING_QUEUE';

export const VendorConsolidationView: React.FC<VendorConsolidationViewProps> = ({
  assessmentId,
  onBackToOverview
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const [result, setResult] = useState<VendorConsolidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeDimension, setActiveDimension] = useState<DimensionType>('UNSPSC');
  const [drillDownLevel, setDrillDownLevel] = useState<'CATEGORIES' | 'SUPPLIERS' | 'MATERIALS' | 'TRANSACTIONS'>('CATEGORIES');
  const [selectedCategory, setSelectedCategory] = useState<CategoryConsolidationProfile | null>(null);
  const [selectedMaterialOpp, setSelectedMaterialOpp] = useState<SameMaterialOpportunity | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await Module2StrategicSourcingApi.getVendorConsolidation(assessmentId);
      if (data) {
        setResult(data);
      } else {
        setErrorMessage('Failed to load Vendor Base Consolidation data.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown evaluation error');
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectCategory = (category: CategoryConsolidationProfile) => {
    setSelectedCategory(category);
    setDrillDownLevel('SUPPLIERS');
  };

  const excelUrl = Module2StrategicSourcingApi.getVendorConsolidationExcelDownloadUrl(assessmentId);

  return (
    <div className="space-y-6" data-testid="vendor-consolidation-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
              {strings.badge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              UNSPSC TAXONOMY &rarr; SUPPLIER FRAGMENTATION &rarr; REALLOCATION
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{strings.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            {strings.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{strings.btnBackToOverview}</span>
            </button>
          )}

          <a
            href={excelUrl}
            download
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{strings.btnDownloadExcel}</span>
          </a>

          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">{strings.certificationNotice}</div>
          <div className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
            {strings.disclaimer}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
          <RotateCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Evaluating Lever 3 Vendor Consolidation Baseline...</span>
        </div>
      )}

      {errorMessage && !isLoading && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {result && !isLoading && (
        <>
          {/* KPI Summary Cards & Coverage Waterfall */}
          <VendorConsolidationKpiCards result={result} />

          {/* Dimension Switcher Navigation */}
          {drillDownLevel === 'CATEGORIES' && (
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveDimension('UNSPSC')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeDimension === 'UNSPSC'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>UNSPSC Hierarchy (Primary)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {result.categories.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDimension('SOURCE_GROUP')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeDimension === 'SOURCE_GROUP'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Client SAP Groups</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {result.sourceGroupCategories?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDimension('MATERIALS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeDimension === 'MATERIALS'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Material Opportunities</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {result.sameMaterialOpportunities.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDimension('MAPPING_QUEUE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeDimension === 'MAPPING_QUEUE'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mapping Exceptions Queue</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {result.mappingExceptions?.length || 0}
                </span>
              </button>
            </div>
          )}

          {/* Active Dimension Content */}
          {drillDownLevel === 'CATEGORIES' && activeDimension === 'UNSPSC' && (
            <VendorConsolidationCategoryTable
              categories={result.categories}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {drillDownLevel === 'CATEGORIES' && activeDimension === 'SOURCE_GROUP' && (
            <VendorConsolidationCategoryTable
              categories={result.sourceGroupCategories || []}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {drillDownLevel === 'CATEGORIES' && activeDimension === 'MATERIALS' && (
            <VendorConsolidationMaterialTable
              categoryName="All Enterprise Categories"
              sameMaterialOpportunities={result.sameMaterialOpportunities}
              comparableOpportunities={result.comparableMaterialOpportunities}
              crossPlantOpportunities={result.crossPlantOpportunities}
              onBackToSuppliers={() => setActiveDimension('UNSPSC')}
              onSelectMaterialTransactions={(opp) => { setSelectedMaterialOpp(opp); setDrillDownLevel('TRANSACTIONS'); }}
            />
          )}

          {drillDownLevel === 'CATEGORIES' && activeDimension === 'MAPPING_QUEUE' && (
            <VendorConsolidationMappingQueueTable
              exceptions={result.mappingExceptions || []}
              onMappingUpdated={fetchData}
            />
          )}

          {drillDownLevel === 'SUPPLIERS' && selectedCategory && (
            <VendorConsolidationSupplierTable
              category={selectedCategory}
              onBackToCategories={() => setDrillDownLevel('CATEGORIES')}
              onSelectSupplierMaterials={() => setDrillDownLevel('MATERIALS')}
            />
          )}

          {drillDownLevel === 'MATERIALS' && selectedCategory && (
            <VendorConsolidationMaterialTable
              categoryName={selectedCategory.spendCategory}
              sameMaterialOpportunities={result.sameMaterialOpportunities.filter(
                (m) => m.spendCategory === selectedCategory.spendCategory
              )}
              comparableOpportunities={result.comparableMaterialOpportunities.filter(
                (c) => c.categoryCode === selectedCategory.spendCategory
              )}
              crossPlantOpportunities={result.crossPlantOpportunities.filter(
                (p) => p.spendCategory === selectedCategory.spendCategory
              )}
              onBackToSuppliers={() => setDrillDownLevel('SUPPLIERS')}
              onSelectMaterialTransactions={(opp) => { setSelectedMaterialOpp(opp); setDrillDownLevel('TRANSACTIONS'); }}
            />
          )}

          {drillDownLevel === 'TRANSACTIONS' && selectedMaterialOpp && (
            <VendorConsolidationTransactionTable
              opportunity={selectedMaterialOpp}
              onBackToMaterials={() => setDrillDownLevel(selectedCategory ? 'MATERIALS' : 'CATEGORIES')}
            />
          )}
        </>
      )}
    </div>
  );
};
