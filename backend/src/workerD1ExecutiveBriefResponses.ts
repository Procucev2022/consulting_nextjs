/**
 * Response helpers for the Executive Brief routes. Every response carries the request ID, no-store caching, and CORS
 * headers. File responses set Content-Disposition as an attachment and expose that header to browsers.
 */
import { withCors } from './workerHttp';
import {
  EXECUTIVE_BRIEF_ATTACHMENT_PREFIX,
  EXECUTIVE_BRIEF_ATTACHMENT_SUFFIX,
  EXECUTIVE_BRIEF_CACHE_CONTROL,
  EXECUTIVE_BRIEF_EXPOSED_HEADERS,
  EXECUTIVE_BRIEF_HEADER_NAMES,
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_BRIEF_MESSAGES,
  EXECUTIVE_BRIEF_REQUEST_ID_HEADER,
  EXECUTIVE_BRIEF_REQUEST_ID_PATTERN
} from './constants/executiveBriefRouteConstants';
import { EXECUTIVE_BRIEF_CONTENT_TYPES } from './constants/executiveBriefExportConstants';
import type { ExecutiveBriefIssueInput, ExecutiveBriefValidationIssue } from './types/executiveBriefRoutes';

const CACHE_CONTROL_HEADER = EXECUTIVE_BRIEF_HEADER_NAMES.CACHE_CONTROL;
const EXPOSE_HEADERS_HEADER = EXECUTIVE_BRIEF_HEADER_NAMES.EXPOSE_HEADERS;
const ALLOW_HEADER = EXECUTIVE_BRIEF_HEADER_NAMES.ALLOW;
const ATTACHMENT_HEADER_PREFIX = EXECUTIVE_BRIEF_ATTACHMENT_PREFIX;
const ATTACHMENT_HEADER_SUFFIX = EXECUTIVE_BRIEF_ATTACHMENT_SUFFIX;

export const resolveExecutiveBriefRequestId = (request: Request): string => {
  const supplied = request.headers.get(EXECUTIVE_BRIEF_REQUEST_ID_HEADER);
  return supplied !== null && EXECUTIVE_BRIEF_REQUEST_ID_PATTERN.test(supplied) ? supplied : crypto.randomUUID();
};

const applyCommonHeaders = (response: Response, requestId: string): Response => {
  response.headers.set(EXECUTIVE_BRIEF_REQUEST_ID_HEADER, requestId);
  response.headers.set(CACHE_CONTROL_HEADER, EXECUTIVE_BRIEF_CACHE_CONTROL);
  response.headers.set(EXPOSE_HEADERS_HEADER, EXECUTIVE_BRIEF_EXPOSED_HEADERS);
  return response;
};

export const executiveBriefJsonResponse = (
  request: Request,
  requestId: string,
  status: number,
  body: Record<string, unknown>
): Response =>
  applyCommonHeaders(
    withCors(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': EXECUTIVE_BRIEF_CONTENT_TYPES.JSON }
      }),
      request
    ),
    requestId
  );

export const executiveBriefErrorResponse = (
  request: Request,
  requestId: string,
  status: number,
  message: string,
  details: Record<string, unknown> = {}
): Response => executiveBriefJsonResponse(request, requestId, status, { success: false, message, requestId, ...details });

export const toValidationIssues = (issues: readonly ExecutiveBriefIssueInput[]): ExecutiveBriefValidationIssue[] =>
  issues.map((issue) => ({
    path: issue.path.map((segment) => String(segment)).join('.'),
    message: issue.message
  }));

export const executiveBriefValidationResponse = (
  request: Request,
  requestId: string,
  issues: ExecutiveBriefValidationIssue[]
): Response =>
  executiveBriefErrorResponse(request, requestId, EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST, EXECUTIVE_BRIEF_MESSAGES.validationFailed, {
    errors: issues
  });

export const executiveBriefFileResponse = (
  request: Request,
  requestId: string,
  body: Uint8Array,
  contentType: string,
  filename: string
): Response =>
  applyCommonHeaders(
    withCors(
      new Response(body, {
        status: EXECUTIVE_BRIEF_HTTP_STATUS.OK,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `${ATTACHMENT_HEADER_PREFIX}${filename}${ATTACHMENT_HEADER_SUFFIX}`,
          'Content-Length': String(body.byteLength)
        }
      }),
      request
    ),
    requestId
  );

export const methodNotAllowedResponse = (request: Request, requestId: string, allowedMethod: string): Response => {
  const response = executiveBriefErrorResponse(
    request,
    requestId,
    EXECUTIVE_BRIEF_HTTP_STATUS.METHOD_NOT_ALLOWED,
    EXECUTIVE_BRIEF_MESSAGES.methodNotAllowed
  );
  response.headers.set(ALLOW_HEADER, allowedMethod);
  return response;
};
