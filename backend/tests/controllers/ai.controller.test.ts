import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { geminiService } from '../../src/services/geminiService';
import { aiCategorizationService } from '../../src/services/aiCategorizationService';
import { aiReportService } from '../../src/services/aiReportService';
import { aiAnomalyService } from '../../src/services/aiAnomalyService';
import { EXTRACTION_STATUS, CLASSIFICATION_STATUS } from '../../src/constants/ai';

describe('AI Controller Integration Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/ai/config should return Gemini model configuration status', async () => {
    const res = await request(app).get('/api/ai/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.configured).toBe(true);
    expect(res.body.primaryModel).toBeDefined();
  });

  it('POST /api/ai/extract should extract line items from documentText', async () => {
    vi.spyOn(geminiService, 'extractLineItems').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      items: [
        {
          poNumber: 'PO-101',
          vendorName: 'Vendor 1',
          itemDescription: 'Item 1',
          quantity: 5,
          unit: 'Nos',
          unitPrice: 1000,
          totalAmount: 5000,
          currency: 'INR',
          date: '2025-01-01',
          suggestedCategory: 'Cat 1'
        }
      ],
      model: 'gemini-3.6-flash',
      documentTitle: 'Doc 1',
      detectedCurrency: 'INR',
      totalSpend: 5000,
      error: null
    });

    const res = await request(app)
      .post('/api/ai/extract')
      .send({ documentText: 'Sample invoice text', fileName: 'sample.pdf' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.items.length).toBe(1);
  });

  it('POST /api/ai/categorize should categorize line items', async () => {
    vi.spyOn(aiCategorizationService, 'categorizeLineItems').mockResolvedValueOnce({
      status: CLASSIFICATION_STATUS.SUCCESS,
      mappings: [
        {
          rawLineText: 'Valve 2 inch',
          vendorIdentified: 'Vendor X',
          mappedUnspscCode: '40141600',
          unspscTitle: 'Valves',
          suggestedBucket: 'Fluid Control',
          confidenceScore: 92,
          reason: 'Matched valve'
        }
      ],
      model: 'gemini-3.6-flash',
      error: null
    });

    const res = await request(app)
      .post('/api/ai/categorize')
      .send({ items: [{ rawLineText: 'Valve 2 inch', vendorIdentified: 'Vendor X' }] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mappings.length).toBe(1);
  });

  it('POST /api/ai/executive-summary should generate CPO report', async () => {
    vi.spyOn(aiReportService, 'generateExecutiveSummary').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      data: {
        executiveSummary: 'Test executive summary',
        totalSpendEvaluated: 100,
        topRiskObservations: ['Risk 1'],
        savingsOpportunities: [],
        vendorConsolidationRoadmap: [],
        strategicRoadmapPhases: []
      },
      model: 'gemini-3.6-flash',
      error: null
    });

    const res = await request(app)
      .post('/api/ai/executive-summary')
      .send({
        tenantName: 'Enterprise Client',
        totalSpendInrCr: 100,
        categories: [],
        vendors: []
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.executiveSummary).toBe('Test executive summary');
  });

  it('POST /api/ai/analyze-anomalies should analyze validation pre-check records', async () => {
    vi.spyOn(aiAnomalyService, 'analyzeAnomalies').mockResolvedValueOnce({
      status: EXTRACTION_STATUS.SUCCESS,
      anomalies: [
        {
          recordId: 'REC-1',
          issueFlag: 'FX',
          suggestedFix: 'Fix',
          actionStatus: 'Fix Currency',
          confidence: 90
        }
      ],
      summary: 'Summary',
      model: 'gemini-3.6-flash',
      error: null
    });

    const res = await request(app)
      .post('/api/ai/analyze-anomalies')
      .send({
        records: [
          {
            recordId: 'REC-1',
            poNumber: 'PO-1',
            vendorName: 'Vendor 1',
            amount: 1000
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.anomalies.length).toBe(1);
  });
});
