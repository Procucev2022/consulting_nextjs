import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Executive Brief Export Routes', () => {
  it('GET /api/reports/executive-brief/status should return status', async () => {
    const res = await request(app).get('/api/reports/executive-brief/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
  });

  it('GET /api/reports/executive-brief/report should return full report data', async () => {
    const res = await request(app).get('/api/reports/executive-brief/report');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('summaryCards');
    expect(res.body.data).toHaveProperty('sections');
  });

  it('POST /api/reports/executive-brief/regenerate should regenerate report', async () => {
    const res = await request(app).post('/api/reports/executive-brief/regenerate').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('reportData');
  }, 25000);

  it('GET /api/reports/executive-brief/history should return history array', async () => {
    const res = await request(app).get('/api/reports/executive-brief/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/reports/executive-brief/audit should return audit record', async () => {
    const res = await request(app).get('/api/reports/executive-brief/audit');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('exportStatus');
  }, 20000);
});
