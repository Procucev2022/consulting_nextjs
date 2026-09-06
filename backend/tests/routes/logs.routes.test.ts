import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Logs Routes Integration Tests', () => {
  it('GET /api/logs should return structured search results', async () => {
    const res = await request(app).get('/api/logs?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/logs/stats should return storage and retention statistics', async () => {
    const res = await request(app).get('/api/logs/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalFiles');
    expect(res.body.data).toHaveProperty('totalSizeBytes');
    expect(res.body.data).toHaveProperty('retentionDays');
    expect(res.body.data).toHaveProperty('logDir');
  });

  it('POST /api/logs/purge should trigger log retention purge', async () => {
    const res = await request(app)
      .post('/api/logs/purge')
      .send({ retentionDays: 14 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('purgedFiles');
    expect(res.body.data).toHaveProperty('bytesFreed');
  });
});
