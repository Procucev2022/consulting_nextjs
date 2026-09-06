'use client';
import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Database,
  Search,
  Filter,
  Layers,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  DollarSign,
  GitMerge,
  Calendar,
  TrendingUp,
  Tag,
  Boxes,
  Package,
  Wrench,
  Truck,
  Building2,
  Receipt,
  Scale,
  Settings,
  PlusCircle,
  FileText,
  Globe,
  ChevronDown,
  ChevronUp,
  Award,
  ListOrdered,
  TrendingDown,
  Minus,
  Eye,
  ArrowUpRight,
  X,
  BarChart3,
  Maximize2,
  Zap
} from 'lucide-react';
import { RawDocumentIngestion, ValidationPreCheckRecord, CategoryYearDetail, VendorYearDetail, TenantMaster } from '../types';
import { categoryYearWiseDetails, vendorYearWiseDetails } from '../data/mockData';
import { ClientIngestionSetupModal, DatasetType } from './modals/ClientIngestionSetupModal';
import { CategoryTopItemsModal } from './modals/CategoryTopItemsModal';
import { VendorTopItemsModal } from './modals/VendorTopItemsModal';
import { yahooFinanceFXRates } from '../utils/currencyConverter';

interface Module1IngestionProps {
  tenant: TenantMaster;
  onUpdateTenant: (tenant: TenantMaster) => void;
  ingestionQueue: RawDocumentIngestion[];
  validationRecords: ValidationPreCheckRecord[];
  onFixCurrency: (record: ValidationPreCheckRecord) => void;
  onMergeVendor: (record: ValidationPreCheckRecord) => void;
  onApplyBlanketFixes?: () => void;
  onResetValidationRecords?: () => void;
  onRunAICategorization: () => void;
  onAddBatchUpload: (file: File, datasetType: DatasetType) => void;
}

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
  onAddBatchUpload
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [filterIssue, setFilterIssue] = useState<string>('ALL');
  const [selectedYearView, setSelectedYearView] = useState<'ALL' | 'FY24' | 'FY25' | 'FY26'>('ALL');
  const [breakdownMode, setBreakdownMode] = useState<'CATEGORY' | 'VENDOR'>('CATEGORY');
  const [isBalanceExpanded, setIsBalanceExpanded] = useState<boolean>(false);
  const [isVendorBalanceExpanded, setIsVendorBalanceExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryYearDetail | null>(categoryYearWiseDetails[0]);
  const [selectedVendor, setSelectedVendor] = useState<VendorYearDetail | null>(vendorYearWiseDetails[0]);
  const [isTopItemsModalOpen, setIsTopItemsModalOpen] = useState<boolean>(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);

  // Client & File Details Pop-up State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [activeDatasetType, setActiveDatasetType] = useState<DatasetType>('Purchase History');
  const [spendPeriod, setSpendPeriod] = useState<string>('36 Months (FY24 - FY26: 1 Apr 2023 - 31 Mar 2026)');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onAddBatchUpload(e.dataTransfer.files[0], activeDatasetType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
  }) => {
    onUpdateTenant({
      ...tenant,
      enterprise_name: config.clientName,
      base_currency: config.currency,
      region: config.region,
      total_spend_evaluated: config.estimatedSpend,
      total_spend_evaluated_inr: Number((config.estimatedSpend * 83.8 / 10000000).toFixed(2))
    });
    setActiveDatasetType(config.datasetType);
    setSpendPeriod(config.spendPeriod);
    setIsSetupModalOpen(false);

    // Trigger file picker right after setup confirmation
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 250);
  };

  const filteredRecords = validationRecords.filter((rec) => {
    if (filterIssue === 'ALL') return true;
    if (filterIssue === 'NEEDS_ACTION') return !rec.resolved;
    if (filterIssue === 'CLEAN') return rec.resolved;
    return rec.issue_flag === filterIssue;
  });

  const totalEvaluatedSpendInrCr = categoryYearWiseDetails.reduce(
    (sum, item) => sum + item.total_3yr_spend_inr_cr,
    0
  );

  const allResolvedCount = validationRecords.filter((r) => r.resolved || r.issue_flag === 'Passed Clean').length;
  const pendingActionsCount = validationRecords.filter((r) => !r.resolved && r.issue_flag !== 'Passed Clean').length;
  const totalValidationCount = validationRecords.length;

  // Calculate sum of spend for pending unresolved records that are excluded from finalized analytics
  const pendingIssuesSpendCr = Number(
    validationRecords
      .filter((r) => !r.resolved && r.issue_flag !== 'Passed Clean')
      .reduce((sum, r) => {
        const qty = r.order_quantity || (r.amount > 10000 ? 1000 : 100);
        const price = r.net_price || (r.amount / qty);
        const fx = r.fx_rate_applied || 83.8;
        const itemCr = r.inr_crores || ((qty * price * fx) / 10000000);
        return sum + itemCr;
      }, 0)
      .toFixed(2)
  );

  const validatedSpendInrCr = Number((totalEvaluatedSpendInrCr - pendingIssuesSpendCr).toFixed(2));
  const dataQualityIndex = totalValidationCount > 0 ? Number(((allResolvedCount / totalValidationCount) * 100).toFixed(1)) : 100;

  // Sort categories by current selected spend view descending (highest spend category first)
  const sortedCategories = [...categoryYearWiseDetails].sort((a, b) => {
    if (a.is_balance_category) return 1;
    if (b.is_balance_category) return -1;
    const aSpend =
      selectedYearView === 'FY24'
        ? a.spend_fy24_cr || a.spend_inr_2023_cr
        : selectedYearView === 'FY25'
        ? a.spend_fy25_cr || a.spend_inr_2024_cr
        : selectedYearView === 'FY26'
        ? a.spend_fy26_cr || a.spend_inr_2025_26_cr
        : a.total_3yr_spend_inr_cr;
    const bSpend =
      selectedYearView === 'FY24'
        ? b.spend_fy24_cr || b.spend_inr_2023_cr
        : selectedYearView === 'FY25'
        ? b.spend_fy25_cr || b.spend_inr_2024_cr
        : selectedYearView === 'FY26'
        ? b.spend_fy26_cr || b.spend_inr_2025_26_cr
        : b.total_3yr_spend_inr_cr;
    return bSpend - aSpend;
  });

  // Sort vendors by current selected spend view descending (highest spend vendor first)
  const sortedVendors = [...vendorYearWiseDetails].sort((a, b) => {
    if (a.is_balance_vendor) return 1;
    if (b.is_balance_vendor) return -1;
    const aSpend =
      selectedYearView === 'FY24'
        ? a.spend_fy24_cr
        : selectedYearView === 'FY25'
        ? a.spend_fy25_cr
        : selectedYearView === 'FY26'
        ? a.spend_fy26_cr
        : a.total_3yr_spend_inr_cr;
    const bSpend =
      selectedYearView === 'FY24'
        ? b.spend_fy24_cr
        : selectedYearView === 'FY25'
        ? b.spend_fy25_cr
        : selectedYearView === 'FY26'
        ? b.spend_fy26_cr
        : b.total_3yr_spend_inr_cr;
    return bSpend - aSpend;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/40 border border-sky-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
              Module 1: Document Ingestion & Multi-Currency ETL
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 inline" />
              <span>Multi-Currency FX Engine Active</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            3-Year Multi-Currency Ingestion & FX Normalization
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Ingests multiple foreign currencies (USD, EUR, GBP, AED, JPY, SGD), applies historical <strong>time-series FX conversion rates</strong>, and normalizes all spend into <strong>INR in Crores (₹ Cr)</strong>.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleOpenSetupModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-cyan-950 dark:text-white bg-cyan-100 dark:bg-cyan-950 hover:bg-cyan-200 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-700/80 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Settings className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
            <span>Configure Client & Dataset</span>
          </button>
        </div>
      </div>

      {/* Multi-Currency FX Live Tickers & Normalization Ticker Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 shrink-0">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-slate-900 dark:text-white">Live FX Benchmark Conversion Rates to INR:</span>
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

      {/* Active Ingestion Session Metadata Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs glass-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Enterprise Client:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{tenant.enterprise_name}</span>
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Dataset Type:</span>
              <span className={`font-bold px-2 py-0.5 rounded border text-[11px] flex items-center space-x-1 ${
                activeDatasetType === 'Purchase History'
                  ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800'
                  : activeDatasetType === 'Invoice Data'
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                  : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800'
              }`}>
                {activeDatasetType === 'Purchase History' && <FileSpreadsheet className="w-3 h-3" />}
                {activeDatasetType === 'Invoice Data' && <Receipt className="w-3 h-3" />}
                {activeDatasetType === 'Trial Balance' && <Scale className="w-3 h-3" />}
                <span>{activeDatasetType}</span>
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
              Change Details
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Upload Zone + Ingestion Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Drag & Drop Upload Zone (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <UploadCloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Upload {activeDatasetType} (Multi-Currency)</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/40">
                Max 2GB
              </span>
            </div>

            {/* Drop Target Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 hover:border-cyan-500 hover:bg-cyan-50/30 dark:hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload-input"
                className="hidden"
                accept=".csv,.xlsx,.pdf,.xml,.zip"
                onChange={handleFileChange}
              />
              <div className="cursor-pointer block">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Upload {activeDatasetType} for {tenant.enterprise_name.split('(')[0].trim()}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  AI automatically detects USD, EUR, GBP, AED, JPY & converts to <strong>INR in Crores (₹ Cr)</strong>
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSetupModal();
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    Setup Details
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
                  >
                    Select File
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Formats Legend */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1">
              <FileArchive className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>ZIP / PDF OCR</span>
            </span>
            <span className="flex items-center space-x-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>XLSX / CSV</span>
            </span>
            <span className="flex items-center space-x-1">
              <FileCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>XML EDI</span>
            </span>
          </div>
        </div>

        {/* Uploaded File Details & Ingestion Status (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Uploaded Procurement File Details</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified dataset with record count strictly excluding header row
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/50 font-bold">
              ₹{totalEvaluatedSpendInrCr.toFixed(2)} Cr Evaluated
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {ingestionQueue.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
                No file uploaded yet. Click &quot;Select File&quot; or drop your dataset to begin ingestion.
              </div>
            ) : (
              ingestionQueue.map((doc) => (
                <div
                  key={doc.doc_id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block">
                          {doc.file_name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Format: {doc.file_type} • Size: {doc.file_size_mb} MB • Uploaded: {doc.uploaded_at}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                          doc.ocr_status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50 animate-pulse'
                        }`}
                      >
                        {doc.progress}% {doc.ocr_status}
                      </span>
                    </div>
                  </div>

                  {/* Highlighted Total Records & Formula Calculation Box */}
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium uppercase font-mono block">
                          Total Ingested Records (Data Rows):
                        </span>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                            {doc.records_count.toLocaleString()} Records
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Excluding Header Row
                          </span>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-4">
                        <span className="text-[10px] text-slate-400 font-medium uppercase font-mono block">
                          Calculated Total Spend from File:
                        </span>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-lg">
                          ₹{doc.converted_inr_crores?.toFixed(2) || '732.41'} Cr
                        </span>
                      </div>
                    </div>

                    {/* Mathematical Formula Footnote */}
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 font-mono flex items-center justify-between">
                      <span className="text-slate-500">Spend Formula:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        &sum; (Order Quantity &times; Net Price &times; Currency in INR)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-300/50 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        doc.progress === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse'
                      }`}
                      style={{ width: `${doc.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span>Detected Currencies:</span>
                      {(doc.detected_currencies || ['USD', 'EUR', 'INR']).map((c) => (
                        <span key={c} className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-cyan-800 dark:text-cyan-400 font-bold">
                          {c}
                        </span>
                      ))}
                    </div>
                    <span>ID: {doc.doc_id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Post-Upload Spend Summary in INR Crores (₹ Cr) — Categories & Vendors */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-5">
        {/* Header with Perfect Alignment */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-800/80 shrink-0">
                INR in Crores (₹ Cr) Valuation
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {breakdownMode === 'CATEGORY'
                  ? 'Category Spend Breakdown by Fiscal Year (FY24 – FY26)'
                  : 'Vendor Spend Breakdown by Fiscal Year (FY24 – FY26)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fiscal Year: <span className="font-semibold text-slate-700 dark:text-slate-300">1st April to 31st March</span> • Total 3-Yr spend for <strong className="text-slate-800 dark:text-slate-200">{tenant.enterprise_name}</strong>: <strong className="text-emerald-700 dark:text-emerald-400">₹{totalEvaluatedSpendInrCr.toFixed(2)} Crores</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher: By Categories vs By Vendors */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono shrink-0 shadow-xs">
              <button
                onClick={() => setBreakdownMode('CATEGORY')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  breakdownMode === 'CATEGORY'
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>By Categories</span>
              </button>
              <button
                onClick={() => setBreakdownMode('VENDOR')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  breakdownMode === 'VENDOR'
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>By Vendors</span>
              </button>
            </div>

            {/* Fiscal Year Switcher Pills (Horizontal, Single-Line, Pixel Perfect) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono shrink-0 shadow-xs">
              <button
                onClick={() => setSelectedYearView('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedYearView === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All FY (3 Years)
              </button>
              <button
                onClick={() => setSelectedYearView('FY24')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedYearView === 'FY24'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="FY24: 1st April 2023 – 31st March 2024"
              >
                FY24
              </button>
              <button
                onClick={() => setSelectedYearView('FY25')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedYearView === 'FY25'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="FY25: 1st April 2024 – 31st March 2025"
              >
                FY25
              </button>
              <button
                onClick={() => setSelectedYearView('FY26')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedYearView === 'FY26'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="FY26: 1st April 2025 – 31st March 2026"
              >
                FY26
              </button>
            </div>
          </div>
        </div>

        {/* Ranking & View Helper Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
            <span className="font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800 flex items-center space-x-1">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Spend Rank Order:</span>
            </span>
            <span>
              {breakdownMode === 'CATEGORY'
                ? 'Highest spend category first (#1 to #10), followed by itemized Balance Categories'
                : 'Highest spend supplier first (#1 to #10), followed by 42 minor Tail Balance Vendors'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-bold">
            {breakdownMode === 'CATEGORY'
              ? 'UNSPSC Match Engine: 10 Core Segments + 7 Balance Segments'
              : 'Master Vendor Engine: Top 10 Strategic Vendors + 42 Tail Suppliers'}
          </span>
        </div>

        {/* MODE 1: CATEGORY SPEND BREAKDOWN */}
        {breakdownMode === 'CATEGORY' && (
          <div className="space-y-4">
            {/* Top 10 Ranked Category Cards (Clickable Buckets) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {sortedCategories.filter((c) => !c.is_balance_category).slice(0, 10).map((cat, idx) => {
                const currentSpendCr =
                  selectedYearView === 'FY24'
                    ? (cat.spend_fy24_cr || cat.spend_inr_2023_cr)
                    : selectedYearView === 'FY25'
                    ? (cat.spend_fy25_cr || cat.spend_inr_2024_cr)
                    : selectedYearView === 'FY26'
                    ? (cat.spend_fy26_cr || cat.spend_inr_2025_26_cr)
                    : cat.total_3yr_spend_inr_cr;

                const fy24 = cat.spend_fy24_cr || cat.spend_inr_2023_cr;
                const fy25 = cat.spend_fy25_cr || cat.spend_inr_2024_cr;
                const fy26 = cat.spend_fy26_cr || cat.spend_inr_2025_26_cr;

                const sharePct = (
                  (currentSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
                  100
                ).toFixed(1);

                const isSelected = selectedCategory?.category === cat.category;

                return (
                  <button
                    key={cat.id || cat.category}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsTopItemsModalOpen(true);
                    }}
                    className={`p-3.5 rounded-xl text-left border space-y-2.5 transition-all flex flex-col justify-between cursor-pointer focus:outline-none ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-lg bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    {/* Header: Rank Pill & Share % */}
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white dark:text-cyan-300 border border-slate-700 shadow-xs flex items-center space-x-1">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>Rank #{idx + 1}</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          {isSelected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white animate-pulse">
                              Pop-up Ready
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                            {sharePct}% Share
                          </span>
                        </div>
                      </div>

                      {/* Category Title */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[32px] leading-tight" title={cat.category}>
                        {cat.category}
                      </h4>
                    </div>

                    {/* Spend Value in Crores */}
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">
                        {selectedYearView === 'ALL' ? 'Total Evaluated Spend' : `${selectedYearView} Spend`}
                      </span>
                      <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        ₹{currentSpendCr.toFixed(2)} Cr
                      </p>
                    </div>

                    {/* UNSPSC Column L Match Badge */}
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-medium">UNSPSC Col L:</span>
                        <span className="font-mono text-[9px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-200 dark:border-cyan-800">
                          {cat.sample_column_l_code}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate" title={cat.sample_column_l_title}>
                        {cat.sample_column_l_title}
                      </p>
                    </div>

                    {/* Fiscal Year-Wise Micro Breakdown in Crores */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] font-mono space-y-1 w-full">
                      <div className="flex justify-between text-slate-500">
                        <span title="FY24 (1 Apr 2023 - 31 Mar 2024)">FY24: <strong>₹{fy24.toFixed(1)}</strong></span>
                        <span title="FY25 (1 Apr 2024 - 31 Mar 2025)">FY25: <strong>₹{fy25.toFixed(1)}</strong></span>
                        <span title="FY26 (1 Apr 2025 - 31 Mar 2026)">FY26: <strong>₹{fy26.toFixed(1)}</strong></span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-sky-400 h-full" style={{ width: `${(fy24 / cat.total_3yr_spend_inr_cr) * 100}%` }} title="FY24" />
                        <div className="bg-blue-500 h-full" style={{ width: `${(fy25 / cat.total_3yr_spend_inr_cr) * 100}%` }} title="FY25" />
                        <div className="bg-indigo-600 h-full" style={{ width: `${(fy26 / cat.total_3yr_spend_inr_cr) * 100}%` }} title="FY26" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Rank #11: Other Balance Categories Section with Itemized Breakdown */}
            {(() => {
              const balanceCat = sortedCategories.find((c) => c.is_balance_category);
              if (!balanceCat) return null;

              const balSpendCr =
                selectedYearView === 'FY24'
                  ? (balanceCat.spend_fy24_cr || balanceCat.spend_inr_2023_cr)
                  : selectedYearView === 'FY25'
                  ? (balanceCat.spend_fy25_cr || balanceCat.spend_inr_2024_cr)
                  : selectedYearView === 'FY26'
                  ? (balanceCat.spend_fy26_cr || balanceCat.spend_inr_2025_26_cr)
                  : balanceCat.total_3yr_spend_inr_cr;

              const balSharePct = (
                (balSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
                100
              ).toFixed(1);

              return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-mono text-xs font-black shadow-xs">
                        Rank #11
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {balanceCat.category}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {balSharePct}% Total Share
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Aggregated tail spend across 7 minor UNSPSC segments (Laboratory, Janitorial, Office Spares, Security, Telecom, HVAC & Racks).
                        </p>
                      </div>
                    </div>

                    {/* Balance Spend & Expand Button */}
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">
                          {selectedYearView === 'ALL' ? 'Total Balance Spend' : `${selectedYearView} Balance`}
                        </span>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          ₹{balSpendCr.toFixed(2)} Cr
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCategory(balanceCat);
                          setIsTopItemsModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-xl transition-all border border-emerald-300 dark:border-emerald-800 cursor-pointer shadow-xs"
                        title="Open Top Balance Line Items in Pop-up"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Pop-up</span>
                      </button>

                      <button
                        onClick={() => setIsBalanceExpanded(!isBalanceExpanded)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950/80 hover:bg-cyan-200 dark:hover:bg-cyan-900 rounded-xl transition-all border border-cyan-300 dark:border-cyan-800 cursor-pointer"
                      >
                        <span>{isBalanceExpanded ? 'Hide' : 'View'} 7 Balance Categories</span>
                        {isBalanceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Itemized Balance Categories Breakdown Table */}
                  {isBalanceExpanded && balanceCat.balance_items && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">UNSPSC Balance Commodity</th>
                              <th className="py-2.5 px-3">Column L Code</th>
                              <th className="py-2.5 px-3 text-right">Spend (₹ Cr)</th>
                              <th className="py-2.5 px-3 text-right">Spend Share %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                            {balanceCat.balance_items.map((item) => (
                              <tr key={item.column_l_code} className="bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60">
                                <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                                  {item.name}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold">
                                    Col L: {item.column_l_code}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                                  ₹{item.spend_inr_cr.toFixed(2)} Cr
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-500">
                                  {item.share_pct}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* MODE 2: VENDOR SPEND BREAKDOWN */}
        {breakdownMode === 'VENDOR' && (
          <div className="space-y-4">
            {/* Top 10 Ranked Vendor Cards (Clickable Buckets) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {sortedVendors.filter((v) => !v.is_balance_vendor).slice(0, 10).map((vnd, idx) => {
                const currentSpendCr =
                  selectedYearView === 'FY24'
                    ? vnd.spend_fy24_cr
                    : selectedYearView === 'FY25'
                    ? vnd.spend_fy25_cr
                    : selectedYearView === 'FY26'
                    ? vnd.spend_fy26_cr
                    : vnd.total_3yr_spend_inr_cr;

                const fy24 = vnd.spend_fy24_cr;
                const fy25 = vnd.spend_fy25_cr;
                const fy26 = vnd.spend_fy26_cr;

                const sharePct = (
                  (currentSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
                  100
                ).toFixed(1);

                const isSelected = selectedVendor?.vendor_name === vnd.vendor_name;

                return (
                  <button
                    key={vnd.id || vnd.vendor_name}
                    onClick={() => {
                      setSelectedVendor(vnd);
                      setIsVendorModalOpen(true);
                    }}
                    className={`p-3.5 rounded-xl text-left border space-y-2.5 transition-all flex flex-col justify-between cursor-pointer focus:outline-none ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-lg bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    {/* Header: Rank Pill & Share % */}
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white dark:text-cyan-300 border border-slate-700 shadow-xs flex items-center space-x-1">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>Rank #{idx + 1}</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          {isSelected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white animate-pulse">
                              Pop-up Ready
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                            {sharePct}% Share
                          </span>
                        </div>
                      </div>

                      {/* Vendor Name */}
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight flex items-center space-x-1" title={vnd.vendor_name}>
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
                          <span className="truncate">{vnd.vendor_name}</span>
                        </h4>
                        <span className="text-[9px] font-mono text-slate-400 block">
                          ID: {vnd.master_vendor_id}
                        </span>
                      </div>
                    </div>

                    {/* Spend Value in Crores */}
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">
                        {selectedYearView === 'ALL' ? 'Total Evaluated Spend' : `${selectedYearView} Spend`}
                      </span>
                      <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        ₹{currentSpendCr.toFixed(2)} Cr
                      </p>
                    </div>

                    {/* Primary Category & UNSPSC Column L Match Badge */}
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-medium">UNSPSC Col L:</span>
                        <span className="font-mono text-[9px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-200 dark:border-cyan-800">
                          {vnd.sample_column_l_code}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate" title={vnd.primary_category}>
                        {vnd.primary_category}
                      </p>
                    </div>

                    {/* Fiscal Year-Wise Micro Breakdown in Crores */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] font-mono space-y-1 w-full">
                      <div className="flex justify-between text-slate-500">
                        <span title="FY24 (1 Apr 2023 - 31 Mar 2024)">FY24: <strong>₹{fy24.toFixed(1)}</strong></span>
                        <span title="FY25 (1 Apr 2024 - 31 Mar 2025)">FY25: <strong>₹{fy25.toFixed(1)}</strong></span>
                        <span title="FY26 (1 Apr 2025 - 31 Mar 2026)">FY26: <strong>₹{fy26.toFixed(1)}</strong></span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-sky-400 h-full" style={{ width: `${(fy24 / vnd.total_3yr_spend_inr_cr) * 100}%` }} title="FY24" />
                        <div className="bg-blue-500 h-full" style={{ width: `${(fy25 / vnd.total_3yr_spend_inr_cr) * 100}%` }} title="FY25" />
                        <div className="bg-indigo-600 h-full" style={{ width: `${(fy26 / vnd.total_3yr_spend_inr_cr) * 100}%` }} title="FY26" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Rank #11: Other Balance Vendors (42 Tail Suppliers) Section with Itemized Breakdown */}
            {(() => {
              const balanceVnd = sortedVendors.find((v) => v.is_balance_vendor);
              if (!balanceVnd) return null;

              const balSpendCr =
                selectedYearView === 'FY24'
                  ? balanceVnd.spend_fy24_cr
                  : selectedYearView === 'FY25'
                  ? balanceVnd.spend_fy25_cr
                  : selectedYearView === 'FY26'
                  ? balanceVnd.spend_fy26_cr
                  : balanceVnd.total_3yr_spend_inr_cr;

              const balSharePct = (
                (balSpendCr / (selectedYearView === 'ALL' ? totalEvaluatedSpendInrCr : totalEvaluatedSpendInrCr / 3)) *
                100
              ).toFixed(1);

              return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-mono text-xs font-black shadow-xs">
                        Rank #11
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {balanceVnd.vendor_name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {balSharePct}% Total Share
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Aggregated tail spend across 42 minor / niche suppliers (Maersk Line, Crown Paper Box, LyondellBasell, Atlas Copco, Berry Global, Old Dominion, etc.).
                        </p>
                      </div>
                    </div>

                    {/* Balance Spend & Expand Button */}
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">
                          {selectedYearView === 'ALL' ? 'Total Balance Spend' : `${selectedYearView} Balance`}
                        </span>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          ₹{balSpendCr.toFixed(2)} Cr
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedVendor(balanceVnd);
                          setIsVendorModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-xl transition-all border border-emerald-300 dark:border-emerald-800 cursor-pointer shadow-xs"
                        title="Open Top Balance Vendor Items in Pop-up"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Pop-up</span>
                      </button>

                      <button
                        onClick={() => setIsVendorBalanceExpanded(!isVendorBalanceExpanded)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950/80 hover:bg-cyan-200 dark:hover:bg-cyan-900 rounded-xl transition-all border border-cyan-300 dark:border-cyan-800 cursor-pointer"
                      >
                        <span>{isVendorBalanceExpanded ? 'Hide' : 'View'} 7 Balance Suppliers</span>
                        {isVendorBalanceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Itemized Balance Vendors Breakdown Table */}
                  {isVendorBalanceExpanded && balanceVnd.balance_vendors && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Tail Vendor / Supplier Name</th>
                              <th className="py-2.5 px-3">Primary Segment</th>
                              <th className="py-2.5 px-3">UNSPSC Col L</th>
                              <th className="py-2.5 px-3 text-right">3-Yr Spend (₹ Cr)</th>
                              <th className="py-2.5 px-3 text-right">Spend Share %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                            {balanceVnd.balance_vendors.map((item) => (
                              <tr key={item.vendor_name} className="bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60">
                                <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                                  {item.vendor_name}
                                </td>
                                <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                                  {item.category}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold">
                                    {item.column_l_code}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                                  ₹{item.spend_inr_cr.toFixed(2)} Cr
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-500">
                                  {item.share_pct}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Validation & Multi-Currency Pre-Check Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-5">
        {/* Header & Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Multi-Currency Validation & Line Item Pre-Check (FR-ING-03)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Line-item data cleansing pre-flight check. Converts multi-currency items to <strong>Base INR in Crores</strong>, highlights unresolved ETL anomalies, and updates active spend calculations in real time.
            </p>
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setFilterIssue('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterIssue === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Records ({totalValidationCount})
              </button>
              <button
                onClick={() => setFilterIssue('NEEDS_ACTION')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  filterIssue === 'NEEDS_ACTION'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300'
                }`}
              >
                <span>Needs Action ({pendingActionsCount})</span>
                {pendingIssuesSpendCr > 0 && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-900/40 text-amber-200 font-mono">
                    -₹{pendingIssuesSpendCr.toFixed(2)} Cr
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterIssue('CLEAN')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterIssue === 'CLEAN'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300'
                }`}
              >
                Ready & Cleared ({allResolvedCount})
              </button>
            </div>

            {/* Blanket AI Auto-Fix Button */}
            {onApplyBlanketFixes && pendingActionsCount > 0 && (
              <button
                onClick={onApplyBlanketFixes}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 rounded-xl shadow-md shadow-cyan-500/20 transition-all transform active:scale-95 cursor-pointer animate-pulse"
                title="Automatically normalize vendor entities, resolve currency/tax discrepancies, and include all items in spend"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Apply Blanket AI Fixes (Auto-Resolve All)</span>
              </button>
            )}

            {/* Reset Anomaly State (for demonstration & re-testing) */}
            {onResetValidationRecords && pendingActionsCount === 0 && (
              <button
                onClick={onResetValidationRecords}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                title="Reset pre-check records back to initial state with 2 anomalies for testing"
              >
                <span>↺ Reset Anomaly State</span>
              </button>
            )}
          </div>
        </div>

        {/* Spend Reconciliation & Anomaly Impact Strip (4 KPI Metric Boxes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Uploaded File Spend */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                Total File Spend
              </span>
              <Database className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
              ₹{totalEvaluatedSpendInrCr.toFixed(2)} Cr
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              44,530 Raw Records Extracted (100% Target)
            </p>
          </div>

          {/* Card 2: Validated & Included Spend */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                Validated Spend (Active)
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              ₹{validatedSpendInrCr.toFixed(2)} Cr
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-medium">
              {allResolvedCount} of {totalValidationCount} Sample Records Cleared
            </p>
          </div>

          {/* Card 3: Pending Anomalies Spend (Excluded from Final Calculations) */}
          <div className={`p-3.5 rounded-xl border transition-all space-y-1 ${
            pendingIssuesSpendCr > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-mono font-bold ${
                pendingIssuesSpendCr > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-slate-400'
              }`}>
                Pending Issues (Excluded)
              </span>
              <AlertTriangle className={`w-3.5 h-3.5 ${
                pendingIssuesSpendCr > 0 ? 'text-amber-600 dark:text-amber-400 animate-bounce' : 'text-slate-400'
              }`} />
            </div>
            <p className={`text-xl font-black font-mono ${
              pendingIssuesSpendCr > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
            }`}>
              ₹{pendingIssuesSpendCr.toFixed(2)} Cr
            </p>
            <p className={`text-[10px] font-sans font-medium ${
              pendingIssuesSpendCr > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400'
            }`}>
              {pendingActionsCount > 0 ? `${pendingActionsCount} Anomalies Excluded from Analytics` : '0 Exclusions (All Reconciled)'}
            </p>
          </div>

          {/* Card 4: ETL Cleanliness Quality Index */}
          <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-300/80 dark:border-cyan-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-cyan-800 dark:text-cyan-300 font-bold">
                Quality Index
              </span>
              <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-xl font-black font-mono text-cyan-700 dark:text-cyan-400">
              {dataQualityIndex.toFixed(1)}%
            </p>
            <p className="text-[10px] text-cyan-700 dark:text-cyan-300 font-sans font-medium">
              {dataQualityIndex === 100 ? '100% Clean Data Reconciled' : 'Remediation in Progress'}
            </p>
          </div>
        </div>

        {/* Dynamic Spend Notice & Formula Explainer */}
        <div className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs font-mono transition-all ${
          pendingActionsCount > 0
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              pendingActionsCount > 0
                ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
            }`}>
              {pendingActionsCount > 0 ? '⚠️ Data Policy Exclusion Alert' : '✅ ETL Verification Status'}
            </span>
            <span className="font-sans font-medium">
              {pendingActionsCount > 0
                ? `${pendingActionsCount} line items totaling ₹${pendingIssuesSpendCr.toFixed(2)} Cr contain anomalies and are EXCLUDED from final spend calculations until resolved.`
                : `100% of line items verified and normalized under Base INR Crores. Total Validated Spend: ₹${validatedSpendInrCr.toFixed(2)} Cr.`}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
            Spend Formula: <strong>Q &times; P &times; FX Rate</strong>
          </div>
        </div>

        {/* Validation Records Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Record & Year</th>
                  <th className="py-3 px-3">PO & Line Item Description</th>
                  <th className="py-3 px-3">Category & Column L Code</th>
                  <th className="py-3 px-3">Vendor Entity</th>
                  <th className="py-3 px-3 text-right">Order Qty (Q)</th>
                  <th className="py-3 px-3 text-right">Net Price (P)</th>
                  <th className="py-3 px-3 text-right">Currency & FX Rate</th>
                  <th className="py-3 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">Line Spend (₹ Cr)</th>
                  <th className="py-3 px-3">Inclusion & ETL Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {filteredRecords.map((record) => {
                  const qty = record.order_quantity || (record.amount > 10000 ? 1000 : 100);
                  const price = record.net_price || (record.amount / qty);
                  const curr = record.raw_currency || 'USD';
                  const fx = record.fx_rate_applied || 83.8;
                  const totalCr = record.inr_crores || ((qty * price * fx) / 10000000);
                  const isClean = record.issue_flag === 'Passed Clean' || record.resolved;

                  return (
                    <tr
                      key={record.record_id}
                      className={`transition-colors ${
                        isClean
                          ? 'bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          : 'bg-amber-50/60 dark:bg-amber-950/25 border-l-4 border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-900/30'
                      }`}
                    >
                      {/* Record ID & Spend Year */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-cyan-700 dark:text-cyan-400 block">
                          {record.record_id}
                        </span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {record.spend_year || 2024}
                        </span>
                      </td>

                      {/* PO Number & Description */}
                      <td className="py-3 px-3 font-sans max-w-[220px]">
                        <span className="font-mono text-[10px] text-slate-400 block truncate">
                          {record.po_number}
                        </span>
                        <span className="text-slate-900 dark:text-white text-xs font-medium line-clamp-2">
                          {record.raw_desc}
                        </span>
                      </td>

                      {/* Category & Column L */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            record.core_category === 'Packaging Materials'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
                              : record.core_category === 'Direct Materials'
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400'
                              : record.core_category === 'Logistics & Freight'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400'
                          }`}>
                            {record.core_category || 'Direct Materials'}
                          </span>
                        </div>
                        {record.column_l_code && (
                          <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-400 mt-1 inline-block">
                            Col L: {record.column_l_code}
                          </span>
                        )}
                      </td>

                      {/* Vendor Entity */}
                      <td className="py-3 px-3 font-sans font-medium text-slate-700 dark:text-slate-200">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{record.vendor_name}</span>
                        </div>
                      </td>

                      {/* Order Quantity */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {qty.toLocaleString()}
                      </td>

                      {/* Net Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {curr} {price.toFixed(2)}
                      </td>

                      {/* FX Rate */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-cyan-700 dark:text-cyan-400 block">
                          ₹{fx.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          1 {curr}
                        </span>
                      </td>

                      {/* Line Spend in Crores */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          ₹{totalCr.toFixed(2)} Cr
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {qty}&times;{price.toFixed(0)}&times;{fx.toFixed(1)}
                        </span>
                      </td>

                      {/* Inclusion & ETL Issue Flag */}
                      <td className="py-3 px-3 font-sans">
                        {isClean ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Passed Clean</span>
                            </span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">
                              Active in Spend (₹{totalCr.toFixed(2)} Cr)
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/40 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{record.issue_flag}</span>
                            </span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">
                              ⚠️ Excluded until resolved
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-3 text-right">
                        {record.issue_flag === 'Missing Currency Code' && !record.resolved && (
                          <button
                            onClick={() => onFixCurrency(record)}
                            className="px-2.5 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            Fix (INR)
                          </button>
                        )}
                        {record.issue_flag === 'Unmapped Supplier Name' && !record.resolved && (
                          <button
                            onClick={() => onMergeVendor(record)}
                            className="px-2.5 py-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            Merge Vendor
                          </button>
                        )}
                        {isClean && (
                          <span className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/40 rounded-lg inline-block">
                            Ready
                          </span>
                        )}
                        {record.issue_flag === 'Tax Discrepancy' && !record.resolved && (
                          <button
                            onClick={() => onFixCurrency(record)}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-300 dark:border-slate-600 cursor-pointer"
                          >
                            Recalc FX
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Run AI Categorization Engine CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ready to trigger Public & Enterprise QUA AI UNSPSC Taxonomy Engine (INR Base)</span>
          </div>
          <button
            onClick={onRunAICategorization}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 group cursor-pointer"
          >
            <span>Run AI Categorization Engine</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Top 10 Line Items & 3-Year Price Trend Pop-up Modal */}
      <CategoryTopItemsModal
        category={selectedCategory}
        isOpen={isTopItemsModalOpen}
        onClose={() => setIsTopItemsModalOpen(false)}
        totalEvaluatedSpendInrCr={totalEvaluatedSpendInrCr}
      />

      {/* Vendor Top Line Items & 3-Year Price Trend Pop-up Modal */}
      <VendorTopItemsModal
        vendor={selectedVendor}
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        totalEvaluatedSpendInrCr={totalEvaluatedSpendInrCr}
      />

      {/* Client & Dataset Ingestion Setup Popup */}
      <ClientIngestionSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        currentTenant={tenant}
        onConfirmAndUpload={handleConfirmSetup}
      />
    </div>
  );
};
