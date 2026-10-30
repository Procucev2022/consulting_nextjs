/**
 * Slide builders for the reduced Executive Brief deck: cover, summary table, and one slide per section 01-07.
 * The evidence slide (section 08 and the checklist) is built in executiveBriefPptxEvidenceSlide.
 */
import type PptxGenJS from 'pptxgenjs';
import type { ExecutiveBriefReportData, ExecutiveBriefSlideGroup } from '../types/executiveBriefExportTypes';
import { EXECUTIVE_BRIEF_LABELS } from '../constants/executiveBriefLabelConstants';
import {
  PPTX_COVER_SLIDE_NUMBER,
  PPTX_EVIDENCE_GROUP_ID,
  PPTX_FIRST_SECTION_SLIDE_NUMBER,
  PPTX_FONT_FACE,
  PPTX_FONT_SIZES,
  PPTX_FRAMING_SLIDE_COUNT,
  PPTX_GEOMETRY,
  PPTX_PARAGRAPH_SPACING,
  PPTX_SUMMARY_SLIDE_NUMBER,
  PPTX_SUMMARY_TABLE_COLUMNS,
  PPTX_THEME
} from '../constants/executiveBriefPptxConstants';
import {
  addBackdrop,
  addFooter,
  addSlideFrame,
  bodyCell,
  fieldRuns,
  headerCell,
  tableBorder
} from './executiveBriefPptxHelpers';
import { addEvidenceSlide } from './executiveBriefPptxEvidenceSlide';

const addCoverSlide = (presentation: PptxGenJS, report: ExecutiveBriefReportData, totalSlides: number): void => {
  const slide = presentation.addSlide();
  addBackdrop(presentation, slide);
  const width = PPTX_GEOMETRY.CONTENT_WIDTH;
  slide.addText(EXECUTIVE_BRIEF_LABELS.documentTitle, {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.COVER_TITLE_Y,
    w: width,
    h: PPTX_GEOMETRY.COVER_TITLE_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.coverTitle,
    bold: true,
    color: PPTX_THEME.primaryText,
    valign: 'middle'
  });
  slide.addText(EXECUTIVE_BRIEF_LABELS.documentSubtitle, {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.COVER_SUBTITLE_Y,
    w: width,
    h: PPTX_GEOMETRY.SUBTITLE_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.coverSubtitle,
    color: PPTX_THEME.secondaryText
  });
  slide.addText(report.clientProfile.clientName, {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.COVER_CLIENT_Y,
    w: width,
    h: PPTX_GEOMETRY.SUBTITLE_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.coverClient,
    bold: true,
    color: PPTX_THEME.accent
  });
  slide.addText(
    [
      ...fieldRuns(EXECUTIVE_BRIEF_LABELS.analysisPeriodLabel, report.clientProfile.analysisPeriod),
      ...fieldRuns(EXECUTIVE_BRIEF_LABELS.reportDateLabel, report.metadata.reportDate),
      ...fieldRuns(EXECUTIVE_BRIEF_LABELS.statusLabel, report.clientProfile.status)
    ],
    {
      x: PPTX_GEOMETRY.MARGIN_X,
      y: PPTX_GEOMETRY.COVER_DETAIL_Y,
      w: width,
      h: PPTX_GEOMETRY.COVER_DETAIL_HEIGHT,
      fontFace: PPTX_FONT_FACE,
      fontSize: PPTX_FONT_SIZES.body,
      valign: 'top',
      paraSpaceAfter: PPTX_PARAGRAPH_SPACING.cover
    }
  );
  addFooter(slide, report.clientProfile.clientName, PPTX_COVER_SLIDE_NUMBER, totalSlides);
};

const addSummarySlide = (
  presentation: PptxGenJS,
  report: ExecutiveBriefReportData,
  slideNumber: number,
  totalSlides: number
): void => {
  const slide = addSlideFrame(presentation, {
    title: EXECUTIVE_BRIEF_LABELS.summaryTitle,
    clientName: report.clientProfile.clientName,
    slideNumber,
    totalSlides
  });
  const headers = EXECUTIVE_BRIEF_LABELS.summaryTable;
  const rows: PptxGenJS.TableRow[] = [
    [headerCell(headers.metric), headerCell(headers.value), headerCell(headers.module), headerCell(headers.evidence)],
    ...report.summaryCards.map((card) => [
      bodyCell(card.label),
      bodyCell(card.formattedValue),
      bodyCell(card.module),
      bodyCell(card.evidenceRef)
    ])
  ];
  slide.addTable(rows, {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.BODY_Y,
    w: PPTX_GEOMETRY.CONTENT_WIDTH,
    colW: [...PPTX_SUMMARY_TABLE_COLUMNS],
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.table,
    border: tableBorder()
  });
};

const sectionRuns = (group: ExecutiveBriefSlideGroup): PptxGenJS.TextProps[] => {
  const fields = EXECUTIVE_BRIEF_LABELS.sectionFields;
  const cardRuns = group.detailCards.flatMap((card) =>
    fieldRuns(
      `${card.findingId}${EXECUTIVE_BRIEF_LABELS.pairSeparator}${card.title}`,
      `${card.potentialValueDisplay}${EXECUTIVE_BRIEF_LABELS.pairSeparator}${card.confidence}`
    )
  );
  return [
    ...fieldRuns(fields.finding, group.finding),
    ...fieldRuns(fields.outcome, group.outcome),
    ...fieldRuns(fields.recommendedAction, group.recommendedAction),
    ...fieldRuns(fields.nextStep, group.nextStep),
    ...cardRuns
  ];
};

const addSectionSlide = (
  presentation: PptxGenJS,
  group: ExecutiveBriefSlideGroup,
  report: ExecutiveBriefReportData,
  slideNumber: number,
  totalSlides: number
): void => {
  const slide = addSlideFrame(presentation, {
    title: `${group.groupNumber}  ${group.title}`,
    clientName: report.clientProfile.clientName,
    slideNumber,
    totalSlides
  });
  slide.addText(sectionRuns(group), {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.BODY_Y,
    w: PPTX_GEOMETRY.CONTENT_WIDTH,
    h: PPTX_GEOMETRY.BODY_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.body,
    valign: 'top',
    paraSpaceAfter: PPTX_PARAGRAPH_SPACING.text
  });
};

/**
 * Adds the reduced deck to the presentation: cover, summary, seven section slides, and the evidence slide.
 * Returns the slide count.
 */
export const addExecutiveBriefSlides = (presentation: PptxGenJS, report: ExecutiveBriefReportData): number => {
  const sectionGroups = report.sections.filter((group) => group.groupId !== PPTX_EVIDENCE_GROUP_ID);
  const evidenceGroup = report.sections.find((group) => group.groupId === PPTX_EVIDENCE_GROUP_ID);
  const totalSlides = sectionGroups.length + PPTX_FRAMING_SLIDE_COUNT;
  addCoverSlide(presentation, report, totalSlides);
  addSummarySlide(presentation, report, PPTX_SUMMARY_SLIDE_NUMBER, totalSlides);
  sectionGroups.forEach((group, index) =>
    addSectionSlide(presentation, group, report, PPTX_FIRST_SECTION_SLIDE_NUMBER + index, totalSlides)
  );
  addEvidenceSlide(presentation, report, evidenceGroup, totalSlides);
  return totalSlides;
};
