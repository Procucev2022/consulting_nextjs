/**
 * Section pages of the Executive Brief PDF. Each certified section starts on a new page and lists its narrative
 * fields followed by its detail cards. Optional card fields are shown only when the report provides them.
 */
import type { ExecutiveBriefReportData, ExecutiveBriefSlideGroup } from '../types/executiveBriefExportTypes';
import type { ExecutiveFindingCard } from '../types/executiveBriefTypes';
import type { ExecutiveBriefPdfRow } from '../types/executiveBriefPdf';
import { PDF_BLOCK_GAP, PDF_TEXT_STYLES } from '../constants/executiveBriefPdfConstants';
import { EXECUTIVE_BRIEF_LABELS } from '../constants/executiveBriefLabelConstants';
import type { ExecutiveBriefPdfCursor } from './executiveBriefPdfCursor';

const optionalRow = (label: string, value: string | undefined): ExecutiveBriefPdfRow[] =>
  value === undefined || value.length === 0 ? [] : [{ label, value }];

const sectionRows = (group: ExecutiveBriefSlideGroup): ExecutiveBriefPdfRow[] => {
  const fields = EXECUTIVE_BRIEF_LABELS.sectionFields;
  return [
    { label: fields.background, value: group.background },
    { label: fields.objective, value: group.objective },
    { label: fields.finding, value: group.finding },
    { label: fields.evidence, value: group.evidence },
    { label: fields.outcome, value: group.outcome },
    { label: fields.recommendedAction, value: group.recommendedAction },
    { label: fields.nextStep, value: group.nextStep }
  ];
};

export const detailCardRows = (card: ExecutiveFindingCard): ExecutiveBriefPdfRow[] => {
  const fields = EXECUTIVE_BRIEF_LABELS.detailFields;
  return [
    ...optionalRow(fields.finding, card.finding),
    { label: fields.background, value: card.background },
    { label: fields.objective, value: card.objective },
    ...optionalRow(fields.addressableBase, card.addressableBase),
    { label: fields.evidence, value: card.evidence },
    { label: fields.analysis, value: card.analysis },
    ...optionalRow(fields.methodology, card.methodology),
    ...optionalRow(fields.assumption, card.assumption),
    { label: fields.outcome, value: card.outcome },
    ...optionalRow(fields.expectedOutcome, card.expectedOutcome),
    { label: fields.potentialValueDisplay, value: card.potentialValueDisplay },
    ...optionalRow(fields.indicativeOpportunity, card.indicativeOpportunity),
    { label: fields.confidence, value: card.confidence },
    { label: fields.confidenceRationale, value: card.confidenceRationale },
    { label: fields.riskConstraint, value: card.riskConstraint },
    ...optionalRow(fields.recommendedAction, card.recommendedAction),
    { label: fields.nextStep, value: card.nextStep },
    { label: fields.owner, value: card.owner },
    { label: fields.timeline, value: card.timeline },
    { label: fields.detailedAnalysisRef, value: card.detailedAnalysisRef }
  ];
};

const renderSection = (cursor: ExecutiveBriefPdfCursor, group: ExecutiveBriefSlideGroup): void => {
  const title = `${group.groupNumber}  ${group.title}`;
  cursor.startNewPage(title);
  cursor.paragraph(title, PDF_TEXT_STYLES.heading, PDF_BLOCK_GAP);
  cursor.paragraph(group.summary, PDF_TEXT_STYLES.lead, PDF_BLOCK_GAP);
  sectionRows(group).forEach((row) => cursor.row(row));
  group.detailCards.forEach((card) => {
    cursor.advance(PDF_BLOCK_GAP);
    cursor.paragraph(`${card.findingId}${EXECUTIVE_BRIEF_LABELS.pairSeparator}${card.title}`, PDF_TEXT_STYLES.subheading);
    detailCardRows(card).forEach((row) => cursor.row(row));
  });
};

export const renderSectionPages = (cursor: ExecutiveBriefPdfCursor, report: ExecutiveBriefReportData): void => {
  report.sections.forEach((group) => renderSection(cursor, group));
};
