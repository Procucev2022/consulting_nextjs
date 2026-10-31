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
  ASSESSMENT_DELIVERY_CONTENT_TYPES,
  ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT,
  ASSESSMENT_DELIVERY_ARTIFACT_LABELS,
  ASSESSMENT_DELIVERY_MODULE_METRIC_KEYS,
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

    it('defines content types, layout bounds, and no-fabrication report copy', () => {
      expect(ASSESSMENT_DELIVERY_CONTENT_TYPES.PDF).toBe('application/pdf');
      expect(ASSESSMENT_DELIVERY_CONTENT_TYPES.PPTX).toContain('presentationml');
      expect(ASSESSMENT_DELIVERY_CONTENT_TYPES.XLSX).toContain('spreadsheetml');
      expect(ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT.PAGE_WIDTH).toBeGreaterThan(ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT.LEFT);
      expect(ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT.PAGE_HEIGHT).toBeGreaterThan(ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT.BOTTOM);
      expect(ASSESSMENT_DELIVERY_ARTIFACT_LABELS.noMetrics).toContain('No persisted analytical metrics');
      expect(ASSESSMENT_DELIVERY_ARTIFACT_LABELS.noRecommendations).toContain('No D1-backed');
      expect(ASSESSMENT_DELIVERY_MODULE_METRIC_KEYS).toEqual({
        MODULE_1_REPORT: 'module1Metrics',
        MODULE_2_REPORT: 'module2Metrics',
        PCBI_REPORT: 'pcbiMetrics',
        MODULE_4_REPORT: 'module4Metrics'
      });
    });
  });

  describe('SYSTEM_BUILD_IDENTITY', () => {
    it('should be frozen and expose the application version', () => {
      expect(Object.isFrozen(SYSTEM_BUILD_IDENTITY)).toBe(true);
      expect(SYSTEM_BUILD_IDENTITY.APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/u);
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
