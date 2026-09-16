'use client';
import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  Settings,
  Globe,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import type {
  Module1IngestionProps,
  DatasetType
} from '../types';
import { ClientIngestionSetupModal } from './modals/ClientIngestionSetupModal';
import { DocumentSummaryView } from './DocumentSummaryView';
import { ParetoSpendHierarchySection } from './ParetoSpendHierarchySection';
import { ValidationPreCheckSection } from './ValidationPreCheckSection';
import { IngestionUploadSection } from './IngestionUploadSection';
import { yahooFinanceFXRates } from '../utils/currencyConverter';
import { UI_STRINGS } from '../constants';

export const Module1Ingestion: React.FC<Module1IngestionProps> = ({
  tenant,
  onUpdateTenant,
  ingestionQueue,
  validationRecords,
  onFixCurrency,
  onMergeVendor,
  onApplyBlanketFixes,
  onResetValidationRecords,
  onRunAICategorization,
  onAddBatchUpload,
  materialGroupSummaries,
  plantSummaries,
  monthWiseSummaries,
  uniqueItemsCount,
  uniqueVendorsCount,
  onMergeItem,
  onDeleteDocument,
  isDataRefreshed,
  paretoSpendData,
  onRefreshWithFixes,
  currentTier = 'GOLD',
  onUpgrade,
  ...restProps
}: Module1IngestionProps & { rawUploadRecords?: any[] }) => {
  const rawUploadRecords = (restProps as any).rawUploadRecords;
  const hasActiveData = (ingestionQueue && ingestionQueue.length > 0) || (validationRecords && validationRecords.length > 0) || Boolean(rawUploadRecords && rawUploadRecords.length > 0) || Boolean(isDataRefreshed);
  const [dragActive, setDragActive] = useState(false);

  // Client & File Details Pop-up State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [activeDatasetType, setActiveDatasetType] = useState<DatasetType>('Purchase History');
  const [spendPeriod, setSpendPeriod] = useState<string>('36 Months (FY24 - FY26: 1 Apr 2023 - 31 Mar 2026)');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalEvaluatedSpendInrCr = ingestionQueue?.[0]?.converted_inr_crores ?? (tenant.total_spend_evaluated_inr ?? 0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      onAddBatchUpload(e.dataTransfer.files[0], activeDatasetType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onAddBatchUpload(e.target.files[0], activeDatasetType);
    }
  };

  const handleOpenSetupModal = () => {
    setIsSetupModalOpen(true);
  };

  const handleConfirmSetup = (config: {
    clientName: string;
    datasetType: DatasetType;
    spendPeriod: string;
    currency: 'INR' | 'USD' | 'EUR' | 'GBP';
    region: 'NA' | 'EU' | 'APAC' | 'GLOBAL';
    estimatedSpend: number;
    majorSector?: string;
    minorSector?: string;
  }) => {
    onUpdateTenant({
      ...tenant,
      enterprise_name: config.clientName,
      base_currency: config.currency,
      region: config.region,
      total_spend_evaluated: config.estimatedSpend,
      total_spend_evaluated_inr: Number(((config.estimatedSpend * 83.8) / 10000000).toFixed(2)),
      major_sector: config.majorSector || tenant.major_sector,
      minor_sector: config.minorSector || tenant.minor_sector
    });
    setActiveDatasetType(config.datasetType);
    setSpendPeriod(config.spendPeriod);
    setIsSetupModalOpen(false);

    // Trigger file picker right after setup confirmation
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 250);
  };

  const handleUpgradeToSilver = () => {
    if (onUpgrade) {
      onUpgrade('SILVER');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/40 border border-sky-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
              {UI_STRINGS.module1.badge}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 inline" />
              <span>{UI_STRINGS.module1.multiCurrencyActive}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {UI_STRINGS.module1.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {UI_STRINGS.module1.description}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleOpenSetupModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-cyan-950 dark:text-white bg-cyan-100 dark:bg-cyan-950 hover:bg-cyan-200 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-700/80 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Settings className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
            <span>{UI_STRINGS.module1.configureClientDataset}</span>
          </button>
        </div>
      </div>

      {/* Live FX Rates Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 shrink-0">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-slate-900 dark:text-white">{UI_STRINGS.module1.liveFxRatesLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] overflow-x-auto">
          {Object.entries(yahooFinanceFXRates)
            .filter(([k]) => k !== 'INR')
            .map(([curr, fx]) => (
              <span
                key={curr}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center space-x-1.5"
                title={`${fx.name} conversion rate`}
              >
                <span className="font-bold text-cyan-700 dark:text-cyan-400">{curr}/INR:</span>
                <span className="font-black text-slate-900 dark:text-white">₹{fx.currentRate.toFixed(2)}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Ingestion Meta Dashboard Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">{UI_STRINGS.module1.activeTenant}</span>
            <span className="font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/60">
              {tenant?.enterprise_name || 'Global Chemicals Corp.'}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">{UI_STRINGS.module1.industrySector}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {tenant?.major_sector || 'Chemical & Petrochemicals'} - {tenant?.minor_sector || 'Specialty Chemicals'}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Dataset Type:</span>
            <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
              {activeDatasetType}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Evaluation Window:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{spendPeriod}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Reporting Base:</span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
              INR in Crores (₹ Cr)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleOpenSetupModal}
            className="text-xs text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 font-bold underline"
          >
            {UI_STRINGS.module1.changeDetails}
          </button>
        </div>
      </div>

      {/* Upload Dropzone and Ingestion File Queue Section */}
      <IngestionUploadSection
        tenant={tenant}
        activeDatasetType={activeDatasetType}
        ingestionQueue={ingestionQueue}
        dragActive={dragActive}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        totalEvaluatedSpendInrCr={totalEvaluatedSpendInrCr}
        onOpenSetupModal={handleOpenSetupModal}
        onDeleteDocument={onDeleteDocument}
      />

      {hasActiveData ? (
        <>
          {/* Bronze Tier Savings Availability Summary Card */}
          {currentTier === 'BRONZE' && (
            <div
              data-testid="bronze-savings-availability-summary"
              className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-sky-950/40 border border-emerald-500/40 shadow-xl backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                      {UI_STRINGS.subscription.savingsAvailableHeading}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span>{UI_STRINGS.subscription.savingsAvailableYes}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    {UI_STRINGS.subscription.savingsAvailableYesDesc}
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={handleUpgradeToSilver}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 border border-cyan-300/40 transition-all active:scale-95 cursor-pointer"
                  >
                    {UI_STRINGS.subscription.upgradeToSilver}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Document Summary Component */}
          <DocumentSummaryView
            tenant={tenant}
            ingestionQueue={ingestionQueue}
            materialGroupSummaries={materialGroupSummaries}
            plantSummaries={plantSummaries}
            monthWiseSummaries={monthWiseSummaries}
            uniqueItemsCount={uniqueItemsCount}
            uniqueVendorsCount={uniqueVendorsCount}
            isDataRefreshed={isDataRefreshed}
            onNavigateToCategorization={onRunAICategorization}
          />

          {/* 80% Pareto Spend Hierarchy Section (Excel Pivot Breakdown) */}
          <ParetoSpendHierarchySection
            vendorHierarchy={paretoSpendData?.vendorHierarchy}
            itemHierarchy={paretoSpendData?.itemHierarchy}
            totalSpendCr={paretoSpendData?.totalSpendCr}
          />

          {/* Ingestion Validation & Remediation Log (Extracted Pre-Check Component) */}
          <ValidationPreCheckSection
            validationRecords={validationRecords}
            onFixCurrency={onFixCurrency}
            onMergeVendor={onMergeVendor}
            onMergeItem={onMergeItem}
            onApplyBlanketFixes={onApplyBlanketFixes}
            onResetValidationRecords={onResetValidationRecords}
            onRunAICategorization={onRunAICategorization}
            isDataRefreshed={isDataRefreshed}
            onRefreshWithFixes={onRefreshWithFixes}
          />
        </>
      ) : (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-3 glass-card">
          <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Awaiting Procurement Dataset Ingestion
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Upload your historical purchase orders, invoices, or ERP spend file (Excel/CSV) above to automatically generate real-time spend dimensions, 80/20 Pareto hierarchies, and multi-currency FX normalization.
          </p>
        </div>
      )}

      {/* Pop-up Modal for Client & File Ingestion Setup */}
      <ClientIngestionSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        currentTenant={tenant}
        onConfirmAndUpload={handleConfirmSetup}
      />
    </div>
  );
};
