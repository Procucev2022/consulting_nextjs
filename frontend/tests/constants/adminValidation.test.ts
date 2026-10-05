import { describe, it, expect } from 'vitest';
import {
  adminLoginFormSchema,
  createAdminDetailsSchema
} from '../../src/constants/adminValidation';

describe('Admin Validation Schemas (Frontend)', () => {
  describe('adminLoginFormSchema', () => {
    it('should validate valid email and password', () => {
      const res = adminLoginFormSchema.safeParse({
        email: 'admin@procucev.com',
        password: 'Procucev@123'
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('admin@procucev.com');
        expect(res.data.password).toBe('Procucev@123');
      }
    });

    it('should reject invalid email', () => {
      const res = adminLoginFormSchema.safeParse({
        email: 'invalid-email-address',
        password: 'Procucev@123'
      });
      expect(res.success).toBe(false);
    });

    it('should reject empty password', () => {
      const res = adminLoginFormSchema.safeParse({
        email: 'admin@procucev.com',
        password: ''
      });
      expect(res.success).toBe(false);
    });
  });

  describe('createAdminDetailsSchema', () => {
    it('should populate default values when empty object is provided', () => {
      const res = createAdminDetailsSchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('admin@procucev.com');
        expect(res.data.password).toBe('Procucev@123');
        expect(res.data.name).toBe('System Administrator');
        expect(res.data.role).toBe('ADMIN');
        expect(res.data.subscription_tier).toBe('GOLD');
      }
    });

    it('should accept valid customized admin details', () => {
      const res = createAdminDetailsSchema.safeParse({
        name: 'Enterprise Super Admin',
        email: 'superadmin@procucev.com',
        mobile_number: '+91 91234 56789',
        company_name: 'aiCEV Corp',
        company_address: 'Bangalore, Karnataka',
        password: 'StrongAdmin@2026',
        confirm_password: 'StrongAdmin@2026',
        role: 'ADMIN',
        subscription_tier: 'GOLD'
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('superadmin@procucev.com');
      }
    });

    it('should reject mismatched passwords', () => {
      const res = createAdminDetailsSchema.safeParse({
        email: 'admin@procucev.com',
        password: 'Password123',
        confirm_password: 'DifferentPassword123'
      });
      expect(res.success).toBe(false);
    });

    it('should reject password shorter than 6 characters', () => {
      const res = createAdminDetailsSchema.safeParse({
        email: 'admin@procucev.com',
        password: '123'
      });
      expect(res.success).toBe(false);
    });
  });
});
