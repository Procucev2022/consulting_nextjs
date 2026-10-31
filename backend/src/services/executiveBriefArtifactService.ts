/** Renders and publishes Executive Brief artifacts from the current D1 report. */
import type { CloudflareR2Bucket } from '../types/cloudflare';
import type { ExecutiveOpportunityBriefReport } from '../types/executiveOpportunityBrief';
import type {
  ExecutiveBriefFormat,
  ExecutiveBriefRenderedArtifact,
  ExecutiveBriefStoredArtifact
} from '../types/executiveBriefServices';
import {
  EXECUTIVE_BRIEF_CONTENT_TYPES,
  EXECUTIVE_BRIEF_PUBLISHED_FORMATS,
  JSON_INDENT_SPACES
} from '../constants/executiveBriefExportConstants';
import {
  executiveOpportunityBriefContentType,
  executiveOpportunityBriefFilename,
  formatExecutiveOpportunityBriefAuditMarkdown,
  generateExecutiveOpportunityBriefPdf,
  generateExecutiveOpportunityBriefPptx
} from './executiveOpportunityBriefExport';
import { buildExecutiveBriefStorageKey } from './executiveBriefFilenames';

const encoder = new TextEncoder();

const reportDateFor = (report: ExecutiveOpportunityBriefReport): string => report.generatedAt.slice(0, 10);

const datedArtifactFilename = (
  report: ExecutiveOpportunityBriefReport,
  extension: 'json' | 'md'
): string => {
  const pdfFilename = executiveOpportunityBriefFilename(report.tenant.enterpriseName, 'pdf', reportDateFor(report));
  const extensionIndex = pdfFilename.lastIndexOf('.');
  return `${pdfFilename.slice(0, extensionIndex)}.${extension}`;
};

export const renderExecutiveBriefArtifact = async (
  format: ExecutiveBriefFormat,
  report: ExecutiveOpportunityBriefReport
): Promise<ExecutiveBriefRenderedArtifact> => {
  const date = reportDateFor(report);
  const pdfFilename = executiveOpportunityBriefFilename(report.tenant.enterpriseName, 'pdf', date);
  const pptxFilename = executiveOpportunityBriefFilename(report.tenant.enterpriseName, 'pptx', date);
  switch (format) {
    case 'pdf':
      return {
        format,
        filename: pdfFilename,
        downloadFilename: pdfFilename,
        contentType: executiveOpportunityBriefContentType('pdf'),
        body: generateExecutiveOpportunityBriefPdf(report)
      };
    case 'pptx':
      return {
        format,
        filename: pptxFilename,
        downloadFilename: pptxFilename,
        contentType: executiveOpportunityBriefContentType('pptx'),
        body: await generateExecutiveOpportunityBriefPptx(report)
      };
    case 'json': {
      const filename = datedArtifactFilename(report, 'json');
      return {
        format,
        filename,
        downloadFilename: filename,
        contentType: EXECUTIVE_BRIEF_CONTENT_TYPES.JSON,
        body: encoder.encode(`${JSON.stringify(report, null, JSON_INDENT_SPACES)}\n`)
      };
    }
    case 'markdown': {
      const filename = datedArtifactFilename(report, 'md');
      return {
        format,
        filename,
        downloadFilename: filename,
        contentType: EXECUTIVE_BRIEF_CONTENT_TYPES.MARKDOWN,
        body: encoder.encode(formatExecutiveOpportunityBriefAuditMarkdown(report))
      };
    }
  }
};

export const publishExecutiveBriefArtifacts = async (
  bucket: CloudflareR2Bucket,
  report: ExecutiveOpportunityBriefReport
): Promise<ExecutiveBriefStoredArtifact[]> => {
  const stored: ExecutiveBriefStoredArtifact[] = [];
  for (const format of EXECUTIVE_BRIEF_PUBLISHED_FORMATS) {
    const artifact = await renderExecutiveBriefArtifact(format, report);
    const key = buildExecutiveBriefStorageKey(report.tenant.enterpriseName, artifact.filename);
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
