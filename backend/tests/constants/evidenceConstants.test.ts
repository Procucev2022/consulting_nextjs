/**
 * Tests for evidence constants: message templates, input schemas, route patterns, and catalogue
 * invariants that the inventory, parity, and workbook code depend on.
 */

import { describe, expect, it } from 'vitest';
import { EVIDENCE_ERROR_CATEGORIES, EVIDENCE_HTTP_STATUS, EVIDENCE_MESSAGES } from '../../src/constants/evidenceMessages';
import { EVIDENCE_ACTIONS, EVIDENCE_BEARER_PATTERN, EVIDENCE_REQUEST_ID_PATTERN, EVIDENCE_ROUTE_PATTERNS } from '../../src/constants/evidenceRoutes';
import {
  evidenceJobParamsSchema,
  evidenceParityQuerySchema,
  evidenceSavingsParamsSchema,
  evidenceWorkbookParamsSchema
} from '../../src/constants/evidenceValidation';
import {
  EVIDENCE_PACKAGE_FILENAME_PREFIX,
  EVIDENCE_SAVINGS_METADATA,
  EVIDENCE_SAVINGS_TYPES,
  EVIDENCE_SHEET_NAMES,
  EVIDENCE_WORKBOOK_SHEETS,
  EVIDENCE_WORKBOOK_TYPES
} from '../../src/constants/evidenceWorkbook';
import { EVIDENCE_PARITY_CHECKS } from '../../src/constants/evidenceParity';
import { EVIDENCE_LEDGER_GROUP_COLUMNS } from '../../src/constants/evidenceSql';

describe('evidence message templates', () => {
  it('renders each template with its inputs', () => {
    expect(EVIDENCE_MESSAGES.accountInactive('SUSPENDED')).toContain('SUSPENDED');
    expect(EVIDENCE_MESSAGES.unsupportedRole('GUEST')).toContain('GUEST');
    expect(EVIDENCE_MESSAGES.jobNotFound('AIC-1')).toContain('AIC-1');
    expect(EVIDENCE_MESSAGES.accessDenied('AIC-1')).toContain('AIC-1');
    expect(EVIDENCE_MESSAGES.ledgerEmpty('AIC-1')).toContain('ProcurementTransaction');
    expect(EVIDENCE_MESSAGES.noApprovedRun('AIC-1')).toContain('approved');
    expect(EVIDENCE_MESSAGES.noDataVersion('AIC-1')).toContain('data version');
    expect(EVIDENCE_MESSAGES.noAnalysisRuns('AIC-1')).toContain('analysis runs');
    expect(EVIDENCE_MESSAGES.workbookUnavailable('AIC-1', 'why')).toBe('Evidence workbook is unavailable for job AIC-1. why');
    expect(EVIDENCE_MESSAGES.packageEmpty('AIC-1')).toContain('package would be empty');
    expect(EVIDENCE_MESSAGES.savingsTypeUnavailable('Title', 'OPP-1', 'x.xlsx')).toContain('Download x.xlsx');
    expect(EVIDENCE_MESSAGES.serverError('req-9')).toContain('req-9');
    expect(EVIDENCE_MESSAGES.discrepancyReason('1', '2', '3')).toBe('Discrepancy between UI (1), Evidence (2), and Source (3)');
    expect(EVIDENCE_MESSAGES.missingInputs('UI value')).toBe('Missing input: UI value');
    expect(EVIDENCE_MESSAGES.withinTolerance(0.01)).toBe('Within tolerance of 0.01');
    expect(EVIDENCE_MESSAGES.outsideTolerance(2, 0.01)).toBe('Variance 2 exceeds tolerance 0.01');
  });

  it('defines error categories and HTTP statuses for every failure class', () => {
    expect(Object.values(EVIDENCE_ERROR_CATEGORIES)).toEqual(
      ['VALIDATION_ERROR', 'AUTH_ERROR', 'NOT_FOUND_ERROR', 'CONFLICT_ERROR', 'SERVER_ERROR']
    );
    expect(EVIDENCE_HTTP_STATUS.CONFLICT).toBe(409);
  });
});

