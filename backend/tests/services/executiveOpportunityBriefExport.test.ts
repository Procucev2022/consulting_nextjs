import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  executiveOpportunityBriefContentType,
  executiveOpportunityBriefFilename,
  formatExecutiveOpportunityBriefAuditMarkdown,
  generateExecutiveOpportunityBriefPdf,
  generateExecutiveOpportunityBriefPptx,
  getExecutiveOpportunityBriefSlideRows
} from '../../src/services/executiveOpportunityBriefExport';
import type { ExecutiveOpportunityBriefReport } from '../../src/types';

const mockedPptx = vi.hoisted(() => ({
  output: new Uint8Array([80, 75, 3, 4]),
  slides: 0,
  writes: 0,
  text: [] as string[]
}));

vi.mock('pptxgenjs', () => ({
  default: class MockPptx {
    public layout = '';
    public author = '';
    public company = '';
    public title = '';
    public addSlide(): { background: { color: string }; addText: (text?: unknown) => void } {
      mockedPptx.slides += 1;
      return { background: { color: '' }, addText: (text?: unknown) => {
        if (typeof text === 'string') mockedPptx.text.push(text);
      } };
    }
    public async write(): Promise<Uint8Array | ArrayBuffer> {
      mockedPptx.writes += 1;
      return mockedPptx.output;
    }
  }
}));

const briefReport = (): ExecutiveOpportunityBriefReport => ({
  tenant: { tenantId: 'T1', enterpriseName: 'D1 Enterprise' },
  dataClassification: 'CUSTOMER_DATA',
  generatedAt: '2026-10-30T00:00:00.000Z',
  scopeDescription: 'Baseline D1 scope.',
  metrics: {
    transactionCount: 12,
    totalSpendCr: 125.5,
    supplierCount: 4,
    materialCount: 6,
    plantCount: 2,
    purchaseOrderCount: 9,
    firstTransactionDate: '2024-01-01',
    lastTransactionDate: '2025-12-31',
    opportunityCount: 1,
    estimatedSavingsCr: 10.25,
    averageConfidence: 0.87
  },
  opportunities: [{
    id: 'O1', category: 'Packaging', title: 'Packaging sourcing', currentSpendCr: 50,
    estimatedSavingsCr: 10.25, lever: 'Strategic sourcing', recommendedAction: 'Launch tender',
    status: 'Identified', riskLevel: 'Medium', confidence: 0.9
  }],
  levers: [{ label: 'Strategic sourcing', count: 1, estimatedSavingsCr: 10.25 }],
  statuses: [{ label: 'Identified', count: 1, estimatedSavingsCr: 10.25 }],
  risks: [{ label: 'Medium', count: 1, estimatedSavingsCr: 10.25 }]
});

describe('executive opportunity brief exports', () => {
  beforeEach(() => {
    mockedPptx.output = new Uint8Array([80, 75, 3, 4]);
    mockedPptx.slides = 0;
    mockedPptx.writes = 0;
    mockedPptx.text = [];
  });

  it('builds slide rows from D1 values for every slide and handles empty groups and opportunities', () => {
    const report = briefReport();
    report.dataClassification = 'DEMO_ONLY';
    expect(Array.from({ length: 10 }, (_item, index) => getExecutiveOpportunityBriefSlideRows(report, index).length))
      .toEqual([5, 6, 3, 1, 1, 2, 1, 4, 3, 1]);
    expect(getExecutiveOpportunityBriefSlideRows(report, 0)[1]).toContain('125.50 Cr');
    expect(getExecutiveOpportunityBriefSlideRows(report, 8)[1]).toContain('2024-01-01');
    expect(getExecutiveOpportunityBriefSlideRows(report, -1)).toEqual(['Not recorded']);

    const empty = { ...report, opportunities: [], levers: [], statuses: [], risks: [], metrics: {
      ...report.metrics, firstTransactionDate: null, lastTransactionDate: null
    } };
    expect(getExecutiveOpportunityBriefSlideRows(empty, 3)).toEqual(['Not recorded']);
    expect(getExecutiveOpportunityBriefSlideRows(empty, 4)).toEqual(['Not recorded']);
    expect(getExecutiveOpportunityBriefSlideRows(empty, 5)).toContain('Not recorded');
    expect(getExecutiveOpportunityBriefSlideRows(empty, 8)[1]).toContain('Not recorded');
    expect(getExecutiveOpportunityBriefSlideRows(empty, 9)).toContain('Review the D1 tenant, transaction baseline, and opportunity register, then retry.');
  });

  it('renders a ten-page PDF and a ten-slide PPTX from the same report payload', async () => {
    const report = briefReport();
    const pdf = generateExecutiveOpportunityBriefPdf(report);
    expect(Buffer.from(pdf.slice(0, 8)).toString('latin1')).toBe('%PDF-1.4');
    expect(Buffer.from(pdf).toString('latin1')).toContain('CUSTOMER DATA');
    const pptx = await generateExecutiveOpportunityBriefPptx(report);
    expect(Buffer.from(pptx.slice(0, 2)).toString('latin1')).toBe('PK');
    expect(mockedPptx.slides).toBe(10);
    expect(mockedPptx.writes).toBe(1);
    expect(mockedPptx.text).toContain('CUSTOMER DATA');
    const demoReport = { ...report, dataClassification: 'DEMO_ONLY' as const };
    const demoPdf = generateExecutiveOpportunityBriefPdf(demoReport);
    expect(Buffer.from(demoPdf).toString('latin1')).toContain('DEMO ONLY - NOT VALIDATED SAVINGS');
    await generateExecutiveOpportunityBriefPptx(demoReport);
    expect(mockedPptx.text).toContain('DEMO ONLY - NOT VALIDATED SAVINGS');
  });

  it('rejects a PPTX writer result that is not bytes', async () => {
    mockedPptx.output = new ArrayBuffer(2) as unknown as Uint8Array;
    await expect(generateExecutiveOpportunityBriefPptx(briefReport())).rejects.toThrow(
      'PowerPoint generation did not return a byte array.'
    );
  });

  it('chooses export MIME types and sanitizes generated attachment filenames', () => {
    expect(executiveOpportunityBriefContentType('pdf')).toBe('application/pdf');
    expect(executiveOpportunityBriefContentType('pptx')).toContain('presentationml.presentation');
    expect(executiveOpportunityBriefFilename('D1 Enterprise', 'pdf', '2026-10-30'))
      .toBe('Executive_Opportunity_Brief_D1_Enterprise_2026-10-30.pdf');
    expect(executiveOpportunityBriefFilename('../', 'pptx', 'bad-date'))
      .toBe('Executive_Opportunity_Brief_Tenant_undated.pptx');
  });

  it('formats a D1 audit with source scope and escapes markdown table cells', () => {
    const report = briefReport();
    report.dataClassification = 'DEMO_ONLY';
    report.tenant.enterpriseName = 'Enterprise | West';
    report.opportunities[0].title = 'Packaging\nreview';
    const markdown = formatExecutiveOpportunityBriefAuditMarkdown(report);
    expect(markdown).toContain('Enterprise \\| West');
    expect(markdown).toContain('Packaging review');
    expect(markdown).toContain('DEMO ONLY - NOT VALIDATED SAVINGS');
    expect(markdown).toContain('| --- | --- | --- | --- | --- |');

    const noOpportunities = { ...report, opportunities: [] };
    expect(formatExecutiveOpportunityBriefAuditMarkdown(noOpportunities)).toContain('No tenant-linked opportunities are recorded in D1.');
  });
});
