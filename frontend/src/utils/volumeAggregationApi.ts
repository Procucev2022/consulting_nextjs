import {
  API_REQUEST_ID_HEADER,
  assessmentIdQuerySchema,
  ERROR_CATEGORIES,
  UI_STRINGS,
  VOLUME_AGGREGATION_ENDPOINT
} from '../constants';
import type { ErrorCategory } from '../types/errors';
import type {
  VolumeAggregationApiFailureDetails,
  VolumeAggregationFailurePresentation,
  VolumeAggregationResult
} from '../types/module2VolumeAggregation';
import { frontendLogger } from './logger';
import { apiFetch } from './apiFetch';
import { createClientRequestId } from './requestId';

const getHttpErrorCategory = (statusCode: number): ErrorCategory => {
  if (statusCode === 401 || statusCode === 403) return ERROR_CATEGORIES.AUTH_ERROR;
  if (statusCode === 404) return ERROR_CATEGORIES.NOT_FOUND_ERROR;
  if (statusCode === 429) return ERROR_CATEGORIES.RATE_LIMIT_ERROR;
  if (statusCode >= 400 && statusCode < 500) return ERROR_CATEGORIES.VALIDATION_ERROR;
  return ERROR_CATEGORIES.SERVER_ERROR;
};

const parseAssessmentId = (assessmentId: string, requestId: string): string => {
  const parsedAssessment = assessmentIdQuerySchema.safeParse({ assessmentId });
  if (parsedAssessment.success) return parsedAssessment.data.assessmentId;

  const errorCategory = ERROR_CATEGORIES.VALIDATION_ERROR;
  const context = {
    action: 'module2.volume-aggregation.load',
    method: 'GET',
    path: VOLUME_AGGREGATION_ENDPOINT,
    statusCode: 0,
    requestId,
    errorCategory,
    field: 'assessmentId'
  };
  frontendLogger.warn('Volume aggregation request rejected before fetch', context, parsedAssessment.error);
  const failureDetails: VolumeAggregationApiFailureDetails = { errorCategory, requestId };
  throw Object.assign(
    new Error(UI_STRINGS.module2.volumeAggregation.missingAssessment, { cause: parsedAssessment.error }),
    failureDetails
  );
};

const parseVolumeAggregationResponse = (payloadValue: unknown): VolumeAggregationResult => {
  if (typeof payloadValue !== 'object' || payloadValue === null || Array.isArray(payloadValue)) {
    throw new Error(UI_STRINGS.module2.volumeAggregation.invalidResponseDetail);
  }
  const payload = payloadValue as Record<string, unknown>;
  if (payload.success !== true || typeof payload.data !== 'object' || payload.data === null || Array.isArray(payload.data)) {
    const detail = typeof payload.message === 'string' && payload.message.trim()
      ? payload.message
      : UI_STRINGS.module2.volumeAggregation.invalidResponseDetail;
    throw new Error(detail);
  }
  return payload.data as VolumeAggregationResult;
};

const getFailurePresentation = (
  response: Response | null,
  error: unknown,
  requestId: string
): VolumeAggregationFailurePresentation => {
  if (response === null) {
    return {
      errorCategory: ERROR_CATEGORIES.NETWORK_ERROR,
      message: UI_STRINGS.module2.volumeAggregation.networkFailure(requestId)
    };
  }
  if (!response.ok) {
    return {
      errorCategory: getHttpErrorCategory(response.status),
      message: UI_STRINGS.module2.volumeAggregation.httpFailure(response.status, requestId),
      statusCode: response.status
    };
  }
  return {
    errorCategory: ERROR_CATEGORIES.SERVER_ERROR,
    message: UI_STRINGS.module2.volumeAggregation.responseFailure(
      error instanceof Error ? error.message : String(error),
      requestId
    ),
    statusCode: response.status
  };
};

export const loadVolumeAggregation = async (assessmentId: string): Promise<VolumeAggregationResult> => {
  const requestId = createClientRequestId();
  const validatedAssessmentId = parseAssessmentId(assessmentId, requestId);

  const query = new URLSearchParams({ assessmentId: validatedAssessmentId });
  const path = `${VOLUME_AGGREGATION_ENDPOINT}?${query.toString()}`;
  let response: Response | null = null;
  try {
    response = await apiFetch(path, { headers: { [API_REQUEST_ID_HEADER]: requestId } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payloadValue: unknown = await response.json();
    return parseVolumeAggregationResponse(payloadValue);
  } catch (error: unknown) {
    const responseRequestId = response?.headers?.get(API_REQUEST_ID_HEADER) || requestId;
    const failure = getFailurePresentation(response, error, responseRequestId);
    const context = {
      action: 'module2.volume-aggregation.load',
      method: 'GET',
      path,
      assessmentId: validatedAssessmentId,
      statusCode: failure.statusCode ?? 0,
      requestId: responseRequestId,
      errorCategory: failure.errorCategory
    };
    frontendLogger.error('Volume aggregation API request failed', context, error);
    const failureDetails: VolumeAggregationApiFailureDetails = {
      errorCategory: failure.errorCategory,
      requestId: responseRequestId,
      ...(failure.statusCode === undefined ? {} : { statusCode: failure.statusCode })
    };
    throw Object.assign(new Error(failure.message, { cause: error }), failureDetails);
  }
};
