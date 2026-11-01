import { describe, expect, it, vi } from 'vitest';
import {
  publishExecutiveBriefArtifacts,
  renderExecutiveBriefArtifact
} from '../../src/services/executiveBriefArtifactService';
import { buildExecutiveBriefStorageKey } from '../../src/services/executiveBriefFilenames';
import { d1OpportunityBriefReport, bucketDouble } from '../executiveBriefTestHelpers';

const pptxMock = vi.hoisted(() => ({ writeResult: new Uint8Array([80, 75, 3, 4]) }));

vi.mock('pptxgenjs', () => ({
  default: class MockPptx {
    public layout = '';
    public author = '';
    public company = '';
    public title = '';
    public addSlide(): { background: { color: string }; addText: () => void } {
      return { background: { color: '' }, addText: () => undefined };
    }
    public async write(): Promise<Uint8Array | ArrayBuffer> {
      return pptxMock.writeResult;
    }
  }
}));

describe('D1 executive brief artifacts', () => {
  it('uses a safe fallback tenant segment when the tenant name contains no usable characters', () => {
    expect(buildExecutiveBriefStorageKey('***', 'report.pdf')).toBe('executive-brief/Tenant/report.pdf');
  });

  it('renders the report, audit, PDF, and PPTX from the D1 payload', async () => {
    const report = d1OpportunityBriefReport();
    const pdf = await renderExecutiveBriefArtifact('pdf', report);
    const pptx = await renderExecutiveBriefArtifact('pptx', report);
    const json = await renderExecutiveBriefArtifact('json', report);
    const markdown = await renderExecutiveBriefArtifact('markdown', report);

    expect(pdf.contentType).toBe('application/pdf');
    expect(Buffer.from(pdf.body.slice(0, 8)).toString('latin1')).toBe('%PDF-1.4');
    expect(pdf.downloadFilename).toContain('D1_Enterprise_2026-10-24.pdf');
    expect(Buffer.from(pptx.body.slice(0, 2)).toString('latin1')).toBe('PK');
    expect(pptx.downloadFilename).toContain('D1_Enterprise_2026-10-24.pptx');
    expect(JSON.parse(new TextDecoder().decode(json.body)).tenant.enterpriseName).toBe('D1 Enterprise');
    expect(new TextDecoder().decode(markdown.body)).toContain('D1 Enterprise');
  });

  it('publishes four dated artifacts under a tenant-scoped R2 key', async () => {
    const bucket = bucketDouble();
    const stored = await publishExecutiveBriefArtifacts(bucket, d1OpportunityBriefReport());
    expect(stored).toHaveLength(4);
    expect(bucket.put).toHaveBeenCalledTimes(4);
    expect(stored.map((artifact) => artifact.key)).toEqual(bucket.put.mock.calls.map((call) => call[0]));
    expect(stored[0].key).toContain('executive-brief/D1_Enterprise/Executive_Opportunity_Brief_D1_Enterprise_2026-10-24.pdf');
    expect(stored.every((artifact) => artifact.bytes > 0)).toBe(true);
  });

  it('stops and surfaces the R2 write error', async () => {
    const bucket = bucketDouble();
    bucket.put.mockRejectedValueOnce(new Error('R2 write failed'));
    await expect(publishExecutiveBriefArtifacts(bucket, d1OpportunityBriefReport())).rejects.toThrow('R2 write failed');
    expect(bucket.put).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid PowerPoint output from the renderer', async () => {
    pptxMock.writeResult = new ArrayBuffer(2) as unknown as Uint8Array;
    await expect(renderExecutiveBriefArtifact('pptx', d1OpportunityBriefReport())).rejects.toThrow(
      'PowerPoint generation did not return a byte array.'
    );
    pptxMock.writeResult = new Uint8Array([80, 75, 3, 4]);
  });
});
