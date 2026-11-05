import logger from '../utils/logger';

export const parsePersistedSavingsMetrics = (
  metricsJson: string,
  requestId: string | undefined,
  assessmentId: string,
  analysisRunId: string,
  tenantId: string
): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(metricsJson);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new TypeError('Persisted savings metrics JSON must contain an object.');
  } catch (error: unknown) {
    logger.warn('Persisted assessment savings metrics were invalid; returning empty derived collections', {
      requestId,
      assessmentId,
      analysisRunId,
      tenantId
    }, error);
    return {};
  }
};
