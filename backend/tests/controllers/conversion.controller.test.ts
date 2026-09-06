import { describe, it, expect, vi } from 'vitest';
import { getConversionStages, calculateConversionMetrics } from '../../src/controllers/conversion.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('conversion.controller', () => {
  describe('getConversionStages', () => {
    it('should return funnel stages', async () => {
      const req: any = {};
      const res = mockResponse();

      await getConversionStages(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should handle getConversionStages error with message', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getFunnelStages').mockImplementationOnce(() => {
        throw new Error('Funnel error');
      });

      await getConversionStages(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle getConversionStages error without message fallback', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getFunnelStages').mockImplementationOnce(() => {
        throw {};
      });

      await getConversionStages(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch conversion stages' }));
      spy.mockRestore();
    });
  });

  describe('calculateConversionMetrics', () => {
    it('should calculate metrics with default parameters', async () => {
      const req: any = { body: {} };
      const res = mockResponse();

      await calculateConversionMetrics(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.roiMultiple).toBeGreaterThan(0);
    });

    it('should calculate metrics with zero platform fee to cover || 1 branch', async () => {
      const req: any = { body: { annualSpendCr: 100, savingsRate: 10, saasFeeRate: 0 } };
      const res = mockResponse();

      await calculateConversionMetrics(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.data.platformFeeCr).toBe(0);
      expect(body.data.roiMultiple).toBe(10); // 10 / 1 = 10
    });

    it('should handle calculation error with message', async () => {
      const req: any = {
        get body() {
          throw new Error('Malformed payload');
        }
      };
      const res = mockResponse();

      await calculateConversionMetrics(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle calculation error without message fallback', async () => {
      const req: any = {
        get body() {
          throw {};
        }
      };
      const res = mockResponse();

      await calculateConversionMetrics(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to calculate commercial metrics' }));
    });
  });
});
