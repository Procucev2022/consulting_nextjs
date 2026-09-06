import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('App & Route Integration Tests', () => {
  it('GET / should return online welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
  });

  it('GET /api/health should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/tenant and PUT /api/tenant', async () => {
    const getRes = await request(app).get('/api/tenant');
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.enterprise_name).toBeDefined();

    const putRes = await request(app).put('/api/tenant').send({ region: 'EU' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.data.region).toBe('EU');
  });

  it('Ingestion endpoints (GET, POST, PATCH, DELETE, remediate)', async () => {
    const getRes = await request(app).get('/api/ingestion');
    expect(getRes.status).toBe(200);

    const postRes = await request(app).post('/api/ingestion').send({
      doc_id: 'DOC-SUPERTEST',
      file_name: 'test.pdf',
      file_type: 'PDF',
      file_size_mb: 1.2
    });
    expect(postRes.status).toBe(200);

    const firstRec = getRes.body.data.validationRecords[0];
    const patchRes = await request(app).patch('/api/ingestion').send({
      record_id: firstRec.record_id,
      po_number: 'PO-TESTED'
    });
    expect(patchRes.status).toBe(200);

    const remRes = await request(app).post('/api/ingestion/remediate');
    expect(remRes.status).toBe(200);

    const delRes = await request(app).delete('/api/ingestion');
    expect(delRes.status).toBe(200);
  });

  it('Categories endpoints', async () => {
    const listRes = await request(app).get('/api/categories');
    expect(listRes.status).toBe(200);

    const firstDetail = listRes.body.data.categoryDetails[0];
    const detailRes = await request(app).get(`/api/categories?id=${encodeURIComponent(firstDetail.id)}`);
    expect(detailRes.status).toBe(200);
  });

  it('Vendors endpoints', async () => {
    const listRes = await request(app).get('/api/vendors');
    expect(listRes.status).toBe(200);

    const mergeRes = await request(app).post('/api/vendors').send({
      targetName: 'linde',
      masterId: 'VEND-MST-004',
      canonicalName: 'Linde India'
    });
    expect(mergeRes.status).toBe(200);
  });

  it('Savings endpoints', async () => {
    const listRes = await request(app).get('/api/savings');
    expect(listRes.status).toBe(200);

    const firstOpp = listRes.body.data.opportunities[0];
    const deployRes = await request(app).post('/api/savings').send({
      opp_id: firstOpp.opp_id,
      targetModule: 'proCPX'
    });
    expect(deployRes.status).toBe(200);
  });

  it('Conversion endpoints', async () => {
    const getRes = await request(app).get('/api/conversion');
    expect(getRes.status).toBe(200);

    const postRes = await request(app).post('/api/conversion').send({
      annualSpendCr: 450,
      savingsRate: 10,
      saasFeeRate: 1
    });
    expect(postRes.status).toBe(200);
  });

  it('Report endpoint', async () => {
    const res = await request(app).get('/api/report');
    expect(res.status).toBe(200);
    expect(res.body.data.executiveSummary).toBeDefined();
  });

  it('Currency endpoints', async () => {
    const allRes = await request(app).get('/api/currency');
    expect(allRes.status).toBe(200);

    const convRes = await request(app).get('/api/currency?from=USD&amount=250&year=2024');
    expect(convRes.status).toBe(200);
  });

  it('Taxonomy endpoints', async () => {
    const sampleRes = await request(app).get('/api/taxonomy');
    expect(sampleRes.status).toBe(200);

    const searchRes = await request(app).get('/api/taxonomy?q=boxwood');
    expect(searchRes.status).toBe(200);

    const lookupRes = await request(app).get('/api/taxonomy?lookup=boxwood');
    expect(lookupRes.status).toBe(200);
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/completely-non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should handle unhandled errors with 500 in error middleware', async () => {
    const res = await request(app).get('/test-error');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Test unhandled error');
  });

  it('should handle custom error status and fallback message in error middleware', async () => {
    const res = await request(app).get('/test-error-custom');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Internal Server Error');
  });

  it('should evaluate FRONTEND_URL when defined', async () => {
    const prev = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'http://localhost:3002';
    vi.resetModules();
    const { default: customApp } = await import('../src/app');
    const res = await request(customApp).get('/');
    expect(res.status).toBe(200);
    if (prev) {
      process.env.FRONTEND_URL = prev;
    } else {
      delete process.env.FRONTEND_URL;
    }
  });
});
