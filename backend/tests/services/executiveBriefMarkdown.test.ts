import { describe, expect, it } from 'vitest';
import { formatExecutiveBriefAuditMarkdown } from '../../src/services/executiveBriefMarkdown';
import {
  EXECUTIVE_BRIEF_CHECKLIST_LABELS,
  EXECUTIVE_BRIEF_LABELS
} from '../../src/constants/executiveBriefLabelConstants';
import { certifiedReport } from '../executiveBriefTestHelpers';
import type { ExecutiveBriefReportData } from '../../src/types/executiveBriefExportTypes';

const PASS = EXECUTIVE_BRIEF_LABELS.checklistPass;
const FAIL = EXECUTIVE_BRIEF_LABELS.checklistFail;

describe('formatExecutiveBriefAuditMarkdown', () => {
  it('documents a passing reconciliation, the checklist, artifacts, and lineage', () => {
    const markdown = formatExecutiveBriefAuditMarkdown(certifiedReport());
    expect(markdown.startsWith(`# ${EXECUTIVE_BRIEF_LABELS.audit.title}`)).toBe(true);
    expect(markdown).toContain(`${EXECUTIVE_BRIEF_LABELS.audit.overallLabel}: **${PASS}**`);
    expect(markdown).toContain(`| ${EXECUTIVE_BRIEF_LABELS.audit.metricLabels.totalSpend} | 59203477681.66 |`);
    expect(markdown).toContain(`| ${EXECUTIVE_BRIEF_LABELS.audit.metricLabels.approvedSavings} | 479000000.00 |`);
    expect(markdown).toContain(`| ${EXECUTIVE_BRIEF_LABELS.audit.artifactHeader} | ${EXECUTIVE_BRIEF_LABELS.audit.fileHeader}`);
    expect(markdown).toContain('| FIND-04 | Module 3 |');
    expect(markdown).toContain(`| Module 1 spend diagnostic validated | ${PASS} |`);
  });

  it('reports a failing reconciliation row and overall status when a figure drifts', () => {
    const report = certifiedReport();
    const drifted: ExecutiveBriefReportData = {
      ...report,
      metadata: { ...report.metadata, totalSpendInr: report.metadata.totalSpendInr + 1 }
    };
    const markdown = formatExecutiveBriefAuditMarkdown(drifted);
    expect(markdown).toContain(`${EXECUTIVE_BRIEF_LABELS.audit.overallLabel}: **${FAIL}**`);
    expect(markdown).toContain(`| ${EXECUTIVE_BRIEF_LABELS.audit.metricLabels.totalSpend} | 59203477682.66 | 59203477681.66 | 1.00 | ${FAIL} |`);
  });

  it('shows FAIL for a checklist control that did not pass', () => {
    const report = certifiedReport();
    const failing: ExecutiveBriefReportData = {
      ...report,
      validationChecklist: { ...report.validationChecklist, dataLineage: false }
    };
    expect(formatExecutiveBriefAuditMarkdown(failing)).toContain(
      `| ${EXECUTIVE_BRIEF_CHECKLIST_LABELS.dataLineage} | ${FAIL} |`
    );
  });

  it('escapes table separators and line breaks inside lineage cells', () => {
    const report = certifiedReport();
    const edited: ExecutiveBriefReportData = {
      ...report,
      traceabilityLineage: [{ ...report.traceabilityLineage[0], item: 'Alpha|Beta\nGamma' }]
    };
    expect(formatExecutiveBriefAuditMarkdown(edited)).toContain('| Alpha\\|Beta Gamma |');
  });
});
