/**
 * HTTP responses for the evidence API. Errors are always JSON with a non-2xx status, so a browser
 * never saves an error body as a workbook or package file.
 */

import { EVIDENCE_HTTP_STATUS } from './constants/evidenceMessages';
import type { EvidenceRequestError } from './services/evidenceRequestError';
import type { EvidenceFileResponseInput } from './types/evidenceWorkbook';
import { withCors } from './workerHttp';

export const evidenceJsonResponse = (
  request: Request,
  body: object,
  status: number,
  requestId: string
): Response =>
  withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Request-Id': requestId
      }
    }),
    request
  );

export const evidenceErrorResponse = (request: Request, error: EvidenceRequestError, requestId: string): Response => {
  const body = {
    success: false,
    message: error.message,
    errorCategory: error.category,
    requestId,
    ...(error.details ? { errors: error.details } : {})
  };
  return evidenceJsonResponse(request, body, error.status, requestId);
};

export const evidenceFileResponse = (
  request: Request,
  file: EvidenceFileResponseInput,
  requestId: string
): Response =>
  withCors(
    new Response(file.bytes, {
      status: EVIDENCE_HTTP_STATUS.OK,
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': String(file.bytes.byteLength),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': requestId
      }
    }),
    request
  );
