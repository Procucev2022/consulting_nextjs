import { describe, it, expect, vi } from 'vitest';
import { getTenant, updateTenant } from '../../src/controllers/tenant.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('tenant.controller', () => {
  it('should return tenant data successfully', async () => {
    const req: any = {};
    const res = mockResponse();

    await getTenant(req, res);
    expect(res.json).toHaveBeenCalled();
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.data.enterprise_name).toBeDefined();
  });

  it('should handle getTenant error with message', async () => {
    const req: any = {};
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getTenant').mockImplementationOnce(() => {
      throw new Error('Database query failure');
    });

    await getTenant(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Database query failure' }));
    spy.mockRestore();
  });

  it('should handle getTenant error without message fallback', async () => {
    const req: any = {};
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getTenant').mockImplementationOnce(() => {
      throw {};
    });

    await getTenant(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch tenant' }));
    spy.mockRestore();
  });

  it('should update tenant data successfully', async () => {
    const req: any = { body: { region: 'APAC' } };
    const res = mockResponse();

    await updateTenant(req, res);
    expect(res.json).toHaveBeenCalled();
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.data.region).toBe('APAC');
  });

  it('should handle updateTenant error with message', async () => {
    const req: any = { body: {} };
    const res = mockResponse();
    const spy = vi.spyOn(db, 'updateTenant').mockImplementationOnce(() => {
      throw new Error('Update validation failure');
    });

    await updateTenant(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Update validation failure' }));
    spy.mockRestore();
  });

  it('should handle updateTenant error without message fallback', async () => {
    const req: any = { body: {} };
    const res = mockResponse();
    const spy = vi.spyOn(db, 'updateTenant').mockImplementationOnce(() => {
      throw {};
    });

    await updateTenant(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update tenant' }));
    spy.mockRestore();
  });
});
