import { describe, it, expect, vi } from 'vitest';
import { getCategories } from '../../src/controllers/categories.controller';
import { db } from '../../src/services/db';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('categories.controller', () => {
  beforeEach(() => {
    db.setCategories([{ id: 'CAT-1', name: 'Direct Materials' } as any]);
    db.setCategoryDetails([{
      id: 'CAT-1',
      category: 'Direct Materials',
      core_bucket: 'Direct Materials',
      total_3yr_spend_inr_cr: 10.5
    } as any]);
  });

  it('should return all categories when no ID is provided', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getCategories(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.categories).toBeDefined();
    expect(body.data.total3YrSpendCr).toBeGreaterThan(0);
  });

  it('should calculate total with 0 fallback when a category has 0 spend', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getCategoryDetails').mockReturnValueOnce([
      { total_3yr_spend_inr_cr: 0 } as any
    ]);

    await getCategories(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.total3YrSpendCr).toBe(0);
    spy.mockRestore();
  });

  it('should return category detail when valid ID is provided', async () => {
    const firstCat = db.getCategoryDetails()[0];
    const req: any = { query: { id: firstCat.id || firstCat.category } };
    const res = mockResponse();

    await getCategories(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.category).toBe(firstCat.category);
  });

  it('should return 404 when unknown category ID is provided', async () => {
    const req: any = { query: { id: 'NON_EXISTENT_CAT' } };
    const res = mockResponse();

    await getCategories(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it('should handle getCategories error with message', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getCategories').mockImplementationOnce(() => {
      throw new Error('Database category error');
    });

    await getCategories(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('should handle getCategories error without message fallback', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    const spy = vi.spyOn(db, 'getCategories').mockImplementationOnce(() => {
      throw {};
    });

    await getCategories(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch categories' }));
    spy.mockRestore();
  });
});
