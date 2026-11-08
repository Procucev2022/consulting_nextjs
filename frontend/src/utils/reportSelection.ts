import { SUPERSEDED_REPORT_STATUS } from '../constants/analysisOrchestration';
import type { ReportVersion } from '../types/analysisOrchestration';

/** Selects the newest report that remains active, regardless of API response ordering. */
export const selectActiveReport = (reports: ReportVersion[]): ReportVersion | null => {
  const candidates = reports.filter((report) => report.status !== SUPERSEDED_REPORT_STATUS);
  const [newest] = [...candidates].sort((left, right) =>
    Date.parse(right.generatedAt) - Date.parse(left.generatedAt)
  );
  return newest ?? null;
};
