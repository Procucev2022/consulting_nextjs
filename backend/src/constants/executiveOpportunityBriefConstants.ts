/**
 * Executive Opportunity Brief (10-slide PDF and PPTX) status on the Worker. The generator is not ported, so the
 * download routes answer 501 with the gap described below instead of returning a partial or placeholder file.
 */
export const EXECUTIVE_OPPORTUNITY_BRIEF_GAP = {
  code: 'OPPORTUNITY_BRIEF_NOT_PORTED',
  message: 'The Executive Opportunity Brief PDF and PPTX are not served by the Worker in this release.',
  reason: 'The Express generator builds 10 slides from in-memory opportunity registers, uses PdfCanvas slide renderers and a PPTX slide family, and writes files to disk with fs. None of those parts are ported.',
  workaround: 'Ask the administrator for an approved existing report. This web download requires the D1-backed Worker generator to be implemented.'
} as const;

