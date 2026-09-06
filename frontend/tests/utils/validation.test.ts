import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateInput, formatFrontendZodErrors } from '../../src/utils/validation';

describe('Frontend Validation Utilities (utils/validation.ts)', () => {
  const sampleSchema = z.object({
    username: z.string().min(2, 'Username must be at least 2 chars'),
    age: z.number().int().positive('Age must be a positive integer')
  });

  describe('formatFrontendZodErrors', () => {
    it('should format Zod issues into key-value map', () => {
      const result = sampleSchema.safeParse({ username: '', age: -5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMap = formatFrontendZodErrors(result.error);
        expect(errorMap.username).toBe('Username must be at least 2 chars');
        expect(errorMap.age).toBe('Age must be a positive integer');
      }
    });

    it('should use "root" key when issue path is empty', () => {
      const rootSchema = z.string().refine(() => false, { message: 'Root failure' });
      const result = rootSchema.safeParse('data');
      if (!result.success) {
        const errorMap = formatFrontendZodErrors(result.error);
        expect(errorMap.root).toBe('Root failure');
      }
    });
  });

  describe('validateInput', () => {
    it('should return typed success result for valid data', () => {
      const result = validateInput(sampleSchema, { username: 'john', age: 30 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('john');
        expect(result.data.age).toBe(30);
      }
    });

    it('should return structured failure result for invalid data', () => {
      const result = validateInput(sampleSchema, { username: '', age: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Validation failed');
        expect(result.errors.username).toBeDefined();
        expect(result.errors.age).toBeDefined();
      }
    });
  });
});
