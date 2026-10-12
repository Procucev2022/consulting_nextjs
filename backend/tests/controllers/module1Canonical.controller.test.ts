import { describe, it, expect, vi } from 'vitest';
import { getCanonicalModule1 } from '../../src/controllers/module1Canonical.controller';
import { Module1CanonicalService } from '../../src/services/module1CanonicalService';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('module1Canonical.controller (Prompt 329)', () => {
  it('should return canonical Module 1 view model with HTTP 200', async () => {
    const req: any = {};
    const res = mockResponse();

    const mockVm: any = {
      sourceFileName: 'VGT Testing Data.xlsx',
      validRowCount: 20241,
      validFxNormalizedSpendCr: 4073.83
    };
    const spy = vi.spyOn(Module1CanonicalService, 'getOrBuildCanonicalViewModel').mockReturnValueOnce(mockVm);

    await getCanonicalModule1(req, res);

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.sourceFileName).toBe('VGT Testing Data.xlsx');
    expect(body.data.validRowCount).toBe(20241);
    expect(body.data.validFxNormalizedSpendCr).toBeCloseTo(4073.83, 1);

    spy.mockRestore();
  });

  it('should handle error gracefully and return HTTP 500', async () => {
    const req: any = {};
    const res = mockResponse();

    const spy = vi.spyOn(Module1CanonicalService, 'getOrBuildCanonicalViewModel').mockImplementationOnce(() => {
      throw new Error('Test canonical failure');
    });

    await getCanonicalModule1(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('Failed to retrieve canonical Module 1 data');

    spy.mockRestore();
  });

  it('should pass filePath from query parameter if provided', async () => {
    const req: any = { query: { filePath: 'custom/path/vgt.xlsx' } };
    const res = mockResponse();

    const mockVm: any = {
      sourceFileName: 'custom/path/vgt.xlsx',
      validRowCount: 20241,
      validFxNormalizedSpendCr: 4073.83
    };
    const spy = vi.spyOn(Module1CanonicalService, 'getOrBuildCanonicalViewModel').mockReturnValueOnce(mockVm);

    await getCanonicalModule1(req, res);

    expect(spy).toHaveBeenCalledWith('custom/path/vgt.xlsx');
    expect(res.json).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should handle non-Error exceptions gracefully', async () => {
    const req: any = {};
    const res = mockResponse();

    const spy = vi.spyOn(Module1CanonicalService, 'getOrBuildCanonicalViewModel').mockImplementationOnce(() => {
      throw 'string error message';
    });

    await getCanonicalModule1(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('Unknown error');

    spy.mockRestore();
  });
});
