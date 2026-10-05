import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Analysis Orchestration Routes (/api/orchestration)', () => {
  it('should list orchestration jobs', async () => {
    const res = await request(app)
      .get('/api/orchestration/jobs')
      .set('x-tenant-id', 'TNT-GLOBAL-8902')
      .set('x-user-role', 'ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should retrieve orchestration KPIs', async () => {
    const res = await request(app)
      .get('/api/orchestration/admin/kpis')
      .set('x-tenant-id', 'TNT-GLOBAL-8902')
      .set('x-user-role', 'ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAnalyses).toBeDefined();
  });

  it('should retrieve job details and readiness', async () => {
    const listRes = await request(app)
      .get('/api/orchestration/jobs')
      .set('x-tenant-id', 'TNT-GLOBAL-8902');

    const jobId = listRes.body.data[0].analysisJobId;

    const jobRes = await request(app)
      .get(`/api/orchestration/jobs/${jobId}`)
      .set('x-tenant-id', 'TNT-GLOBAL-8902');

    expect(jobRes.status).toBe(200);
    expect(jobRes.body.data.job.analysisJobId).toBe(jobId);

    const readinessRes = await request(app)
      .get(`/api/orchestration/jobs/${jobId}/readiness`)
      .set('x-tenant-id', 'TNT-GLOBAL-8902');

    expect(readinessRes.status).toBe(200);
    expect(readinessRes.body.data.spendCoveragePct).toBeDefined();
  });

  it('should download dataset for correction with audit logging', async () => {
    const listRes = await request(app)
      .get('/api/orchestration/jobs')
      .set('x-tenant-id', 'TNT-GLOBAL-8902');
    const job = listRes.body.data[0];

    const dlRes = await request(app)
      .get(`/api/orchestration/jobs/${job.analysisJobId}/download-dataset/${job.currentDataVersionId}`)
      .set('x-tenant-id', 'TNT-GLOBAL-8902')
      .set('x-user-role', 'ADMIN');

    expect(dlRes.status).toBe(200);
    expect(dlRes.headers['content-disposition']).toContain('attachment; filename=');
    expect(dlRes.text).toBeDefined();
  });

  it('should reject non-admin from downloading dataset', async () => {
    const listRes = await request(app)
      .get('/api/orchestration/jobs')
      .set('x-tenant-id', 'TNT-GLOBAL-8902');
    const job = listRes.body.data[0];

    const dlRes = await request(app)
      .get(`/api/orchestration/jobs/${job.analysisJobId}/download-dataset/${job.currentDataVersionId}`)
      .set('x-tenant-id', 'TNT-GLOBAL-8902')
      .set('x-user-role', 'CUSTOMER');

    expect(dlRes.status).toBe(403);
    expect(dlRes.body.success).toBe(false);
  });
});
