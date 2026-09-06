import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validateBody, validateQuery, validateHeaders, formatZodErrors } from '../../src/utils/validation';

describe('Backend Validation Utilities (utils/validation.ts)', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    count: z.number().int().positive('Count must be positive')
  });

  describe('formatZodErrors', () => {
    it('should format Zod issues into path and message array', () => {
      const result = testSchema.safeParse({ name: '', count: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(formatted).toHaveLength(2);
        expect(formatted[0].path).toBe('name');
        expect(formatted[1].path).toBe('count');
      }
    });

    it('should use "root" for empty path issue', () => {
      const rootSchema = z.string().refine(() => false, { message: 'Root error' });
      const result = rootSchema.safeParse('test');
      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(formatted[0].path).toBe('root');
      }
    });
  });

  describe('validateBody middleware', () => {
    it('should call next() and attach parsed data when body is valid', () => {
      const req: any = { body: { name: 'Valid Item', count: 5 }, path: '/test', method: 'POST' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      const middleware = validateBody(testSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body.name).toBe('Valid Item');
    });

    it('should return 400 with errors when body is invalid', () => {
      const req: any = { body: { name: '' }, path: '/test', method: 'POST' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      const middleware = validateBody(testSchema);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid request body',
          errors: expect.any(Array)
        })
      );
    });
  });

  describe('validateQuery middleware', () => {
    it('should call next() and attach parsed data when query is valid', () => {
      const req: any = { query: { name: 'Query Item', count: 10 }, path: '/test', method: 'GET' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      const middleware = validateQuery(testSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 with errors when query is invalid', () => {
      const req: any = { query: {}, path: '/test', method: 'GET' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      const middleware = validateQuery(testSchema);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid query parameters'
        })
      );
    });
  });

  describe('validateHeaders middleware', () => {
    const headerSchema = z.object({
      'x-api-key': z.string().min(5)
    }).passthrough();

    it('should call next() when headers are valid', () => {
      const req: any = { headers: { 'x-api-key': 'valid-key-123' }, path: '/test', method: 'GET' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      const middleware = validateHeaders(headerSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when headers are invalid', () => {
      const req: any = { headers: { 'x-api-key': 'abc' }, path: '/test', method: 'GET' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      const middleware = validateHeaders(headerSchema);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid request headers'
        })
      );
    });
  });
});