describe('evidence input schemas', () => {
  it('accepts well-formed job IDs and rejects path traversal or overlong values', () => {
    expect(evidenceJobParamsSchema.safeParse({ jobId: 'AIC-2026-0002' }).success).toBe(true);
    expect(evidenceJobParamsSchema.safeParse({ jobId: '../etc' }).success).toBe(false);
    expect(evidenceJobParamsSchema.safeParse({ jobId: 'a'.repeat(129) }).success).toBe(false);
    expect(evidenceJobParamsSchema.safeParse({ jobId: '' }).success).toBe(false);
  });

  it('accepts only catalogued workbook and savings types', () => {
    expect(evidenceWorkbookParamsSchema.safeParse({ jobId: 'AIC-1', workbookType: 'MODULE_1_EVIDENCE' }).success).toBe(true);
    expect(evidenceWorkbookParamsSchema.safeParse({ jobId: 'AIC-1', workbookType: 'MODULE_9' }).success).toBe(false);
    expect(evidenceSavingsParamsSchema.safeParse({ jobId: 'AIC-1', savingsType: 'REALIZED_SAVINGS' }).success).toBe(true);
    expect(evidenceSavingsParamsSchema.safeParse({ jobId: 'AIC-1', savingsType: 'inventory' }).success).toBe(false);
  });

  it('treats the parity workbookType query as optional but validated when present', () => {
    expect(evidenceParityQuerySchema.safeParse({}).success).toBe(true);
    expect(evidenceParityQuerySchema.safeParse({ workbookType: 'ANALYSIS_RUN_CONTROL' }).success).toBe(true);
    expect(evidenceParityQuerySchema.safeParse({ workbookType: 'other' }).success).toBe(false);
  });
});

describe('evidence route patterns and catalogue', () => {
  it('matches the seven evidence routes under /api/evidence/jobs/{jobId}', () => {
    expect(EVIDENCE_ROUTE_PATTERNS.inventory.test('/api/evidence/jobs/AIC-1/inventory')).toBe(true);
    expect(EVIDENCE_ROUTE_PATTERNS.packageDownload.test('/api/evidence/jobs/AIC-1/package/download')).toBe(true);
    expect(EVIDENCE_ROUTE_PATTERNS.savingsTypeInventory.test('/api/evidence/jobs/AIC-1/savings/REALIZED_SAVINGS/inventory')).toBe(true);
    expect(EVIDENCE_ROUTE_PATTERNS.inventory.test('/api/evidence/AIC-1/inventory')).toBe(false);
    expect(Object.keys(EVIDENCE_ACTIONS)).toHaveLength(6);
  });

  it('validates request IDs and bearer headers', () => {
    expect(EVIDENCE_REQUEST_ID_PATTERN.test('req-1.2_3')).toBe(true);
    expect(EVIDENCE_REQUEST_ID_PATTERN.test('bad id')).toBe(false);
    expect(EVIDENCE_BEARER_PATTERN.exec('Bearer abc.def')?.[1]).toBe('abc.def');
  });

  it('keeps every sheet name within Excel limits and unique within each workbook', () => {
    for (const type of EVIDENCE_WORKBOOK_TYPES) {
      const names = EVIDENCE_WORKBOOK_SHEETS[type];
      expect(new Set(names).size).toBe(names.length);
      for (const name of names) expect(name.length).toBeLessThanOrEqual(31);
    }
    expect(EVIDENCE_WORKBOOK_SHEETS.MODULE_1_EVIDENCE.at(-1)).toBe(EVIDENCE_SHEET_NAMES.PARITY);
  });

  it('gives every savings type metadata and a package filename prefix', () => {
    for (const type of EVIDENCE_SAVINGS_TYPES) {
      expect(EVIDENCE_SAVINGS_METADATA[type].filename.endsWith('.xlsx')).toBe(true);
    }
    expect(EVIDENCE_PACKAGE_FILENAME_PREFIX.endsWith('_')).toBe(true);
  });

  it('keeps parity tolerances and ledger group columns in the expected form', () => {
    expect(EVIDENCE_PARITY_CHECKS.map((check) => check.key)).toEqual([
      'TOTAL_SPEND', 'VALIDATED_SPEND', 'NET_DEFENSIBLE_OPPORTUNITY', 'SAVINGS_PERCENT'
    ]);
    expect(Object.values(EVIDENCE_LEDGER_GROUP_COLUMNS)).toEqual(['supplier_name', 'plant', 'material_group']);
  });
});
