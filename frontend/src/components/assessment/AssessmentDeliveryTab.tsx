import React from 'react';
import { UI_STRINGS } from '../../constants';
import type { AssessmentDeliveryTabProps } from '../../types';
import { API_BASE } from '../../utils/apiBase';

export const AssessmentDeliveryTab: React.FC<AssessmentDeliveryTabProps> = ({ deliveryPackage }) => {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                {UI_STRINGS.ASSESSMENT.delivery.manifestOnly}
              </span>
              {deliveryPackage?.releaseVersion && (
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                  v{deliveryPackage.releaseVersion}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">{UI_STRINGS.ASSESSMENT.delivery.packageTitle}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{UI_STRINGS.ASSESSMENT.delivery.packageSubtitle}</p>
          </div>

          {deliveryPackage && (
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">{UI_STRINGS.ASSESSMENT.delivery.approvalHeading}</span>
              <span className="text-xs text-emerald-400 font-semibold">{deliveryPackage.approvedBy}</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {new Date(deliveryPackage.approvedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {deliveryPackage ? (
          <div className="space-y-4">
            {deliveryPackage.assessmentPeriod && (
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400">{UI_STRINGS.ASSESSMENT.delivery.assessmentPeriodLabel} </span>
                  <span className="font-semibold text-white">{deliveryPackage.assessmentPeriod}</span>
                </div>
                <div>
                  <span className="text-slate-400">{UI_STRINGS.ASSESSMENT.delivery.totalFilesLabel} </span>
                  <span className="font-mono font-bold text-cyan-400">{UI_STRINGS.ASSESSMENT.delivery.manifestEntryCount(
                    deliveryPackage.items.filter((item) => item.artifactStatus === 'GENERATED').length,
                    deliveryPackage.items.length
                  )}</span>
                </div>
              </div>
            )}

            {deliveryPackage.checksums && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {UI_STRINGS.ASSESSMENT.delivery.checksumsHeading}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  {deliveryPackage.checksums.sourceDataset && (
                    <div className="truncate">
                      <span className="text-slate-500">{UI_STRINGS.ASSESSMENT.delivery.sourceDatasetLabel}</span>
                      <span className="text-cyan-400">{deliveryPackage.checksums.sourceDataset.slice(0, 16)}...</span>
                    </div>
                  )}
                  {deliveryPackage.checksums.fxMaster && (
                    <div className="truncate">
                      <span className="text-slate-500">{UI_STRINGS.ASSESSMENT.delivery.fxMasterLabel}</span>
                      <span className="text-cyan-400">{deliveryPackage.checksums.fxMaster.slice(0, 16)}...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {UI_STRINGS.ASSESSMENT.delivery.plannedDeliverables}
              </span>
              <div className="divide-y divide-slate-800/80 rounded-lg border border-slate-800 overflow-hidden bg-slate-900/80">
                {deliveryPackage.items.map((item, index) => {
                  const formatBadgeColor =
                    item.format === 'PDF'
                      ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                      : item.format === 'PPTX'
                      ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                      : 'bg-emerald-950/80 border-emerald-800 text-emerald-300';

                  return (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold font-mono text-slate-400 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white tracking-wide">{item.title}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{item.fileName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${formatBadgeColor}`}>
                          {item.format}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 border border-cyan-800 text-cyan-400">
                          {item.artifactStatus === 'GENERATED'
                            ? UI_STRINGS.ASSESSMENT.delivery.generatedStatus
                            : UI_STRINGS.ASSESSMENT.delivery.notGenerated}
                        </span>
                        {item.artifactStatus === 'GENERATED' && (
                          <a
                            href={`${API_BASE}/api/assessment/${encodeURIComponent(deliveryPackage.assessmentId)}/delivery-package/${encodeURIComponent(item.id)}`}
                            download={item.fileName}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-600"
                            data-testid={`download-assessment-artifact-${item.id}`}
                          >
                            {UI_STRINGS.ASSESSMENT.delivery.btnDownload}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {deliveryPackage.items.some((item) => item.artifactStatus !== 'GENERATED') && (
              <p className="text-xs text-amber-300">{UI_STRINGS.ASSESSMENT.delivery.filesPending}</p>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg space-y-2">
            <p className="text-slate-400 font-semibold">{UI_STRINGS.ASSESSMENT.delivery.notApprovedAlert}</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              {UI_STRINGS.ASSESSMENT.delivery.manifestPendingNotice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
