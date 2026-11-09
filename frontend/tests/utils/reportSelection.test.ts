import { describe, expect, it } from 'vitest';
import type { ReportVersion } from '../../src/types/analysisOrchestration';
import { SUPERSEDED_REPORT_STATUS } from '../../src/constants/analysisOrchestration';
import { selectActiveReport } from '../../src/utils/reportSelection';

const createReport = (
  reportVersionId: string,
  generatedAt: string,
  status: ReportVersion['status'] = 'APPROVED'
): ReportVersion => ({
  reportVersionId,
  analysisJobId: 'job-1',
  datasetVersionId: 'dataset-1',
  pcbiStateVersion: 'pcbi-1',
  generatedAt,
  status,
  isCustomerVisible: false,
  generatedBy: 'user-1'
});

describe('selectActiveReport', () => {
  it('selects the newest active report independent of response order', () => {
    const reports = [
      createReport('report-old', '2026-01-01T00:00:00.000Z'),
      createReport('report-new', '2026-03-01T00:00:00.000Z'),
      createReport('report-middle', '2026-02-01T00:00:00.000Z')
    ];

    expect(selectActiveReport(reports)?.reportVersionId).toBe('report-new');
  });

  it('ignores superseded reports even when they are newer', () => {
    const reports = [
      createReport('report-active', '2026-01-01T00:00:00.000Z'),
      createReport('report-superseded', '2026-04-01T00:00:00.000Z', SUPERSEDED_REPORT_STATUS)
    ];

    expect(selectActiveReport(reports)?.reportVersionId).toBe('report-active');
  });

  it.each([
    { reports: [] },
    { reports: [createReport('report-superseded', '2026-04-01T00:00:00.000Z', SUPERSEDED_REPORT_STATUS)] }
  ])(
    'returns null when there is no active report',
    ({ reports }) => expect(selectActiveReport(reports)).toBeNull()
  );
});
