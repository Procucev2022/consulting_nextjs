import { describe, it, expect } from 'vitest';
import { createAdminSchema } from '../../src/constants/adminValidation';

describe('Admin Validation Schemas (Backend)', () => {
  it('should parse valid admin creation payload with default values', () => {
    const result = createAdminSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('admin@procucev.com');
      expect(result.data.password).toBe('Procucev@123');
      expect(result.data.role).toBe('ADMIN');
      expect(result.data.subscription_tier).toBe('GOLD');
    }
  });

  it('should parse customized admin creation payload', () => {
    const result = createAdminSchema.safeParse({
      name: 'Custom Admin',
      email: 'custom.admin@procucev.com',
      password: 'CustomPassword123',
      mobile_number: '+91 99999 88888',
      company_name: 'Custom Enterprise Inc.',
      company_address: 'Custom Address, Mumbai',
      role: 'ADMIN',
      subscription_tier: 'GOLD'
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Custom Admin');
      expect(result.data.email).toBe('custom.admin@procucev.com');
      expect(result.data.password).toBe('CustomPassword123');
    }
  });

  it('should reject invalid email in admin creation schema', () => {
    const result = createAdminSchema.safeParse({
      email: 'invalid-email',
      password: 'Procucev@123'
    });

    expect(result.success).toBe(false);
  });

  it('should reject password with less than 6 characters', () => {
    const result = createAdminSchema.safeParse({
      email: 'admin@procucev.com',
      password: '123'
    });

    expect(result.success).toBe(false);
  });
});
