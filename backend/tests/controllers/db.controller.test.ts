import { describe, expect, it, vi } from 'vitest';
import { dbController } from '../../src/controllers/db.controller';
import { prisma } from '../../src/services/db';
import type { Request, Response } from 'express';

const mockResponse = (): {
  status: any;
  json: any;
  statusCode?: number;
  data?: any;
} => {
  const res: any = {};
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((data: any) => {
    res.data = data;
    return res;
  });
  return res;
};

describe('DBController', () => {
  it('getDBStatus returns database status', async () => {
    vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([{ ping: 1 }] as any);
    const req = { headers: {} } as Request;
    const res = mockResponse() as unknown as Response;

    await dbController.getDBStatus(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it('getDBMetrics returns query auditor metrics and cache size', async () => {
    const req = {} as Request;
    const res = mockResponse() as unknown as Response;

    await dbController.getDBMetrics(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it('getTableData returns 400 for invalid table name', async () => {
    const req = { query: { table: 'InvalidTable' } } as unknown as Request;
    const res = mockResponse() as unknown as Response;

    await dbController.getTableData(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getTableData returns rows for valid table User', async () => {
    vi.spyOn(prisma.user, 'count').mockResolvedValue(1);
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
      { id: '1', name: 'Admin', email: 'admin@example.com', password_hash: 'secret' }
    ] as any);

    const req = { query: { table: 'User', page: '1', limit: '10' } } as unknown as Request;
    const res = mockResponse() as unknown as Response;

    await dbController.getTableData(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it('testConnection returns success when ping resolves', async () => {
    vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([{ ping: 1 }] as any);
    const req = {} as Request;
    const res = mockResponse() as unknown as Response;

    await dbController.testConnection(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it('testConnection returns 503 when ping throws', async () => {
    vi.spyOn(prisma, '$queryRawUnsafe').mockRejectedValue(new Error('Connection timeout'));
    const req = {} as Request;
    const res = mockResponse() as unknown as Response;

    await dbController.testConnection(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
