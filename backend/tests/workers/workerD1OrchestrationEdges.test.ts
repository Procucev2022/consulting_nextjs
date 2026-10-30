import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleOrchestrationRequest } from '../../src/workerD1Orchestration';
import { ORCHESTRATION_MESSAGES } from '../../src/constants/orchestrationMessages';
import {
  ADMIN_ID,
  CUSTOMER_A_ID,
  createHarness,
  createTestRuntime,
  seedStandardFixtures,
  send,
  tokenFor,
  type OrchestrationHarness
} from './orchestrationTestHarness';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

let harness: OrchestrationHarness;
let adminToken = '';
let customerToken = '';

beforeEach(async () => {
  harness = createHarness();
  seedStandardFixtures(harness.sqlite);
  adminToken = await tokenFor(ADMIN_ID);
  customerToken = await tokenFor(CUSTOMER_A_ID);
});

afterEach(() => {
  harness.close();
});

describe('request edge cases', () => {
  it('generates a report from a POST with no body at all', async () => {
    const result = await send(harness, { method: 'POST', path: '/jobs/AIC-A1/generate-report', token: adminToken });
    expect(result.status).toBe(200);
    expect(result.body.report.reportVersionId).toBe('RPT-AIC-A1-v1');
  });

  it('answers 404 for requests whose path is outside the orchestration prefix', async () => {
    const url = new URL('https://edge.example/api/orchestration-other');
    const response = await handleOrchestrationRequest(new Request(url), harness.environment, url, createTestRuntime());
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: ORCHESTRATION_MESSAGES.routeNotFound });
  });

  it('answers 404 for a path that is only a prefix of a known route', async () => {
    const result = await send(harness, { path: '/job', token: adminToken });
    expect(result.status).toBe(404);
  });
});

describe('job detail defensive paths', () => {
  it('omits the checklist when the stored checklist is not valid', async () => {
    const generated = await send(harness, { method: 'POST', path: '/jobs/AIC-A1/generate-report', token: adminToken, body: {} });
    const reportId = generated.body.report.reportVersionId as string;
    harness.sqlite.prepare(
      "INSERT INTO OrchestrationQualityChecklist (checklist_id, assessment_id, report_version_id, checklist_json, "
        + "is_complete, unconfirmed_count, confirmed_by, confirmed_at, created_at) "
        + "VALUES ('chk-bad', 'AIC-A1', ?1, '{\"dataQuality\":{}}', 0, 1, ?2, NULL, '2026-01-01T00:00:00.000Z')"
    ).run(reportId, ADMIN_ID);
    const detail = await send(harness, { path: '/jobs/AIC-A1', token: adminToken });
    expect(detail.status).toBe(200);
    expect(detail.body.data.checklist).toBeUndefined();
  });

  it('omits the acknowledgement when the report is acknowledged but no acknowledgement row exists', async () => {
    const generated = await send(harness, { method: 'POST', path: '/jobs/AIC-A1/generate-report', token: adminToken, body: {} });
    const reportId = generated.body.report.reportVersionId as string;
    harness.sqlite.prepare(
      "UPDATE OrchestrationReportVersion SET workflow_state = 'CUSTOMER_ACKNOWLEDGED', acknowledged_at = "
        + "'2026-01-02T00:00:00.000Z' WHERE report_version_id = ?1"
    ).run(reportId);
    const detail = await send(harness, { path: '/jobs/AIC-A1', token: adminToken });
    expect(detail.status).toBe(200);
    expect(detail.body.data.acknowledgement).toBeUndefined();
    expect(detail.body.data.job.status).toBe('CUSTOMER_ACKNOWLEDGED');
  });

  it('keeps a customer-scoped job list free of reports that are still in review', async () => {
    await send(harness, { method: 'POST', path: '/jobs/AIC-A1/generate-report', token: adminToken, body: {} });
    const list = await send(harness, { path: '/jobs', token: customerToken, query: '?search=AIC-A1' });
    expect(list.body.data[0]).toMatchObject({ analysisJobId: 'AIC-A1', status: 'ADMIN_REVIEW' });
    expect(list.body.data[0]).not.toHaveProperty('reportVersionId');
  });
});
