import { describe, expect, it } from 'vitest';
import { renderExecutiveBriefPdf } from '../../src/services/executiveBriefPdfRenderer';
import {
  EXECUTIVE_BRIEF_CHECKLIST_LABELS,
  EXECUTIVE_BRIEF_LABELS
} from '../../src/constants/executiveBriefLabelConstants';
import type { ExecutiveBriefReportData } from '../../src/types/executiveBriefExportTypes';
import { certifiedReport } from '../executiveBriefTestHelpers';

const decode = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');

const pageObjectCount = (text: string): number => (text.match(/\/Type \/Page[ /]/gu) ?? []).length;

const footerTotals = (text: string): number[] =>
  [...text.matchAll(/PAGE (\d+) OF (\d+)/gu)].map((match) => Number(match[2]));

describe('renderExecutiveBriefPdf', () => {
  it('writes a complete PDF whose footers agree with the number of pages', () => {
    const text = decode(renderExecutiveBriefPdf(certifiedReport()));
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    const pages = pageObjectCount(text);
    expect(pages).toBeGreaterThan(10);
    expect([...new Set(footerTotals(text))]).toEqual([pages]);
  });

  it('renders the cover, summary, sections, checklist, and traceability from the report data', () => {
    const text = decode(renderExecutiveBriefPdf(certifiedReport()));
    expect(text).toContain(EXECUTIVE_BRIEF_LABELS.documentTitle);
    expect(text).toContain('Rs. 5920.35 Cr');
    expect(text).toContain('31,671 Invoices');
    expect(text).toContain('01 Executive Overview');
    expect(text).toContain('Potential value');
    expect(text).toContain('02  Procucev & Client Context');
    expect(text).toContain(EXECUTIVE_BRIEF_CHECKLIST_LABELS.financialReconciliation);
    expect(text).toContain(EXECUTIVE_BRIEF_LABELS.traceabilityTitle);
    expect(text).toContain('FIND-01');
  });

  it('renders FAIL for a control that did not pass and tolerates absent optional card fields', () => {
    const report = certifiedReport();
    const card = report.sections[3].detailCards[0];
    const edited: ExecutiveBriefReportData = {
      ...report,
      validationChecklist: { ...report.validationChecklist, dataLineage: false },
      sections: report.sections.map((group, index) =>
        index === 3
          ? {
              ...group,
              detailCards: [
                {
                  ...card,
                  finding: undefined,
                  addressableBase: undefined,
                  methodology: '',
                  assumption: undefined,
                  expectedOutcome: undefined,
                  indicativeOpportunity: undefined,
                  recommendedAction: undefined
                },
                ...group.detailCards.slice(1)
              ]
            }
          : group
      )
    };
    const text = decode(renderExecutiveBriefPdf(edited));
    expect(text).toContain(EXECUTIVE_BRIEF_CHECKLIST_LABELS.dataLineage);
    expect(text).toContain('FAIL');
    expect(footerTotals(text).length).toBeGreaterThan(0);
  });

  it('lays out the contents in two columns when the section count is odd', () => {
    const report = certifiedReport();
    const odd: ExecutiveBriefReportData = { ...report, sections: report.sections.slice(0, 7) };
    const text = decode(renderExecutiveBriefPdf(odd));
    expect(text).toContain('07 Recommendations & Roadmap');
    expect(text).not.toContain('08 Evidence & Audit');
    expect(pageObjectCount(text)).toBeGreaterThan(5);
  });

  it('keeps the running section label in the header of every section page', () => {
    const text = decode(renderExecutiveBriefPdf(certifiedReport()));
    expect(text).toContain('03  Module 1: Spend Diagnostic');
    expect(text).toContain('08  Evidence & Audit');
  });
});
