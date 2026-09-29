import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { PCBIController } from '../../src/controllers/pcbi.controller';
import { db } from '../../src/services/db';

function createMockResponse(): { res: Response; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const res = {
    status,
    json
  } as unknown as Response;
  return { res, status, json };
}

describe('PCBIController Unit Tests', () => {
  let controller: PCBIController;

  beforeEach(() => {
    controller = new PCBIController();
    vi.restoreAllMocks();
  });

  it('getDashboard should return executive summary and data quality', async () => {
    const { res, json } = createMockResponse();
    const req = {} as Request;

    await controller.getDashboard(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        summary: expect.any(Object),
        data_quality: expect.any(Object)
      })
    );
  });

  it('getDashboard should handle error gracefully', async () => {
    const { res, status, json } = createMockResponse();
    const req = {} as Request;

    vi.spyOn(db, 'getPCBILastCalculationResults').mockImplementationOnce(() => {
      throw new Error('Database read failed');
    });

    await controller.getDashboard(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Failed to retrieve PCBI dashboard' });
  });

  it('calculate should run calculation engine and return results', async () => {
    const { res, json } = createMockResponse();
    const req = {
      body: { transactions: [] }
    } as unknown as Request;

    await controller.calculate(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'PCBI Benchmark Intelligence calculated successfully.'
      })
    );
  });

  it('calculate should handle error gracefully', async () => {
    const { res, status, json } = createMockResponse();
    const req = { body: {} } as Request;

    vi.spyOn(db, 'runPCBICalculation').mockImplementationOnce(() => {
      throw new Error('Calculation engine failed');
    });

    await controller.calculate(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Failed to run PCBI calculation' });
  });

  it('getOpportunities should apply filters and pagination correctly', async () => {
    const { res, json } = createMockResponse();
    const req = {
      query: {
        search: 'PO',
        sector: 'Manufacturing',
        vendor: 'ALL',
        quality: 'EXCELLENT',
        page: '1',
        limit: '10'
      }
    } as unknown as Request;

    await controller.getOpportunities(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        page: 1,
        limit: 10
      })
    );
  });

  it('getOpportunities should handle error gracefully', async () => {
    const { res, status, json } = createMockResponse();
    const req = { query: {} } as unknown as Request;

    vi.spyOn(db, 'getPCBILastCalculationResults').mockImplementationOnce(() => {
      throw new Error('Opportunities failure');
    });

    await controller.getOpportunities(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Failed to retrieve opportunities' });
  });

  it('getOpportunityAudit should return 404 for non-existent id', async () => {
    const { res, status, json } = createMockResponse();
    const req = { params: { id: 'non-existent-id' } } as unknown as Request;

    vi.spyOn(db, 'getPCBIExplainabilityAudit').mockReturnValueOnce(null);

    await controller.getOpportunityAudit(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Transaction audit record not found.' });
  });

  it('getOpportunityAudit should return audit data if found', async () => {
    const { res, json } = createMockResponse();
    const req = { params: { id: 'test-id' } } as unknown as Request;

    vi.spyOn(db, 'getPCBIExplainabilityAudit').mockReturnValueOnce({
      transaction: {} as any,
      benchmark: {} as any,
      steps: []
    });

    await controller.getOpportunityAudit(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        audit: expect.any(Object)
      })
    );
  });

  it('getBasePurchases should return base purchases list', async () => {
    const { res, json } = createMockResponse();
    const req = {} as Request;

    await controller.getBasePurchases(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: expect.any(Number)
      })
    );
  });

  it('resetBasePurchase should reject if required fields are missing', async () => {
    const { res, status, json } = createMockResponse();
    const req = { body: {} } as Request;

    await controller.resetBasePurchase(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Comparable key and reset reason are required.'
    });
  });

  it('resetBasePurchase should reset base purchase and return summary', async () => {
    const { res, json } = createMockResponse();
    const req = {
      body: {
        comparable_key: 'MAT-101',
        reason: 'Vendor contract renegotiated',
        user_name: 'Admin'
      }
    } as Request;

    await controller.resetBasePurchase(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        summary: expect.any(Object)
      })
    );
  });

  it('getMaterialTrend should return 404 for non-existent material', async () => {
    const { res, status, json } = createMockResponse();
    const req = { params: { material_id: 'NON_EXISTENT' } } as unknown as Request;

    await controller.getMaterialTrend(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Material not found in calculation records.'
    });
  });

  it('getBenchmarks and addBenchmark should handle retrieval and creation', async () => {
    const { res: getRes, json: getJson } = createMockResponse();
    await controller.getBenchmarks({} as Request, getRes);
    expect(getJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const { res: addRes, status: addStatus, json: addJson } = createMockResponse();
    const addReq = { body: { name: 'Benchmark A' } } as Request;
    await controller.addBenchmark(addReq, addRes);
    expect(addStatus).toHaveBeenCalledWith(201);
    expect(addJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getComponents and addComponent should handle retrieval and creation', async () => {
    const { res: getRes, json: getJson } = createMockResponse();
    await controller.getComponents({ query: {} } as unknown as Request, getRes);
    expect(getJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const { res: addRes, status: addStatus, json: addJson } = createMockResponse();
    const addReq = { body: { name: 'Component 1' } } as Request;
    await controller.addComponent(addReq, addRes);
    expect(addStatus).toHaveBeenCalledWith(201);
    expect(addJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getWeeklyIndices and getUNSPSCMappings should return successfully', async () => {
    const { res: indRes, json: indJson } = createMockResponse();
    await controller.getWeeklyIndices({ query: {} } as unknown as Request, indRes);
    expect(indJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const { res: mapRes, json: mapJson } = createMockResponse();
    await controller.getUNSPSCMappings({} as Request, mapRes);
    expect(mapJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
