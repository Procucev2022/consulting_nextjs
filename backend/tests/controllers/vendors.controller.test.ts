import { describe, it, expect, vi } from 'vitest';
import { getVendors, mergeVendor } from '../../src/controllers/vendors.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('vendors.controller', () => {
  beforeEach(() => {
    db.setVendorRankings([{
      vendor_name: 'Crown Paper Box Corp',
      master_id: 'VEND-MST-004',
      category: 'Packaging',
      total_spend_inr_cr: 10.0,
      total_spend: 100000,
      price_creep_pct: 3.5,
      risk_status: 'ALIGNED',
      variance_leakage_usd: 1000,
      variance_leakage_inr_cr: 0.1,
      benchmark_index: 'ICIS',
      last_36mo_trend: [10, 10, 10]
    } as any]);
    db.setVendorDetails([{
      id: 'VEN-1',
      vendor_name: 'Crown Paper Box Corp',
      core_category: 'Packaging',
      spend_fy24_cr: 3,
      spend_fy25_cr: 3.5,
      spend_fy26_cr: 3.5,
      total_3yr_spend_inr_cr: 10,
      spend_share_pct: 10,
      yoy_growth_pct: 5,
      material_count: 2,
      top_materials: []
    } as any]);
  });

  describe('getVendors', () => {
    it('should return vendor rankings and details', async () => {
      const req: any = {};
      const res = mockResponse();

      await getVendors(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.vendorRankings).toBeDefined();
      expect(body.data.totalVolatileSpendCr).toBeGreaterThan(0);
    });

    it('should calculate total with 0 fallback when ranking has 0 spend', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getVendorRankings').mockReturnValueOnce([
        { total_spend_inr_cr: 0 } as any
      ]);

      await getVendors(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.data.totalVolatileSpendCr).toBe(0);
      spy.mockRestore();
    });

    it('should handle getVendors error with message', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getVendorRankings').mockImplementationOnce(() => {
        throw new Error('Vendor error');
      });

      await getVendors(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle getVendors error without message fallback', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getVendorRankings').mockImplementationOnce(() => {
        throw {};
      });

      await getVendors(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch vendor analytics' }));
      spy.mockRestore();
    });
  });

  describe('mergeVendor', () => {
    it('should merge vendor successfully', async () => {
      const req: any = {
        body: {
          targetName: 'crown',
          masterId: 'VEND-MST-004',
          canonicalName: 'Crown Paper'
        }
      };
      const res = mockResponse();

      await mergeVendor(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.success).toBe(true);
    });

    it('should return 400 if targetName is missing', async () => {
      const req: any = { body: { masterId: 'M1', canonicalName: 'C1' } };
      const res = mockResponse();
      await mergeVendor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if masterId is missing', async () => {
      const req: any = { body: { targetName: 'T1', canonicalName: 'C1' } };
      const res = mockResponse();
      await mergeVendor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if canonicalName is missing', async () => {
      const req: any = { body: { targetName: 'T1', masterId: 'M1' } };
      const res = mockResponse();
      await mergeVendor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle mergeVendor unexpected error with message', async () => {
      const req: any = {
        body: {
          targetName: 'linde',
          masterId: 'VEND-MST-004',
          canonicalName: 'Linde India'
        }
      };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'mergeVendor').mockImplementationOnce(() => {
        throw new Error('Merge failure');
      });

      await mergeVendor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      spy.mockRestore();
    });

    it('should handle mergeVendor unexpected error without message fallback', async () => {
      const req: any = {
        body: {
          targetName: 'linde',
          masterId: 'VEND-MST-004',
          canonicalName: 'Linde India'
        }
      };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'mergeVendor').mockImplementationOnce(() => {
        throw {};
      });

      await mergeVendor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to merge vendor' }));
      spy.mockRestore();
    });
  });
});
