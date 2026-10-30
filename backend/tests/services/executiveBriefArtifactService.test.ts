import { describe, expect, it } from 'vitest';
import {
  publishExecutiveBriefArtifacts,
  renderExecutiveBriefArtifact
} from '../../src/services/executiveBriefArtifactService';
import { EXECUTIVE_BRIEF_ARTIFACT_FILENAMES, EXECUTIVE_BRIEF_CONTENT_TYPES } from '../../src/constants/executiveBriefExportConstants';
import { DEFAULT_CLIENT_PROFILE } from '../../src/constants/executiveBriefConstants';
import { TEST_REPORT_DATE, bucketDouble, certifiedReport } from '../executiveBriefTestHelpers';

const latin1 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');

describe('renderExecutiveBriefArtifact', () => {
  it('renders the PDF with its stable name and a dated official download name', async () => {
    const artifact = await renderExecutiveBriefArtifact('pdf', certifiedReport());
    expect(artifact.format).toBe('pdf');
    expect(artifact.filename).toBe(EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.PDF);
    expect(artifact.downloadFilename.endsWith(`_${TEST_REPORT_DATE}.pdf`)).toBe(true);
    expect(artifact.contentType).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PDF);
    expect(latin1(artifact.body).startsWith('%PDF-1.4')).toBe(true);
  });

  it('renders the PPTX as a zip with its official download name', async () => {
    const artifact = await renderExecutiveBriefArtifact('pptx', certifiedReport());
    expect(artifact.filename).toBe(EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.PPTX);
    expect(artifact.downloadFilename.endsWith(`_${TEST_REPORT_DATE}.pptx`)).toBe(true);
    expect(artifact.contentType).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX);
    expect(latin1(artifact.body).slice(0, 2)).toBe('PK');
  });

  it('serialises the report as JSON with a trailing newline', async () => {
    const artifact = await renderExecutiveBriefArtifact('json', certifiedReport());
    const parsed = JSON.parse(latin1(artifact.body)) as { metadata: { client: string } };
    expect(parsed.metadata.client).toBe(DEFAULT_CLIENT_PROFILE.clientName);
    expect(latin1(artifact.body).endsWith('}\n')).toBe(true);
    expect(artifact.filename).toBe(EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.JSON);
    expect(artifact.downloadFilename).toBe(EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.JSON);
    expect(artifact.contentType).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.JSON);
  });

  it('renders the audit as Markdown', async () => {
    const artifact = await renderExecutiveBriefArtifact('markdown', certifiedReport());
    expect(latin1(artifact.body).startsWith('# ')).toBe(true);
    expect(artifact.filename).toBe(EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT);
    expect(artifact.contentType).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.MARKDOWN);
  });
});

describe('publishExecutiveBriefArtifacts', () => {
  it('stores the four artifacts under executive-brief/<client>/<filename> with their content types', async () => {
    const bucket = bucketDouble();
    const stored = await publishExecutiveBriefArtifacts(bucket, certifiedReport());
    const keys = bucket.put.mock.calls.map((call) => call[0]);
    expect(keys).toEqual([
      'executive-brief/UltraTech_Cement_Limited/EXECUTIVE_BRIEF.pdf',
      'executive-brief/UltraTech_Cement_Limited/EXECUTIVE_BRIEF.pptx',
      'executive-brief/UltraTech_Cement_Limited/EXECUTIVE_BRIEF_REPORT.json',
      'executive-brief/UltraTech_Cement_Limited/EXECUTIVE_BRIEF_AUDIT.md'
    ]);
    expect(bucket.put.mock.calls[0][2]).toEqual({ httpMetadata: { contentType: EXECUTIVE_BRIEF_CONTENT_TYPES.PDF } });
    expect(stored.map((artifact) => artifact.bytes > 0)).toEqual([true, true, true, true]);
  });

  it('stops at the first failed write and reports the error', async () => {
    const bucket = bucketDouble();
    bucket.put.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('R2 write failed'));
    await expect(publishExecutiveBriefArtifacts(bucket, certifiedReport())).rejects.toThrow('R2 write failed');
    expect(bucket.put).toHaveBeenCalledTimes(2);
  });
});
