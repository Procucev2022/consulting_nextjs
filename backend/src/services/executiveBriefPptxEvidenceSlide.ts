/**
 * Evidence slide of the Executive Brief PPTX. Section 08 narrative sits on the left and the validation checklist,
 * with PASS or FAIL per control, sits on the right.
 */
import type PptxGenJS from 'pptxgenjs';
import type { ExecutiveBriefReportData, ExecutiveBriefSlideGroup } from '../types/executiveBriefExportTypes';
import {
  EXECUTIVE_BRIEF_CHECKLIST_KEYS,
  EXECUTIVE_BRIEF_CHECKLIST_LABELS,
  EXECUTIVE_BRIEF_LABELS
} from '../constants/executiveBriefLabelConstants';
import {
  PPTX_CHECKLIST_TABLE_COLUMNS,
  PPTX_EVIDENCE_LEFT_WIDTH,
  PPTX_EVIDENCE_RIGHT_WIDTH,
  PPTX_EVIDENCE_RIGHT_X,
  PPTX_FONT_FACE,
  PPTX_FONT_SIZES,
  PPTX_GEOMETRY,
  PPTX_PARAGRAPH_SPACING,
  PPTX_THEME
} from '../constants/executiveBriefPptxConstants';
import { addSlideFrame, bodyCell, fieldRuns, headerCell, tableBorder } from './executiveBriefPptxHelpers';

const evidenceRuns = (group: ExecutiveBriefSlideGroup | undefined): PptxGenJS.TextProps[] => {
  if (group === undefined) {
    return [];
  }
  const fields = EXECUTIVE_BRIEF_LABELS.sectionFields;
  return [
    ...fieldRuns(fields.finding, group.finding),
    ...fieldRuns(fields.outcome, group.outcome),
    ...fieldRuns(fields.nextStep, group.nextStep)
  ];
};

const checklistRows = (report: ExecutiveBriefReportData): PptxGenJS.TableRow[] => {
  const headers = EXECUTIVE_BRIEF_LABELS.checklistTable;
  const body = EXECUTIVE_BRIEF_CHECKLIST_KEYS.map((key): PptxGenJS.TableRow => {
    const passed = report.validationChecklist[key];
    return [
      bodyCell(EXECUTIVE_BRIEF_CHECKLIST_LABELS[key]),
      bodyCell(
        passed ? EXECUTIVE_BRIEF_LABELS.checklistPass : EXECUTIVE_BRIEF_LABELS.checklistFail,
        passed ? PPTX_THEME.pass : PPTX_THEME.fail
      )
    ];
  });
  return [[headerCell(headers.control), headerCell(headers.status)], ...body];
};

/**
 * The evidence slide is always the last slide, so its number equals the total slide count.
 */
export const addEvidenceSlide = (
  presentation: PptxGenJS,
  report: ExecutiveBriefReportData,
  evidenceGroup: ExecutiveBriefSlideGroup | undefined,
  totalSlides: number
): void => {
  const slide = addSlideFrame(presentation, {
    title: EXECUTIVE_BRIEF_LABELS.evidenceTitle,
    subtitle: evidenceGroup?.title,
    clientName: report.clientProfile.clientName,
    slideNumber: totalSlides,
    totalSlides
  });
  slide.addText(evidenceRuns(evidenceGroup), {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.BODY_Y,
    w: PPTX_EVIDENCE_LEFT_WIDTH,
    h: PPTX_GEOMETRY.BODY_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.body,
    valign: 'top',
    paraSpaceAfter: PPTX_PARAGRAPH_SPACING.text
  });
  slide.addTable(checklistRows(report), {
    x: PPTX_EVIDENCE_RIGHT_X,
    y: PPTX_GEOMETRY.BODY_Y,
    w: PPTX_EVIDENCE_RIGHT_WIDTH,
    colW: [...PPTX_CHECKLIST_TABLE_COLUMNS],
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.checklistTable,
    border: tableBorder()
  });
};
