import { describe, it, expect } from 'vitest';
import {
  APP_OPERATING_MODES,
  NDA_STATUSES,
  DATA_STATUSES,
  ASSESSMENT_STATUSES,
  ASSESSMENT_ROLES,
  AUDIT_ACTIONS,
  DEFAULT_ASSESSMENT_CONFIG,
  MANDATORY_MODULE_GATES,
  REVIEW_GATES,
  DELIVERY_PACKAGE_ITEMS_SPEC,
  VGT_INVARIANT_FIGURES,
  VGT_CERTIFIED_OPPORTUNITY_FIGURES,
  SYSTEM_BUILD_IDENTITY,
  PERSISTENCE_ENVIRONMENTS,
  PERSISTENCE_CONFIG
} from '../../src/constants/assessment';

const expectKeysMatchValues = (map: Record<string, string>): void => {
  for (const [key, value] of Object.entries(map)) {
    expect(value).toBe(key);
  }
};

const countGatesWithPrefix = (prefix: string): number =>
  Object.keys(MANDATORY_MODULE_GATES).filter((gate) => gate.startsWith(prefix)).length;

describe('Assessment Constants (constants/assessment.ts)', () => {
  describe('status and role maps', () => {
    it('should define the operating modes', () => {
      expect(APP_OPERATING_MODES).toEqual({
        INTERNAL_ASSESSMENT: 'INTERNAL_ASSESSMENT',
        PUBLIC_SAAS: 'PUBLIC_SAAS'
      });
    });

    it('should define NDA and data statuses with self-named keys', () => {
      expect(NDA_STATUSES).toEqual({ PENDING: 'PENDING', SIGNED: 'SIGNED', NOT_REQUIRED: 'NOT_REQUIRED' });
      expect(DATA_STATUSES).toEqual({
        NOT_RECEIVED: 'NOT_RECEIVED',
        RECEIVED: 'RECEIVED',
        VALIDATION_IN_PROGRESS: 'VALIDATION_IN_PROGRESS',
        VALIDATED: 'VALIDATED',
        REQUIRES_CLARIFICATION: 'REQUIRES_CLARIFICATION'
      });
      expectKeysMatchValues(NDA_STATUSES);
      expectKeysMatchValues(DATA_STATUSES);
    });

    it('should define every assessment lifecycle status with self-named keys', () => {
      expect(Object.keys(ASSESSMENT_STATUSES)).toHaveLength(14);
      expect(ASSESSMENT_STATUSES.CREATED).toBe('CREATED');
      expect(ASSESSMENT_STATUSES.BLOCKED).toBe('BLOCKED');
      expectKeysMatchValues(ASSESSMENT_STATUSES);
    });

    it('should define assessment roles', () => {
      expect(ASSESSMENT_ROLES).toEqual({
        INTERNAL_ADMIN: 'INTERNAL_ADMIN',
        ANALYST: 'ANALYST',
        CONSULTANT: 'CONSULTANT',
        CUSTOMER: 'CUSTOMER'
      });
    });

    it('should define audit actions with self-named keys', () => {
      expect(Object.keys(AUDIT_ACTIONS)).toHaveLength(17);
      expect(AUDIT_ACTIONS.ASSESSMENT_CLOSED).toBe('ASSESSMENT_CLOSED');
      expectKeysMatchValues(AUDIT_ACTIONS);
    });
  });

  describe('default workspace configuration', () => {
    it('should default to internal assessment mode with the AIC identifier prefix', () => {
      expect(DEFAULT_ASSESSMENT_CONFIG.operatingMode).toBe(APP_OPERATING_MODES.INTERNAL_ASSESSMENT);
      expect(DEFAULT_ASSESSMENT_CONFIG.idPrefix).toBe('AIC');
      expect(DEFAULT_ASSESSMENT_CONFIG.defaultAnalyst).toBe('analyst@procucev.com');
      expect(DEFAULT_ASSESSMENT_CONFIG.defaultAdmin).toBe('admin@procucev.com');
      expect(DEFAULT_ASSESSMENT_CONFIG.workspaceTitle).toContain('Internal Assessment Workspace');
      expect(DEFAULT_ASSESSMENT_CONFIG.phaseName).toContain('30-DAY INTERNAL VALIDATION PHASE');
    });
  });

  describe('module gates', () => {
    it('should define 26 mandatory gates split across modules 1 to 4', () => {
      expect(Object.keys(MANDATORY_MODULE_GATES)).toHaveLength(26);
      expect(countGatesWithPrefix('M1_')).toBe(7);
      expect(countGatesWithPrefix('M2_')).toBe(6);
      expect(countGatesWithPrefix('M3_')).toBe(7);
      expect(countGatesWithPrefix('M4_')).toBe(6);
      expectKeysMatchValues(MANDATORY_MODULE_GATES);
    });

    it('should extend the mandatory gates with legacy review aliases', () => {
      for (const [gate, value] of Object.entries(MANDATORY_MODULE_GATES)) {
        expect(REVIEW_GATES[gate as keyof typeof REVIEW_GATES]).toBe(value);
      }
      expect(REVIEW_GATES.MODULE_1_RECONCILIATION).toBe('MODULE_1_RECONCILIATION');
      expect(REVIEW_GATES.EVIDENCE_WORKBOOK_GENERATION).toBe('EVIDENCE_WORKBOOK_GENERATION');
      expect(Object.keys(REVIEW_GATES)).toHaveLength(Object.keys(MANDATORY_MODULE_GATES).length + 8);
    });
  });

  describe('DELIVERY_PACKAGE_ITEMS_SPEC', () => {
    it('should list ten unique deliverables with a file suffix matching each format', () => {
      expect(DELIVERY_PACKAGE_ITEMS_SPEC).toHaveLength(10);

      const ids = DELIVERY_PACKAGE_ITEMS_SPEC.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);

      for (const item of DELIVERY_PACKAGE_ITEMS_SPEC) {
        expect(item.fileSuffix.startsWith('_')).toBe(true);
        expect(item.fileSuffix.toLowerCase().endsWith(`.${item.format.toLowerCase()}`)).toBe(true);
        expect(['PDF', 'PPTX', 'XLSX']).toContain(item.format);
      }
    });

    it('should map the evidence workbook to an XLSX deliverable', () => {
      const workbook = DELIVERY_PACKAGE_ITEMS_SPEC.find((item) => item.id === 'EVIDENCE_WORKBOOK');
      expect(workbook).toEqual({
        id: 'EVIDENCE_WORKBOOK',
        title: 'Evidence workbook',
        format: 'XLSX',
        fileSuffix: '_Consolidated_Evidence_Workbook.xlsx'
      });
    });
  });

  describe('certified VGT figures', () => {
    it('should keep the invariant figures as certified', () => {
      expect(VGT_INVARIANT_FIGURES.SOURCE_ROWS).toBe(20505);
      expect(VGT_INVARIANT_FIGURES.VALID_ROWS).toBe(20241);
      expect(VGT_INVARIANT_FIGURES.SUPPLIER_COUNT).toBe(529);
      expect(VGT_INVARIANT_FIGURES.OPERATING_PLANT_COUNT).toBe(19);
      expect(VGT_INVARIANT_FIGURES.BILLING_MONTHS_COUNT).toBe(10);
    });

    it('should freeze the opportunity figures and keep them arithmetically consistent', () => {
      expect(Object.isFrozen(VGT_CERTIFIED_OPPORTUNITY_FIGURES)).toBe(true);

      const figures = VGT_CERTIFIED_OPPORTUNITY_FIGURES;
      expect(figures.VALIDATED_SPEND_CR).toBe(VGT_INVARIANT_FIGURES.VALID_FX_NORMALIZED_SPEND_CR);
      expect(figures.BASELINE_SPEND_CR).toBe(VGT_INVARIANT_FIGURES.BASELINE_PROFILE_SPEND_CR);
      expect(figures.FX_IMPACT_CR).toBe(VGT_INVARIANT_FIGURES.FX_METHODOLOGY_IMPACT_CR);
      expect(figures.VALIDATED_SPEND_CR - figures.BASELINE_SPEND_CR).toBeCloseTo(figures.FX_IMPACT_CR, 3);
      expect(figures.GROSS_OPPORTUNITY_CR - figures.OVERLAP_DEDUCTIONS_CR).toBeCloseTo(
        figures.NET_DEFENSIBLE_OPPORTUNITY_CR,
        6
      );
      expect(figures.NET_DEFENSIBLE_OPPORTUNITY_CR).toBeGreaterThanOrEqual(figures.PROVEN_OPPORTUNITY_CR);
      expect(figures.DELIVERY_RANGE_MIN_CR).toBeLessThanOrEqual(figures.DELIVERY_RANGE_MAX_CR);
      expect((figures.POTENTIAL_SAVINGS_CR / figures.VALIDATED_SPEND_CR) * 100).toBeCloseTo(figures.SAVINGS_PCT, 1);
    });
  });

  describe('SYSTEM_BUILD_IDENTITY', () => {
    it('should be frozen and carry well-formed identifiers and checksums', () => {
      expect(Object.isFrozen(SYSTEM_BUILD_IDENTITY)).toBe(true);
      expect(SYSTEM_BUILD_IDENTITY.GIT_COMMIT).toMatch(/^[0-9a-f]{40}$/);

      for (const checksum of [
        SYSTEM_BUILD_IDENTITY.FX_MASTER_CHECKSUM,
        SYSTEM_BUILD_IDENTITY.PCBI_MASTER_CHECKSUM,
        SYSTEM_BUILD_IDENTITY.VGT_DATASET_CHECKSUM,
        SYSTEM_BUILD_IDENTITY.EVIDENCE_WORKBOOK_CHECKSUM
      ]) {
        expect(checksum).toMatch(/^[0-9a-f]{64}$/);
      }
    });

    it('should record a parseable ISO build timestamp and certified status', () => {
      expect(new Date(SYSTEM_BUILD_IDENTITY.BUILD_TIMESTAMP).toISOString()).toBe(SYSTEM_BUILD_IDENTITY.BUILD_TIMESTAMP);
      expect(SYSTEM_BUILD_IDENTITY.CERTIFICATION_STATUS).toBe('CERTIFIED');
      expect(SYSTEM_BUILD_IDENTITY.OPERATING_MODE).toBe(APP_OPERATING_MODES.INTERNAL_ASSESSMENT);
    });
  });

  describe('persistence constants', () => {
    it('should define the persistence environments', () => {
      expect(Object.isFrozen(PERSISTENCE_ENVIRONMENTS)).toBe(true);
      expect(PERSISTENCE_ENVIRONMENTS).toEqual({ TEST: 'TEST', DEVELOPMENT: 'DEVELOPMENT', DEFAULT: 'DEFAULT' });
    });

    it('should define file names and isolation error codes', () => {
      expect(Object.isFrozen(PERSISTENCE_CONFIG)).toBe(true);
      expect(PERSISTENCE_CONFIG.PRIMARY_FILENAME).toBe('assessments.json');
      expect(PERSISTENCE_CONFIG.BACKUP_FILENAME).toBe(`${PERSISTENCE_CONFIG.PRIMARY_FILENAME}.bak`);
      expect(PERSISTENCE_CONFIG.DEV_DIR_NAME).toBe('dev');
      expect(PERSISTENCE_CONFIG.TEST_DIR_NAME).toBe('test');
      expect(PERSISTENCE_CONFIG.TEST_ISOLATION_ERROR_CODE).toBe('CRITICAL_TEST_ISOLATION_BREACH');
      expect(PERSISTENCE_CONFIG.FAILED_TO_ESTABLISH_TEST_DIR_ERROR_CODE).toBe('FAILED_TO_ESTABLISH_ISOLATED_TEST_DIR');
    });
  });
});
