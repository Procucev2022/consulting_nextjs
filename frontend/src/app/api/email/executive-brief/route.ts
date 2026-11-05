import { NextResponse } from 'next/server';
import { executiveBriefEmailRequestSchema } from '@/constants/validation';
import { API_REQUEST_ID_HEADER, apiRequestIdSchema, EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT, UI_STRINGS } from '@/constants';
import { validateInput } from '@/utils/validation';
import { getApiBaseUrl } from '@/utils/apiBase';
import { createClientRequestId } from '@/utils/requestId';
import frontendLogger from '@/utils/logger';

const TRAILING_SLASH_PATTERN = /\/+$/u;

const resolveRequestId = (request: Request): string => {
  const parsed = apiRequestIdSchema.safeParse(request.headers.get(API_REQUEST_ID_HEADER));
  return parsed.success ? parsed.data : createClientRequestId();
};

const responseWithRequestId = (payload: Record<string, unknown>, status: number, requestId: string): NextResponse =>
  NextResponse.json(payload, { status, headers: { [API_REQUEST_ID_HEADER]: requestId } });

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = resolveRequestId(request);
  const requestContext = {
    action: 'module5.email',
    method: request.method,
    path: new URL(request.url).pathname,
    requestId
  };
  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    frontendLogger.warn('Rejected malformed executive brief email request', { ...requestContext, statusCode: 400 }, error);
    return responseWithRequestId({ success: false, message: UI_STRINGS.module5.emailInvalidRequest }, 400, requestId);
  }

  const validation = validateInput(executiveBriefEmailRequestSchema, body);
  if (!validation.success || !validation.data) {
    frontendLogger.warn('Rejected invalid executive brief email request', { ...requestContext, statusCode: 400 });
    return responseWithRequestId({ success: false, message: UI_STRINGS.module5.emailInvalidRequest }, 400, requestId);
  }

  const configuredBackendUrl = process.env.BACKEND_API_URL || getApiBaseUrl();
  const backendUrl = configuredBackendUrl.replace(TRAILING_SLASH_PATTERN, '');
  if (!backendUrl) {
    frontendLogger.error('Executive brief email backend URL is not configured', { ...requestContext, statusCode: 503 });
    return responseWithRequestId({ success: false, message: UI_STRINGS.module5.emailBackendUnavailable }, 503, requestId);
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) {
    frontendLogger.warn('Executive brief email request had no authorization header', { ...requestContext, statusCode: 401 });
    return responseWithRequestId({ success: false, message: UI_STRINGS.errors.auth.sessionExpired }, 401, requestId);
  }

  let backendResponse: Response | undefined;
  let responseRequestId = requestId;
  try {
    backendResponse = await fetch(`${backendUrl}${EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        [API_REQUEST_ID_HEADER]: requestId
      },
      body: JSON.stringify(validation.data)
    });
    const backendRequestId = apiRequestIdSchema.safeParse(backendResponse.headers.get(API_REQUEST_ID_HEADER));
    responseRequestId = backendRequestId.success ? backendRequestId.data : requestId;
    const payload: unknown = await backendResponse.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      frontendLogger.error('Executive brief email backend returned a non-object response', {
        ...requestContext,
        backendRequestId: responseRequestId,
        statusCode: backendResponse.status,
        responseStatusCode: 502
      });
      return responseWithRequestId({ success: false, message: UI_STRINGS.module5.emailError }, 502, responseRequestId);
    }
    if (!backendResponse.ok) {
      const logContext = {
        ...requestContext,
        backendRequestId: responseRequestId,
        statusCode: backendResponse.status
      };
      if (backendResponse.status >= 500) {
        frontendLogger.error('Executive brief email backend rejected the request', logContext);
      } else {
        frontendLogger.warn('Executive brief email backend rejected the request', logContext);
      }
    }
    return responseWithRequestId(payload as Record<string, unknown>, backendResponse.status, responseRequestId);
  } catch (error: unknown) {
    frontendLogger.error('Executive brief email backend request or response parsing failed', {
      ...requestContext,
      backendRequestId: responseRequestId,
      statusCode: backendResponse?.status,
      responseStatusCode: 502
    }, error);
    return responseWithRequestId({ success: false, message: UI_STRINGS.module5.emailNetworkError }, 502, responseRequestId);
  }
}
