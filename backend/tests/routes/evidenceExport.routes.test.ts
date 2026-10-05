/**
 * Integration Tests for Evidence Export Routes (Prompt 305)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Evidence Export Routes (/api/evidence)', () => {
  const adminHeaders = {
    'x-user-role': 'ADMIN',
    'x-user-id': 'admin-supertest',
    'x-tenant-id': 'TNT-GLOBAL-8902'
  };

  const customerHeaders = {
    'x-user-role': 'CUSTOMER_ANALYST',
    'x-user-id': 'cust-supertest',
    'x-tenant-id': 'TNT-GLOBAL-8902'
  };

  it('should list evidence inventory via GET /api/evidence/jobs/:jobId/inventory', async () => {
    const res = await request(app)
      .get('/api/evidence/jobs/job-init-default-001/inventory')
      .set(adminHeaders);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.items.length).toBe(9);
  });

  it('should download single evidence workbook via GET /api/evidence/jobs/:jobId/workbooks/:workbookType/download', async () => {
    const res = await request(app)
      .get('/api/evidence/jobs/job-init-default-001/workbooks/FINANCIAL_VALIDATION/download')
      .set(adminHeaders);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('05_Financial_Validation.xlsx');
    expect(res.body).toBeDefined();
  });

  it('should deny non-admin users from downloading evidence workbook', async () => {
    const res = await request(app)
      .get('/api/evidence/jobs/job-init-default-001/workbooks/FINANCIAL_VALIDATION/download')
      .set(customerHeaders);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should download complete package ZIP via GET /api/evidence/jobs/:jobId/package/download', async () => {
    const res = await request(app)
      .get('/api/evidence/jobs/job-init-default-001/package/download')
      .set(adminHeaders);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/zip');
    expect(res.headers['content-disposition']).toContain('.zip');
    expect(res.body).toBeDefined();
  });

  it('should retrieve parity validation via GET /api/evidence/jobs/:jobId/parity', async () => {
    const res = await request(app)
      .get('/api/evidence/jobs/job-init-default-001/parity')
      .set(adminHeaders);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.parity.overallStatus).toBe('PASS');
    expect(res.body.parity.passedChecks).toBe(13);
  });

  it('should retrieve savings inventory via GET /api/evidence/jobs/:jobId/savings/inventory', async () => {
    const res = await request(app)
      .get('/api/evidence/jobs/job-init-default-001/savings/inventory')
      .set(adminHeaders);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.items.length).toBe(7);
  });

  it('should download dedicated savings-type workbook via GET /api/evidence/jobs/:jobId/savings/:savingsType/download', async () => {
    const res = await request(app)
      .get('/api/evidence/jobs/job-init-default-001/savings/VENDOR_CONSOLIDATION/download')
      .set(adminHeaders);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('04A_Vendor_Consolidation_Evidence.xlsx');
    expect(res.body).toBeDefined();
  });
});
