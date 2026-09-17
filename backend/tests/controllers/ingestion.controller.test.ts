import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getIngestionData,
  addIngestionFile,
  updateValidationRecord,
  resetValidationRecords,
  applyBlanketRemediation
} from '../../src/controllers/ingestion.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('ingestion.controller', () => {
  beforeEach(() => {
    db.setValidationRecords([{
      record_id: 'REC-INGEST-1',
      po_number: 'PO-TEST',
      vendor_name: 'Test Vendor',
      raw_desc: 'Test Desc',
      order_quantity: 10,
      net_price: 100,
      amount: 1000,
      raw_currency: 'USD',
      amount_inr: 83800,
      inr_crores: 0.00838,
      spend_year: 2024,
      issue_flag: 'Passed Clean',
      action_status: 'Ready',
      resolved: true
    } as any]);
  });

  describe('getIngestionData', () => {
    it('should return ingestion data and summary', async () => {
      const req: any = {};
      const res = mockResponse();
      await getIngestionData(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.summary).toBeDefined();
    });

    it('should handle getIngestionData error with message', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getIngestionQueue').mockImplementationOnce(() => {
        throw new Error('Ingestion failure');
      });
      await getIngestionData(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle getIngestionData error without message fallback', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'getIngestionQueue').mockImplementationOnce(() => {
        throw {};
      });
      await getIngestionData(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch ingestion data' }));
      spy.mockRestore();
    });
  });

  describe('addIngestionFile', () => {
    it('should add file successfully', async () => {
      const req: any = { body: { doc_id: 'DOC-NEW-1', file_name: 'test.pdf' } };
      const res = mockResponse();
      await addIngestionFile(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
    });

    it('should handle addIngestionFile error with message', async () => {
      const req: any = { body: {} };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'addIngestionItem').mockImplementationOnce(() => {
        throw new Error('Insert failed');
      });
      await addIngestionFile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      spy.mockRestore();
    });

    it('should handle addIngestionFile error without message fallback', async () => {
      const req: any = { body: {} };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'addIngestionItem').mockImplementationOnce(() => {
        throw {};
      });
      await addIngestionFile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to add ingestion file' }));
      spy.mockRestore();
    });
  });

  describe('updateValidationRecord', () => {
    it('should update validation record successfully', async () => {
      const firstRecord = db.getValidationRecords()[0];
      const req: any = { body: { record_id: firstRecord.record_id, po_number: 'PO-MOD' } };
      const res = mockResponse();
      await updateValidationRecord(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.po_number).toBe('PO-MOD');
    });

    it('should return 400 if record_id is missing', async () => {
      const req: any = { body: { po_number: 'PO-MOD' } };
      const res = mockResponse();
      await updateValidationRecord(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing record_id' }));
    });

    it('should return 404 if record not found', async () => {
      const req: any = { body: { record_id: 'NON_EXISTENT', po_number: 'PO-MOD' } };
      const res = mockResponse();
      await updateValidationRecord(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle update error with message', async () => {
      const req: any = { body: { record_id: 'ANY' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'updateValidationRecord').mockImplementationOnce(() => {
        throw new Error('Crash');
      });
      await updateValidationRecord(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      spy.mockRestore();
    });

    it('should handle update error without message fallback', async () => {
      const req: any = { body: { record_id: 'ANY' } };
      const res = mockResponse();
      const spy = vi.spyOn(db, 'updateValidationRecord').mockImplementationOnce(() => {
        throw {};
      });
      await updateValidationRecord(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update validation record' }));
      spy.mockRestore();
    });
  });

  describe('resetValidationRecords', () => {
    it('should reset records successfully', async () => {
      const req: any = {};
      const res = mockResponse();
      await resetValidationRecords(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
    });

    it('should handle reset error with message', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'resetValidationRecords').mockImplementationOnce(() => {
        throw new Error('Reset crash');
      });
      await resetValidationRecords(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle reset error without message fallback', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'resetValidationRecords').mockImplementationOnce(() => {
        throw {};
      });
      await resetValidationRecords(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to reset records' }));
      spy.mockRestore();
    });
  });

  describe('applyBlanketRemediation', () => {
    it('should apply remediation successfully', async () => {
      const req: any = {};
      const res = mockResponse();
      await applyBlanketRemediation(req, res);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.updatedCount).toBeDefined();
    });

    it('should handle remediation error with message', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'applyBlanketRemediation').mockImplementationOnce(() => {
        throw new Error('Remediation error');
      });
      await applyBlanketRemediation(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      spy.mockRestore();
    });

    it('should handle remediation error without message fallback', async () => {
      const req: any = {};
      const res = mockResponse();
      const spy = vi.spyOn(db, 'applyBlanketRemediation').mockImplementationOnce(() => {
        throw {};
      });
      await applyBlanketRemediation(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to apply blanket remediation' }));
      spy.mockRestore();
    });
  });
});
