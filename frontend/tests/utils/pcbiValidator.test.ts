import { describe, it, expect } from 'vitest';
import {
  validatePCBIUpload,
  generateValidationReport,
  generateErrorRecordsCsv
} from '../../src/utils/pcbiValidator';
import type { PCBIColumnMapping } from '../../src/types/pcbiAdmin';

describe('PCBI Validation & Quality Checks (frontend/src/utils/pcbiValidator.ts)', () => {
  const masterMappings: PCBIColumnMapping[] = [
    { excelColumn: 'PCBI ID', mappedField: 'pcbi_id', fieldLabel: 'PCBI ID', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Benchmark Name', mappedField: 'benchmark_name', fieldLabel: 'Benchmark Name', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Benchmark Type', mappedField: 'benchmark_type', fieldLabel: 'Benchmark Type', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Category', mappedField: 'category', fieldLabel: 'Category', isRequired: false, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Quality', mappedField: 'quality_rating', fieldLabel: 'Quality Rating', isRequired: false, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Bench %', mappedField: 'benchmarkability_percent', fieldLabel: 'Benchmarkability %', isRequired: false, confidence: 100, status: 'MAPPED', sampleValues: [] }
  ];

  const weeklyMappings: PCBIColumnMapping[] = [
    { excelColumn: 'PCBI ID', mappedField: 'pcbi_id', fieldLabel: 'PCBI ID', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Week Start', mappedField: 'week_start', fieldLabel: 'Week Start Date', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Index Value', mappedField: 'index_value', fieldLabel: 'Index Value', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Note', mappedField: 'note', fieldLabel: 'Notes', isRequired: false, confidence: 100, status: 'MAPPED', sampleValues: [] }
  ];

  const constMappings: PCBIColumnMapping[] = [
    { excelColumn: 'PCBI ID', mappedField: 'pcbi_id', fieldLabel: 'PCBI ID', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Driver', mappedField: 'constituent_name', fieldLabel: 'Constituent / Cost Driver', isRequired: true, confidence: 100, status: 'MAPPED', sampleValues: [] },
    { excelColumn: 'Weight', mappedField: 'weight_percent', fieldLabel: 'Weight %', isRequired: false, confidence: 100, status: 'MAPPED', sampleValues: [] }
  ];

  it('should validate clean dataset with zero blocking errors', () => {
    const datasets = {
      PCBI_MASTER: [
        { 'PCBI ID': 'PCBI-0001', 'Benchmark Name': 'Hot Rolled Steel', 'Benchmark Type': 'DIRECT', Category: 'Steel', Quality: 'A', 'Bench %': 80 },
        { 'PCBI ID': 'PCBI-0002', 'Benchmark Name': 'Portland Cement', 'Benchmark Type': 'DIRECT', Category: 'Cement', Quality: 'B', 'Bench %': 70 }
      ],
      WEEKLY_INDEX: [
        { 'PCBI ID': 'PCBI-0001', 'Week Start': '2020-04-06', 'Index Value': 100 },
        { 'PCBI ID': 'PCBI-0002', 'Week Start': '2020-04-06', 'Index Value': 110 }
      ],
      CONSTITUENTS: [
        { 'PCBI ID': 'PCBI-0001', Driver: 'Iron Ore', Weight: 60 },
        { 'PCBI ID': 'PCBI-0001', Driver: 'Coking Coal', Weight: 40 }
      ]
    };

    const summary = validatePCBIUpload(datasets, {
      PCBI_MASTER: masterMappings,
      WEEKLY_INDEX: weeklyMappings,
      CONSTITUENTS: constMappings
    });

    expect(summary.blockingErrorCount).toBe(0);
    expect(summary.totalRecords).toBe(6);
    expect(summary.validRecords).toBe(6);
    expect(summary.aQualityCount).toBe(1);
    expect(summary.bQualityCount).toBe(1);
    expect(summary.avgBenchmarkability).toBe(75);
    expect(summary.dateStart).toBe('2020-04-06');
    expect(summary.constituentTotals?.[0]?.status).toBe('PASS');
  });

  it('should detect missing mandatory fields as blocking errors', () => {
    const datasets = {
      PCBI_MASTER: [
        { 'PCBI ID': '', 'Benchmark Name': 'Steel', 'Benchmark Type': 'DIRECT' },
        { 'PCBI ID': 'PCBI-0002', 'Benchmark Name': '', 'Benchmark Type': 'DIRECT' },
        { 'PCBI ID': 'PCBI-0003', 'Benchmark Name': 'Cement', 'Benchmark Type': '' }
      ],
      WEEKLY_INDEX: [],
      CONSTITUENTS: []
    };

    const summary = validatePCBIUpload(datasets, {
      PCBI_MASTER: masterMappings,
      WEEKLY_INDEX: weeklyMappings,
      CONSTITUENTS: constMappings
    });

    expect(summary.blockingErrorCount).toBe(3);
    expect(summary.issues.some((i) => i.id === 'err-master-id-2')).toBe(true);
    expect(summary.issues.some((i) => i.id === 'err-master-name-3')).toBe(true);
    expect(summary.issues.some((i) => i.id === 'err-master-type-4')).toBe(true);
  });

  it('should detect invalid dates, invalid index values, and pending notes in weekly index', () => {
    const datasets = {
      PCBI_MASTER: [],
      WEEKLY_INDEX: [
        { 'PCBI ID': 'PCBI-0001', 'Week Start': 'invalid-date', 'Index Value': 100 },
        { 'PCBI ID': 'PCBI-0001', 'Week Start': '2020-04-06', 'Index Value': -10 },
        { 'PCBI ID': 'PCBI-0001', 'Week Start': '2020-04-06', 'Index Value': 100 }, // Duplicate date
        { 'PCBI ID': 'PCBI-0002', 'Week Start': '2020-04-06', 'Index Value': '', Note: 'SOURCE_PENDING' },
        { 'PCBI ID': 'PCBI-0003', 'Week Start': '2020-04-06', 'Index Value': '', Note: 'Active' }
      ],
      CONSTITUENTS: []
    };

    const summary = validatePCBIUpload(datasets, {
      PCBI_MASTER: masterMappings,
      WEEKLY_INDEX: weeklyMappings,
      CONSTITUENTS: constMappings
    });

    expect(summary.blockingErrorCount).toBe(4); // invalid date, negative val, duplicate week, missing val for active
    expect(summary.sourcePendingCount).toBe(1);
    expect(summary.issues.some((i) => i.rule === 'SOURCE_PENDING_INDEX')).toBe(true);
  });

  it('should flag constituent weights not equaling 100% as warning without blocking import', () => {
    const datasets = {
      PCBI_MASTER: [],
      WEEKLY_INDEX: [],
      CONSTITUENTS: [
        { 'PCBI ID': 'PCBI-BEARING', Driver: 'Chrome Steel', Weight: 50 },
        { 'PCBI ID': 'PCBI-BEARING', Driver: 'Brass Cage', Weight: 20 } // Total: 70%
      ]
    };

    const summary = validatePCBIUpload(datasets, {
      PCBI_MASTER: masterMappings,
      WEEKLY_INDEX: weeklyMappings,
      CONSTITUENTS: constMappings
    });

    expect(summary.blockingErrorCount).toBe(0); // WARNING, not blocking!
    expect(summary.warningCount).toBe(1);
    expect(summary.constituentWeightIssuesCount).toBe(1);
    expect(summary.constituentTotals?.[0]?.status).toBe('WARNING');
    expect(summary.constituentTotals?.[0]?.differenceFrom100).toBe(-30);
  });

  it('should generate JSON validation report and CSV error export', () => {
    const summary = validatePCBIUpload(
      {
        PCBI_MASTER: [{ 'PCBI ID': '', 'Benchmark Name': '', 'Benchmark Type': '' }],
        WEEKLY_INDEX: [],
        CONSTITUENTS: []
      },
      { PCBI_MASTER: masterMappings, WEEKLY_INDEX: weeklyMappings, CONSTITUENTS: constMappings }
    );

    const report = generateValidationReport(summary, 'test.xlsx');
    expect(report).toContain('PCBI Master Data Validation Report');
    expect(report).toContain('test.xlsx');

    const csv = generateErrorRecordsCsv(summary.issues);
    expect(csv).toContain('Issue ID,Sheet Name,Row Number,Column,Severity,Rule,Message,Resolution');
    expect(csv).toContain('REQUIRED_FIELD_MISSING');
  });

  it('validatePCBIUpload should handle empty dataset gracefully', () => {
    const summary = validatePCBIUpload({}, {});
    expect(summary.totalRecords).toBe(0);
    expect(summary.validRecords).toBe(0);
    expect(summary.blockingErrorCount).toBe(0);
    expect(summary.avgBenchmarkability).toBe(0);
  });
});
