import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OperatingModeService } from '../../src/services/operatingModeService';

describe('OperatingModeService', () => {
  const originalEnv = process.env.APP_OPERATING_MODE;

  beforeEach(() => {
    delete process.env.APP_OPERATING_MODE;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.APP_OPERATING_MODE = originalEnv;
    } else {
      delete process.env.APP_OPERATING_MODE;
    }
  });

  it('defaults to INTERNAL_ASSESSMENT when environment variable is unset', () => {
    const service = new OperatingModeService();
    expect(service.getMode()).toBe('INTERNAL_ASSESSMENT');
    expect(service.isInternalAssessment()).toBe(true);
    expect(service.isPublicSaaS()).toBe(false);
  });

  it('reads PUBLIC_SAAS when configured in environment', () => {
    process.env.APP_OPERATING_MODE = 'PUBLIC_SAAS';
    const service = new OperatingModeService();
    expect(service.getMode()).toBe('PUBLIC_SAAS');
    expect(service.isInternalAssessment()).toBe(false);
    expect(service.isPublicSaaS()).toBe(true);
  });

  it('returns appropriate config for INTERNAL_ASSESSMENT', () => {
    process.env.APP_OPERATING_MODE = 'INTERNAL_ASSESSMENT';
    const service = new OperatingModeService();
    const config = service.getConfig();
    expect(config.mode).toBe('INTERNAL_ASSESSMENT');
    expect(config.isInternalAssessment).toBe(true);
    expect(config.features.customerSaaSDashboard).toBe(false);
    expect(config.features.assessmentCentre).toBe(true);
    expect(config.allowedRoles).toContain('INTERNAL_ADMIN');
    expect(config.allowedRoles).toContain('ANALYST');
    expect(config.allowedRoles).toContain('CONSULTANT');
  });

  it('returns appropriate config for PUBLIC_SAAS', () => {
    process.env.APP_OPERATING_MODE = 'PUBLIC_SAAS';
    const service = new OperatingModeService();
    const config = service.getConfig();
    expect(config.mode).toBe('PUBLIC_SAAS');
    expect(config.isPublicSaaS).toBe(true);
    expect(service.isCustomerAccessAllowed()).toBe(true);
    expect(config.features.customerSaaSDashboard).toBe(true);
    expect(config.features.publicRegistration).toBe(true);
    expect(config.features.tierUpgrade).toBe(true);
    expect(config.features.subscriptionPurchase).toBe(true);
    expect(config.features.customerSelfOnboarding).toBe(true);
  });

  it('strictly denies dynamic mode change to PUBLIC_SAAS with setMode', () => {
    const service = new OperatingModeService();
    expect(service.isCustomerAccessAllowed()).toBe(false);
    expect(() => {
      service.setMode('PUBLIC_SAAS');
    }).toThrow(/Operating mode override denied/);
    expect(service.getMode()).toBe('INTERNAL_ASSESSMENT');
    expect(service.isCustomerAccessAllowed()).toBe(false);
  });
});
