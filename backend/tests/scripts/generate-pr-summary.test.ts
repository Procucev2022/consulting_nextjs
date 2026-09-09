import os from 'os';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseJsonFile, generateSummaryReport } from '../../../scripts/generate-pr-summary.mjs';

describe('generate-pr-summary script unit tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-summary-test-'));
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      }
    } catch {
      // ignore
    }
  });

  describe('parseJsonFile', () => {
    it('returns parsed object when file exists and contains valid JSON', () => {
      const filePath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(filePath, JSON.stringify({ key: 'value' }), 'utf8');

      const result = parseJsonFile(filePath);
      expect(result).toEqual({ key: 'value' });
    });

    it('returns null when file does not exist', () => {
      const result = parseJsonFile(path.join(tempDir, 'missing.json'));
      expect(result).toBeNull();
    });

    it('returns null when file contains malformed JSON', () => {
      const filePath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(filePath, '{ not a valid json', 'utf8');

      const result = parseJsonFile(filePath);
      expect(result).toBeNull();
    });
  });

  describe('generateSummaryReport', () => {
    it('generates summary report when all files are present and valid', () => {
      const backendDir = path.join(tempDir, 'backend');
      const frontendDir = path.join(tempDir, 'frontend');
      fs.mkdirSync(path.join(backendDir, 'coverage'), { recursive: true });
      fs.mkdirSync(path.join(frontendDir, 'coverage'), { recursive: true });

      fs.writeFileSync(
        path.join(backendDir, 'test-results.json'),
        JSON.stringify({
          numTotalTestSuites: 10,
          numTotalTests: 50,
          numPassedTests: 50,
          numFailedTests: 0
        })
      );

      fs.writeFileSync(
        path.join(frontendDir, 'test-results.json'),
        JSON.stringify({
          numTotalTestSuites: 5,
          numTotalTests: 30,
          numPassedTests: 30,
          numFailedTests: 0
        })
      );

      fs.writeFileSync(
        path.join(backendDir, 'coverage', 'coverage-summary.json'),
        JSON.stringify({
          total: {
            lines: { total: 100, covered: 95, pct: 95 },
            statements: { total: 100, covered: 95, pct: 95 },
            functions: { total: 50, covered: 48, pct: 96 },
            branches: { total: 40, covered: 38, pct: 95 }
          }
        })
      );

      fs.writeFileSync(
        path.join(frontendDir, 'coverage', 'coverage-summary.json'),
        JSON.stringify({
          total: {
            lines: { total: 100, covered: 92, pct: 92 },
            statements: { total: 100, covered: 92, pct: 92 },
            functions: { total: 50, covered: 46, pct: 92 },
            branches: { total: 40, covered: 37, pct: 92.5 }
          }
        })
      );

      const report = generateSummaryReport({ rootDir: tempDir });

      expect(report.totalTests).toBe(80);
      expect(report.totalPassed).toBe(80);
      expect(report.totalFailed).toBe(0);
      expect(report.allTestsPassed).toBe(true);
      expect(report.benchmarkSatisfied).toBe(true);
      expect(report.overallStmts).toBeGreaterThanOrEqual(90);
      expect(report.markdown).toContain('PASSED — ALL QUALITY CRITERIA MET');
      expect(report.markdown).toContain('80 passed');
    });

    it('generates report with failure status when tests fail or coverage drops below 90%', () => {
      const backendDir = path.join(tempDir, 'backend');
      const frontendDir = path.join(tempDir, 'frontend');
      fs.mkdirSync(path.join(backendDir, 'coverage'), { recursive: true });
      fs.mkdirSync(path.join(frontendDir, 'coverage'), { recursive: true });

      fs.writeFileSync(
        path.join(backendDir, 'test-results.json'),
        JSON.stringify({
          numTotalTestSuites: 5,
          numTotalTests: 20,
          numPassedTests: 18,
          numFailedTests: 2
        })
      );

      fs.writeFileSync(
        path.join(backendDir, 'coverage', 'coverage-summary.json'),
        JSON.stringify({
          total: {
            lines: { total: 100, covered: 70, pct: 70 },
            statements: { total: 100, covered: 70, pct: 70 },
            functions: { total: 50, covered: 35, pct: 70 },
            branches: { total: 40, covered: 25, pct: 62.5 }
          }
        })
      );

      const report = generateSummaryReport({ rootDir: tempDir });

      expect(report.totalFailed).toBe(2);
      expect(report.allTestsPassed).toBe(false);
      expect(report.benchmarkSatisfied).toBe(false);
      expect(report.markdown).toContain('FAILED — QUALITY GATES NOT SATISFIED');
      expect(report.markdown).toContain('❌ 2');
    });

    it('handles empty / missing files gracefully with fallback metrics', () => {
      const report = generateSummaryReport({ rootDir: tempDir });

      expect(report.totalTests).toBe(0);
      expect(report.totalPassed).toBe(0);
      expect(report.allTestsPassed).toBe(false);
      expect(report.overallLines).toBe(0);
      expect(report.markdown).toBeDefined();
    });
  });
});
