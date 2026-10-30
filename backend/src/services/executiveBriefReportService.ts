/**
 * Assembles the Executive Brief report payload that the page, the PDF, the PPTX, and the audit all render from.
 * Sections, lineage, and artifacts are certified static content. Metadata and reconciliation are computed per request.
 */
import { DEFAULT_CLIENT_PROFILE } from '../constants/executiveBriefConstants';
import {
  CERTIFIED_CHECKLIST_ATTESTATIONS,
  EXECUTIVE_BRIEF_STATUS_LABELS
} from '../constants/executiveBriefCertifiedFigureConstants';
import {
  BRIEF_REPORT_ARTIFACTS,
  BRIEF_SLIDE_GROUPS,
  BRIEF_TRACEABILITY_LINEAGE
} from '../constants/executiveBriefReportConstants';
import { EXECUTIVE_BRIEF_SUMMARY_CARD_DEFINITIONS } from '../constants/executiveBriefSummaryCardConstants';
import type {
  ExecutiveBriefReportData,
  ExecutiveBriefSummaryCardItem,
  ExecutiveBriefValidationChecklist
} from '../types/executiveBriefExportTypes';
import type { ExecutiveBriefMetadata } from '../types/executiveBriefTypes';
import { formatSummaryValue } from './executiveBriefFormatters';
import {
  buildExecutiveBriefMetadata,
  readSummaryMetric,
  reconcileExecutiveBrief
} from './executiveBriefMetadataService';

export const buildSummaryCards = (metadata: ExecutiveBriefMetadata): ExecutiveBriefSummaryCardItem[] =>
  EXECUTIVE_BRIEF_SUMMARY_CARD_DEFINITIONS.map((definition) => {
    const value = readSummaryMetric(definition.metric, metadata);
    return {
      id: definition.id,
      label: definition.label,
      valueInr: value,
      formattedValue: formatSummaryValue(value, definition.unit),
      module: definition.module,
      evidenceRef: definition.evidenceRef
    };
  });

export const buildValidationChecklist = (isReconciled: boolean): ExecutiveBriefValidationChecklist => ({
  ...CERTIFIED_CHECKLIST_ATTESTATIONS,
  financialReconciliation: isReconciled
});

export const assembleExecutiveBriefReport = (clientName: string, reportDate: string): ExecutiveBriefReportData => {
  const metadata = buildExecutiveBriefMetadata(clientName, reportDate);
  const reconciliation = reconcileExecutiveBrief(metadata);
  return {
    metadata,
    clientProfile: {
      clientName,
      analysisPeriod: metadata.analysisPeriod,
      group: DEFAULT_CLIENT_PROFILE.group,
      reportVersion: metadata.reportVersion,
      confidentiality: EXECUTIVE_BRIEF_STATUS_LABELS.confidentiality,
      status: reconciliation.isReconciled
        ? EXECUTIVE_BRIEF_STATUS_LABELS.certified
        : EXECUTIVE_BRIEF_STATUS_LABELS.blocked
    },
    summaryCards: buildSummaryCards(metadata),
    sections: BRIEF_SLIDE_GROUPS,
    traceabilityLineage: BRIEF_TRACEABILITY_LINEAGE,
    validationChecklist: buildValidationChecklist(reconciliation.isReconciled),
    artifacts: BRIEF_REPORT_ARTIFACTS
  };
};
