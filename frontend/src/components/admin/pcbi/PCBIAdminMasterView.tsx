'use client';

/**
 * PCBI Master Admin Main Interface Container
 * ADMIN -> PCBI MASTER -> (Dashboard, Upload, Validate, Preview, Import, Version History, Published Versions)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  UploadCloud,
  CheckCircle2,
  Table,
  Layers,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { pcbiAdminApi } from '../../../utils/pcbiAdminApi';
import { validatePCBIUpload } from '../../../utils/pcbiValidator';
import frontendLogger from '../../../utils/logger';
import { PCBIDashboardTab } from './PCBIDashboardTab';
import { PCBIUploadTab } from './PCBIUploadTab';
import { PCBIValidateTab } from './PCBIValidateTab';
import { PCBIPreviewTab } from './PCBIPreviewTab';
import { PCBIImportTab } from './PCBIImportTab';
import { PCBIVersionsTab } from './PCBIVersionsTab';
import { PCBIPublishModal } from './PCBIPublishModal';
import { PCBIBreadcrumb } from './PCBIBreadcrumb';
import { PCBIModuleWarningBanner } from './PCBIModuleWarningBanner';
import type {
  PCBIWorksheetDetection,
  PCBIColumnMapping,
  PCBIColumnMappingStatus,
  PCBIValidationSummary,
  PCBIImportResult,
  PCBIVersionRecord,
  PCBIWorksheetType
} from '../../../types/pcbiAdmin';

export type PCBISubTab =
  | 'DASHBOARD'
  | 'UPLOAD'
  | 'VALIDATE'
  | 'PREVIEW'
  | 'IMPORT'
  | 'VERSIONS'
  | 'PUBLISHED';

export const PCBIAdminMasterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PCBISubTab>('DASHBOARD');
  const [versions, setVersions] = useState<PCBIVersionRecord[]>([]);
  const [activeVersion, setActiveVersion] = useState<PCBIVersionRecord | null>(null);

  // File Upload & Staging State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<{
    name: string;
    sizeMb: number;
    uploadDate: string;
    uploadedBy: string;
    worksheetCount: number;
    totalRecords: number;
  } | null>(null);

  const [worksheets, setWorksheets] = useState<PCBIWorksheetDetection[]>([]);
  const [datasets, setDatasets] = useState<Record<string, Record<string, unknown>[]>>({});
  const [mappings, setMappings] = useState<Record<string, PCBIColumnMapping[]>>({});
  const [validationSummary, setValidationSummary] = useState<PCBIValidationSummary | null>(null);
  const [importResult, setImportResult] = useState<PCBIImportResult | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Load Versions List
  const loadVersions = useCallback(async () => {
    try {
      const res = await pcbiAdminApi.getVersions();
      if (res.success && Array.isArray(res.versions)) {
        setVersions(res.versions);
        const active = res.versions.find((v) => v.status === 'PUBLISHED') || res.versions[0] || null;
        setActiveVersion(active);
      }
    } catch (err: unknown) {
      frontendLogger.error('Failed to load PCBI versions', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Handle Upload
  const handleFileUpload = (
    file: File,
    ws: PCBIWorksheetDetection[],
    ds: Record<string, Record<string, unknown>[]>,
    maps: Record<string, PCBIColumnMapping[]>
  ): void => {
    setUploadedFile(file);
    setWorksheets(ws);
    setDatasets(ds);
    setMappings(maps);

    const totalRows = Object.values(ds).reduce((acc, curr) => acc + curr.length, 0);

    setFileMetadata({
      name: file.name,
      sizeMb: file.size / (1024 * 1024),
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Sriman Admin',
      worksheetCount: ws.length,
      totalRecords: totalRows
    });

    const summary = validatePCBIUpload(ds, maps);
    setValidationSummary(summary);
    setImportResult(null);
  };

  // Handle Overrides
  const handleOverrideWorksheet = (sheetName: string, newType: PCBIWorksheetType): void => {
    setWorksheets((prev) =>
      prev.map((w) => (w.sheetName === sheetName ? { ...w, userOverride: newType, detectedType: newType } : w))
    );
  };

  const handleOverrideColumnMapping = (sheetType: string, excelCol: string, mappedField: string): void => {
    setMappings((prev) => {
      const currentList = prev[sheetType] || [];
      const updated: PCBIColumnMapping[] = currentList.map((m) =>
        m.excelColumn === excelCol
          ? { ...m, mappedField, status: (mappedField ? 'MAPPED' : 'OPTIONAL') as PCBIColumnMappingStatus }
          : m
      );
      const newMappings: Record<string, PCBIColumnMapping[]> = { ...prev, [sheetType]: updated };
      setValidationSummary(validatePCBIUpload(datasets, newMappings));
      return newMappings;
    });
  };

  // Execute Import
  const handleExecuteImport = async (): Promise<void> => {
    if (!validationSummary || !fileMetadata) return;

    try {
      setIsImporting(true);

      // Compute next version: find highest existing version number and increment
      const existingNumbers = versions
        .map((v) => parseInt(v.version.replace(/[^0-9]/g, ''), 10))
        .filter((n) => !isNaN(n));
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      const nextVersion = `V${nextNumber}.0`;

      const payload = {
        version: nextVersion,
        file_name: fileMetadata.name,
        file_size_mb: fileMetadata.sizeMb,
        uploaded_by: fileMetadata.uploadedBy,
        worksheets,
        mappings,
        benchmarks: datasets.PCBI_MASTER || [],
        weeklyIndices: datasets.WEEKLY_INDEX || [],
        constituents: datasets.CONSTITUENTS || [],
        sources: datasets.SOURCES || [],
        unspscMappings: datasets.UNSPSC_MAPPING || [],
        validationSummary
      };

      const result = await pcbiAdminApi.importMaster(payload);
      setImportResult(result);
      await loadVersions();
      // Auto-navigate to IMPORT tab to show the Import Summary
      setActiveTab('IMPORT');
    } catch (err: unknown) {
      frontendLogger.error('Failed to execute PCBI master import', {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsImporting(false);
    }
  };


  // Confirm Publish
  const handleConfirmPublish = async (): Promise<void> => {
    const targetVer = importResult?.version || activeVersion?.version;
    if (!targetVer) return;

    try {
      setIsPublishing(true);
      await pcbiAdminApi.publishVersion(targetVer, 'Sriman Admin');
      await loadVersions();
      setIsPublishModalOpen(false);
      setActiveTab('PUBLISHED');
    } catch (err: unknown) {
      frontendLogger.error('Failed to publish PCBI version', {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation (Part P) */}
      <PCBIBreadcrumb
        items={[
          { label: 'Admin', href: '/admin/pcbi' },
          { label: 'PCBI Master', isCurrent: true }
        ]}
      />

      {/* Part D Clear User Warning for PCBI Master */}
      <PCBIModuleWarningBanner moduleContext="PCBI_MASTER" />

      {/* Top Banner & Header */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono">
              {UI_STRINGS.pcbiAdmin.sectionTitle}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {UI_STRINGS.pcbiAdmin.title}
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            {UI_STRINGS.pcbiAdmin.subtitle}
          </p>
        </div>

        {/* Prominent Upload Button (Part Q: Explicit Label) */}
        <button
          type="button"
          onClick={() => setActiveTab('UPLOAD')}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95 shrink-0"
        >
          <UploadCloud size={16} />
          <span>Upload / Update Master</span>
        </button>
      </div>

      {/* Workflow Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'DASHBOARD', label: UI_STRINGS.pcbiAdmin.tabDashboard, icon: Database },
          { key: 'UPLOAD', label: UI_STRINGS.pcbiAdmin.tabUpload, icon: UploadCloud },
          { key: 'VALIDATE', label: UI_STRINGS.pcbiAdmin.tabValidate, icon: FileCheck },
          { key: 'PREVIEW', label: UI_STRINGS.pcbiAdmin.tabPreview, icon: Table },
          { key: 'IMPORT', label: UI_STRINGS.pcbiAdmin.tabImport, icon: CheckCircle2 },
          { key: 'VERSIONS', label: UI_STRINGS.pcbiAdmin.tabVersionHistory, icon: Layers },
          { key: 'PUBLISHED', label: UI_STRINGS.pcbiAdmin.tabPublishedVersions, icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as PCBISubTab)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Views */}
      {activeTab === 'DASHBOARD' && (
        <PCBIDashboardTab
          activeVersion={activeVersion}
          onNavigateToUpload={() => setActiveTab('UPLOAD')}
          onNavigateToVersions={() => setActiveTab('VERSIONS')}
        />
      )}

      {activeTab === 'UPLOAD' && (
        <PCBIUploadTab
          uploadedFile={uploadedFile}
          fileMetadata={fileMetadata}
          worksheets={worksheets}
          mappings={mappings}
          onFileUpload={handleFileUpload}
          onOverrideWorksheet={handleOverrideWorksheet}
          onOverrideColumnMapping={handleOverrideColumnMapping}
          onProceedToValidate={() => setActiveTab('VALIDATE')}
        />
      )}

      {activeTab === 'VALIDATE' && (
        <PCBIValidateTab
          validationSummary={validationSummary}
          onProceedToPreview={() => setActiveTab('PREVIEW')}
        />
      )}

      {activeTab === 'PREVIEW' && (
        <PCBIPreviewTab
          validationSummary={validationSummary}
          datasets={datasets}
          onProceedToImport={() => setActiveTab('IMPORT')}
        />
      )}

      {activeTab === 'IMPORT' && (
        <PCBIImportTab
          importResult={importResult}
          validationSummary={validationSummary}
          fileName={fileMetadata?.name || 'PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx'}
          isImporting={isImporting}
          onExecuteImport={handleExecuteImport}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          onViewImportedMaster={() => setActiveTab('DASHBOARD')}
        />
      )}

      {activeTab === 'VERSIONS' && (
        <PCBIVersionsTab
          versions={versions}
          onPublishVersion={async (v) => {
            await pcbiAdminApi.publishVersion(v, 'Sriman Admin');
            await loadVersions();
          }}
        />
      )}

      {activeTab === 'PUBLISHED' && (
        <PCBIVersionsTab
          versions={versions}
          onPublishVersion={async (v) => {
            await pcbiAdminApi.publishVersion(v, 'Sriman Admin');
            await loadVersions();
          }}
          showOnlyPublished
        />
      )}

      {/* Publish Modal */}
      <PCBIPublishModal
        isOpen={isPublishModalOpen}
        version={importResult?.version || activeVersion?.version || 'V1.0'}
        metrics={importResult ? activeVersion?.metrics || null : activeVersion?.metrics || null}
        isPublishing={isPublishing}
        onConfirmPublish={handleConfirmPublish}
        onClose={() => setIsPublishModalOpen(false)}
      />
    </div>
  );
};
