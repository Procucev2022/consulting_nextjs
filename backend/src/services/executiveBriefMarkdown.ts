/**
 * Audit trail for the Executive Brief in Markdown. Every reconciliation status is computed from the report at request
 * time, so the audit states the actual variance against the certified figures.
 */
import {
  AUDIT_CURRENCY_DECIMALS,
  AUDIT_NEWLINE_PATTERN,
  AUDIT_PIPE_ESCAPE,
  AUDIT_PIPE_PATTERN,
  AUDIT_SPACE,
  AUDIT_TABLE_SEPARATOR_CELL
} from '../constants/executiveBriefAuditConstants';
import {
  CERTIFIED_ADDRESSABLE_SPEND_INR,
  CERTIFIED_APPROVED_SAVINGS_INR,
  CERTIFIED_GROSS_OPPORTUNITY_INR,
  CERTIFIED_NET_DEFENSIBLE_INR,
  CERTIFIED_REALIZED_SAVINGS_INR,
  CERTIFIED_SOURCE_DATA_VERSION,
  CERTIFIED_TOTAL_SPEND_INR,
  RECONCILIATION_TOLERANCE_INR
} from '../constants/executiveBriefCertifiedFigureConstants';
import {
  EXECUTIVE_BRIEF_CHECKLIST_KEYS,
  EXECUTIVE_BRIEF_CHECKLIST_LABELS,
  EXECUTIVE_BRIEF_LABELS
} from '../constants/executiveBriefLabelConstants';
import type { ExecutiveBriefReportData, FinancialConsistencyCheck } from '../types/executiveBriefExportTypes';
import { reconcileExecutiveBrief } from './executiveBriefMetadataService';

const escapeCell = (value: string): string =>
  value.replace(AUDIT_NEWLINE_PATTERN, AUDIT_SPACE).replace(AUDIT_PIPE_PATTERN, AUDIT_PIPE_ESCAPE);

const tableRow = (cells: string[]): string => `| ${cells.map(escapeCell).join(' | ')} |`;

const separatorRow = (columnCount: number): string =>
  tableRow(Array.from({ length: columnCount }, () => AUDIT_TABLE_SEPARATOR_CELL));

const statusFor = (variance: number): string =>
  variance <= RECONCILIATION_TOLERANCE_INR
    ? EXECUTIVE_BRIEF_LABELS.checklistPass
    : EXECUTIVE_BRIEF_LABELS.checklistFail;

const metricRow = (label: string, actual: number, certified: number, variance: number): string =>
  tableRow([
    label,
    actual.toFixed(AUDIT_CURRENCY_DECIMALS),
    certified.toFixed(AUDIT_CURRENCY_DECIMALS),
    variance.toFixed(AUDIT_CURRENCY_DECIMALS),
    statusFor(variance)
  ]);

const reconciliationRows = (report: ExecutiveBriefReportData, consistency: FinancialConsistencyCheck): string[] => {
  const labels = EXECUTIVE_BRIEF_LABELS.audit.metricLabels;
  const metadata = report.metadata;
  return [
    metricRow(labels.totalSpend, metadata.totalSpendInr, CERTIFIED_TOTAL_SPEND_INR, consistency.totalSpendVarianceInr),
    metricRow(
      labels.addressableSpend,
      metadata.addressableSpendInr,
      CERTIFIED_ADDRESSABLE_SPEND_INR,
      consistency.addressableSpendVarianceInr
    ),
    metricRow(
      labels.grossOpportunity,
      metadata.grossOpportunityInr,
      CERTIFIED_GROSS_OPPORTUNITY_INR,
      consistency.grossOpportunityVarianceInr
    ),
    metricRow(
      labels.netDefensibleOpportunity,
      metadata.netDefensibleOpportunityInr,
      CERTIFIED_NET_DEFENSIBLE_INR,
      consistency.netDefensibleVarianceInr
    ),
    metricRow(
      labels.approvedSavings,
      metadata.approvedSavingsInr,
      CERTIFIED_APPROVED_SAVINGS_INR,
      consistency.approvedSavingsVarianceInr
    ),
    metricRow(
      labels.realizedSavings,
      metadata.realizedSavingsInr,
      CERTIFIED_REALIZED_SAVINGS_INR,
      consistency.realizedSavingsVarianceInr
    )
  ];
};

const controlRows = (report: ExecutiveBriefReportData): string[] =>
  EXECUTIVE_BRIEF_CHECKLIST_KEYS.map((key) =>
    tableRow([
      EXECUTIVE_BRIEF_CHECKLIST_LABELS[key],
      report.validationChecklist[key]
        ? EXECUTIVE_BRIEF_LABELS.checklistPass
        : EXECUTIVE_BRIEF_LABELS.checklistFail
    ])
  );

export const formatExecutiveBriefAuditMarkdown = (report: ExecutiveBriefReportData): string => {
  const labels = EXECUTIVE_BRIEF_LABELS.audit;
  const reconciliation = reconcileExecutiveBrief(report.metadata);
  const lines = [
    `# ${labels.title}`,
    '',
    `- **${labels.clientLabel}:** ${report.clientProfile.clientName}`,
    `- **${labels.reportDateLabel}:** ${report.metadata.reportDate}`,
    `- **${labels.reportVersionLabel}:** ${report.metadata.reportVersion}`,
    `- **${labels.sourceDataLabel}:** ${CERTIFIED_SOURCE_DATA_VERSION}`,
    '',
    `## ${labels.reconciliationTitle}`,
    '',
    tableRow([
      labels.metricHeader,
      labels.actualHeader,
      labels.certifiedHeader,
      labels.varianceHeader,
      labels.statusHeader
    ]),
    separatorRow(5),
    ...reconciliationRows(report, reconciliation.consistency),
    '',
    `${labels.overallLabel}: **${reconciliation.isReconciled ? EXECUTIVE_BRIEF_LABELS.checklistPass : EXECUTIVE_BRIEF_LABELS.checklistFail}**`,
    '',
    `## ${labels.controlsTitle}`,
    '',
    tableRow([labels.controlHeader, labels.statusHeader]),
    separatorRow(2),
    ...controlRows(report),
    '',
    `## ${labels.artifactsTitle}`,
    '',
    tableRow([labels.artifactHeader, labels.fileHeader, labels.endpointHeader]),
    separatorRow(3),
    ...report.artifacts.map((artifact) => tableRow([artifact.name, artifact.filename, artifact.endpoint])),
    '',
    `## ${labels.lineageTitle}`,
    '',
    tableRow([
      labels.findingHeader,
      labels.moduleHeader,
      EXECUTIVE_BRIEF_LABELS.traceabilityFields.item,
      labels.savingsHeader
    ]),
    separatorRow(4),
    ...report.traceabilityLineage.map((item) => tableRow([item.findingId, item.module, item.item, item.savings])),
    ''
  ];
  return lines.join('\n');
};
