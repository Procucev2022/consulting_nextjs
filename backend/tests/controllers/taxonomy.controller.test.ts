import { describe, it, expect, vi } from 'vitest';
import { getTaxonomyData } from '../../src/controllers/taxonomy.controller';
import * as taxonomyService from '../../src/services/taxonomyService';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('taxonomy.controller', () => {
  it('should return sample records when query is empty', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getTaxonomyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(30);
  });

  it('should search taxonomy when query is provided with category', async () => {
    const req: any = { query: { q: 'boxwood', category: 'Packaging Materials' } };
    const res = mockResponse();

    await getTaxonomyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('should search taxonomy when query is provided without category', async () => {
    const req: any = { query: { q: 'boxwood' } };
    const res = mockResponse();

    await getTaxonomyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('should lookup taxonomy when lookup parameter is passed', async () => {
    const req: any = { query: { lookup: 'boxwood' } };
    const res = mockResponse();

    await getTaxonomyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('should return null when lookup finds nothing', async () => {
    const req: any = { query: { lookup: 'NON_EXISTENT' } };
    const res = mockResponse();
    const spy = vi.spyOn(taxonomyService, 'lookupTaxonomy').mockReturnValueOnce(undefined);

    await getTaxonomyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data).toBeNull();
    spy.mockRestore();
  });

  it('should handle taxonomy controller error with message', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    const spy = vi.spyOn(taxonomyService, 'getAllTaxonomyRecords').mockImplementationOnce(() => {
      throw new Error('Taxonomy query error');
    });

    await getTaxonomyData(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('should handle taxonomy controller error without message fallback', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    const spy = vi.spyOn(taxonomyService, 'getAllTaxonomyRecords').mockImplementationOnce(() => {
      throw {};
    });

    await getTaxonomyData(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to search taxonomy' }));
    spy.mockRestore();
  });
});
