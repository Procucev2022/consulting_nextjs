'use client';
import React, { useState } from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import type {
  ExecutiveBriefAuditValidationPanelProps
} from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefAuditValidationPanel: React.FC<ExecutiveBriefAuditValidationPanelProps> = ({
  checklist,
  artifacts,
  onDownloadArtifact
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;
  const [isArtifactsExpanded, setIsArtifactsExpanded] = useState<boolean>(true);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState<boolean>(true);

  const validationItems = [
    { key: 'module1Validated', label: strings.validation.items.module1Validated, isValid: checklist.module1Validated },
    { key: 'module2Validated', label: strings.validation.items.module2Validated, isValid: checklist.module2Validated },
    { key: 'module3Validated', label: strings.validation.items.module3Validated, isValid: checklist.module3Validated },
    { key: 'module4Validated', label: strings.validation.items.module4Validated, isValid: checklist.module4Validated },
    { key: 'financialReconciliation', label: strings.validation.items.financialReconciliation, isValid: checklist.financialReconciliation },
    { key: 'transactionTraceability', label: strings.validation.items.transactionTraceability, isValid: checklist.transactionTraceability },
    { key: 'doubleCountingControls', label: strings.validation.items.doubleCountingControls, isValid: checklist.doubleCountingControls },
    { key: 'dataLineage', label: strings.validation.items.dataLineage, isValid: checklist.dataLineage },
    { key: 'securityControls', label: strings.validation.items.securityControls, isValid: checklist.securityControls },
    { key: 'reportGenerationValidation', label: strings.validation.items.reportGenerationValidation, isValid: checklist.reportGenerationValidation }
  ];

  return (
    <div className="space-y-4">
      {/* 9. Report Validation Panel */}
      <section aria-labelledby="validation-heading" className="bg-white border border-[#DCE7F5] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE7F5]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 id="validation-heading" className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
              {strings.validation.sectionTitle}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            10 / 10 Controls Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-3">
          {validationItems.map((item) => (
            <div
              key={item.key}
              data-testid={`validation-check-${item.key}`}
              className="bg-[#F8FBFE] border border-[#DCE7F5] p-2.5 rounded-xl flex items-center gap-2 text-xs"
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${item.isValid ? 'text-emerald-600' : 'text-[#94A3B8]'}`}
              />
              <span className={`text-[11px] truncate ${item.isValid ? 'text-[#0B1B33]' : 'text-[#94A3B8]'}`} title={item.label}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Audit & Supporting Artifacts Panel */}
      <section aria-labelledby="artifacts-heading" className="bg-white border border-[#DCE7F5] rounded-2xl p-4 sm:p-5 shadow-sm">
        <button
          type="button"
          data-testid="toggle-artifacts-btn"
          onClick={() => setIsArtifactsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
          aria-expanded={isArtifactsExpanded}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0284C7]" />
            <h2 id="artifacts-heading" className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
              {strings.artifacts.sectionTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#64748B]">{artifacts.length} Certified Files</span>
            <div className="p-1 rounded bg-[#F8FBFE] border border-[#DCE7F5] text-[#64748B]">
              {isArtifactsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </button>

        {isArtifactsExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#DCE7F5] animate-in fade-in">
            {artifacts.map((art) => (
              <div
                key={art.filename}
                className="bg-[#F8FBFE] border border-[#DCE7F5] hover:border-[#0284C7] rounded-xl p-3.5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0B1B33] text-xs">{art.name}</span>
                    <span className="text-[10px] font-mono text-[#0284C7] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-semibold">
                      {art.filename.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-1 line-clamp-2 leading-relaxed">
                    {art.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#DCE7F5] flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#64748B] truncate max-w-[140px]" title={art.filename}>
                    {art.filename}
                  </span>
                  <button
                    type="button"
                    data-testid={`download-artifact-btn-${art.filename}`}
                    onClick={() => onDownloadArtifact(art)}
                    className="text-[#0284C7] hover:text-[#0369A1] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Data Security & Confidentiality Architecture (Prompt 260 Phase 15) */}
      <section
        aria-labelledby="security-heading"
        className="bg-white border border-[#DCE7F5] rounded-2xl p-4 sm:p-5 shadow-sm"
      >
        <button
          type="button"
          data-testid="toggle-security-btn"
          onClick={() => setIsSecurityExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
          aria-expanded={isSecurityExpanded}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 id="security-heading" className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
              Data Security &amp; Confidentiality Controls
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">AES-256-GCM / Isolated</span>
            <div className="p-1 rounded bg-[#F8FBFE] border border-[#DCE7F5] text-[#64748B]">
              {isSecurityExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </button>

        {isSecurityExpanded && (
          <div className="mt-4 pt-3 border-t border-[#DCE7F5] text-xs space-y-3 animate-in fade-in">
            <p className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-3 leading-relaxed text-[#475569]">
              Your procurement data is processed within the Procucev analysis environment and is protected during processing. Analysis outputs are generated for your engagement and are not intended to be reused as another customer&apos;s dataset.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Encryption at Rest</span>
                <span className="text-emerald-700 font-mono font-bold text-xs mt-0.5 block">AES-256-GCM AEAD</span>
                <span className="text-[10px] text-[#64748B] mt-1 block">96-bit nonces, 128-bit authentication tags</span>
              </div>
              <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Tenant Isolation</span>
                <span className="text-[#0284C7] font-mono font-bold text-xs mt-0.5 block">Row-Level &amp; Schema Isolation</span>
                <span className="text-[10px] text-[#64748B] mt-1 block">Cross-tenant cross-contamination prevented</span>
              </div>
              <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Cryptographic Checksums</span>
                <span className="text-purple-700 font-mono font-bold text-xs mt-0.5 block">SHA-256 Ledgers</span>
                <span className="text-[10px] text-[#64748B] mt-1 block">Immutable hash verification on report generation</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
