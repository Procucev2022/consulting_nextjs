import { NextResponse } from 'next/server';
import { executiveBriefEmailRequestSchema } from '@/constants/validation';
import { EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT, UI_STRINGS } from '@/constants';
import { validateInput } from '@/utils/validation';
import { getApiBaseUrl } from '@/utils/apiBase';
import frontendLogger from '@/utils/logger';

const TRAILING_SLASH_PATTERN = /\/+$/u;

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    frontendLogger.warn('Rejected malformed executive brief email request', { action: 'module5.email' }, error);
    return NextResponse.json({ success: false, message: UI_STRINGS.module5.emailInvalidRequest }, { status: 400 });
  }

  const validation = validateInput(executiveBriefEmailRequestSchema, body);
  if (!validation.success || !validation.data) {
    frontendLogger.warn('Rejected invalid executive brief email request', { action: 'module5.email' });
    return NextResponse.json({ success: false, message: UI_STRINGS.module5.emailInvalidRequest }, { status: 400 });
  }

  const configuredBackendUrl = process.env.BACKEND_API_URL || getApiBaseUrl();
  const backendUrl = configuredBackendUrl.replace(TRAILING_SLASH_PATTERN, '');
  if (!backendUrl) {
    frontendLogger.error('Executive brief email backend URL is not configured', { action: 'module5.email' });
    return NextResponse.json({ success: false, message: UI_STRINGS.module5.emailBackendUnavailable }, { status: 503 });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ success: false, message: UI_STRINGS.errors.auth.sessionExpired }, { status: 401 });
  }

  try {
    const response = await fetch(`${backendUrl}${EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify(validation.data)
    });
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ success: false, message: UI_STRINGS.module5.emailError }, { status: 502 });
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error: unknown) {
    frontendLogger.error('Executive brief email backend request failed', { action: 'module5.email' }, error);
    return NextResponse.json({ success: false, message: UI_STRINGS.module5.emailNetworkError }, { status: 502 });
  }
}
