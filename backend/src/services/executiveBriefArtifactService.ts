/**
 * Renders Executive Brief artifacts from the certified report and publishes the set to R2. Downloads render on
 * request. Regenerate stores the four stable-named artifacts under executive-brief/<client>/<filename>.
 */
import type { CloudflareR2Bucket } from '../types/cloudflare';
import type { ExecutiveBriefReportData } from '../types/executiveBriefExportTypes';
import type {
  ExecutiveBriefFormat,
  ExecutiveBriefRenderedArtifact,
  ExecutiveBriefStoredArtifact
} from '../types/executiveBriefServices';
import {
  EXECUTIVE_BRIEF_ARTIFACT_FILENAMES,
  EXECUTIVE_BRIEF_CONTENT_TYPES,
  EXECUTIVE_BRIEF_PUBLISHED_FORMATS,
  JSON_INDENT_SPACES
} from '../constants/executiveBriefExportConstants';
import { renderExecutiveBriefPdf } from './executiveBriefPdfRenderer';
import { generateExecutiveBriefPptx } from './executiveBriefPptxGenerator';
import { formatExecutiveBriefAuditMarkdown } from './executiveBriefMarkdown';
import { buildExecutiveBriefStorageKey, buildOfficialExecutiveBriefFilename } from './executiveBriefFilenames';

const encoder = new TextEncoder();

export const renderExecutiveBriefArtifact = async (
  format: ExecutiveBriefFormat,
  report: ExecutiveBriefReportData
): Promise<ExecutiveBriefRenderedArtifact> => {
  const clientName = report.clientProfile.clientName;
  const reportDate = report.metadata.reportDate;
  switch (format) {
    case 'pdf':
      return {
        format,
        filename: EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.PDF,
        downloadFilename: buildOfficialExecutiveBriefFilename(clientName, 'pdf', reportDate),
        contentType: EXECUTIVE_BRIEF_CONTENT_TYPES.PDF,
        body: renderExecutiveBriefPdf(report)
      };
    case 'pptx':
      return {
        format,
        filename: EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.PPTX,
        downloadFilename: buildOfficialExecutiveBriefFilename(clientName, 'pptx', reportDate),
        contentType: EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX,
        body: await generateExecutiveBriefPptx(report)
      };
    case 'json':
      return {
        format,
        filename: EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.JSON,
        downloadFilename: EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.JSON,
        contentType: EXECUTIVE_BRIEF_CONTENT_TYPES.JSON,
        body: encoder.encode(`${JSON.stringify(report, null, JSON_INDENT_SPACES)}\n`)
      };
    case 'markdown':
      return {
        format,
        filename: EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT,
        downloadFilename: EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT,
        contentType: EXECUTIVE_BRIEF_CONTENT_TYPES.MARKDOWN,
        body: encoder.encode(formatExecutiveBriefAuditMarkdown(report))
      };
  }
};

/**
 * Renders every published format in order and writes each one to R2. Returns the stored keys and sizes. A failed write
 * stops the sequence, so earlier objects may already be replaced.
 */
export const publishExecutiveBriefArtifacts = async (
  bucket: CloudflareR2Bucket,
  report: ExecutiveBriefReportData
): Promise<ExecutiveBriefStoredArtifact[]> => {
  const stored: ExecutiveBriefStoredArtifact[] = [];
  for (const format of EXECUTIVE_BRIEF_PUBLISHED_FORMATS) {
    const artifact = await renderExecutiveBriefArtifact(format, report);
    const key = buildExecutiveBriefStorageKey(report.clientProfile.clientName, artifact.filename);
    await bucket.put(key, artifact.body, { httpMetadata: { contentType: artifact.contentType } });
    stored.push({
      key,
      filename: artifact.filename,
      contentType: artifact.contentType,
      bytes: artifact.body.byteLength
    });
  }
  return stored;
};
