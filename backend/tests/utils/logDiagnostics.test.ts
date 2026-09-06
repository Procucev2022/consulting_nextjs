import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  parseLogLine,
  classifyErrorCategory,
  analyzeLogEntries,
  diagnoseLogContent,
  diagnoseLogFile,
} from '../../src/utils/logDiagnostics';
import { DiagnosticLogEntry } from '../../src/types/logDiagnostics';
import { AUTO_RESOLVE_ACTIONS } from '../../src/constants/logDiagnostics';

describe('Log Diagnostics & Error Resolution Engine', () => {
  describe('parseLogLine', () => {
    it('should parse valid structured JSON log line', () => {
      const line = JSON.stringify({
        timestamp: '2026-09-06T12:00:00.000Z',
        level: 'ERROR',
        service: 'consulting-backend',
        message: 'Database query timeout',
        requestId: 'req-123',
        context: { path: '/api/categories', statusCode: 500 },
        error: { name: 'PrismaClientError', message: 'Timeout', stack: 'line 1\nline 2' },
      });

      const parsed = parseLogLine(line);
      expect(parsed).not.toBeNull();
      expect(parsed?.level).toBe('error');
      expect(parsed?.service).toBe('consulting-backend');
      expect(parsed?.message).toBe('Database query timeout');
      expect(parsed?.requestId).toBe('req-123');
      expect(parsed?.error?.name).toBe('PrismaClientError');
    });

    it('should supply default timestamp and service if omitted in JSON', () => {
      const line = JSON.stringify({
        level: 'INFO',
        message: 'Server started',
      });

      const parsed = parseLogLine(line);
      expect(parsed).not.toBeNull();
      expect(parsed?.service).toBe('unknown');
      expect(parsed?.timestamp).toBeDefined();
    });

    it('should return null for non-JSON or invalid line formats', () => {
      expect(parseLogLine('')).toBeNull();
      expect(parseLogLine('   ')).toBeNull();
      expect(parseLogLine('not json string')).toBeNull();
      expect(parseLogLine(JSON.stringify({ only: 'some-field' }))).toBeNull();
    });
  });

  describe('classifyErrorCategory', () => {
    it('should classify validation errors based on status code or message', () => {
      expect(classifyErrorCategory('Invalid input data', undefined, 400)).toBe('VALIDATION_ERROR');
      expect(classifyErrorCategory('Zod validation failure')).toBe('VALIDATION_ERROR');
      expect(classifyErrorCategory('Request failed', 'Error: invalid input received')).toBe('VALIDATION_ERROR');
    });

    it('should classify database errors based on keywords', () => {
      expect(classifyErrorCategory('PrismaClientKnownRequestError: connection timed out')).toBe('DATABASE_ERROR');
      expect(classifyErrorCategory('Failed query execution on tenant table')).toBe('DATABASE_ERROR');
      expect(classifyErrorCategory('Exhausted pool connections')).toBe('DATABASE_ERROR');
    });

    it('should classify network errors', () => {
      expect(classifyErrorCategory('Connection refused ECONNREFUSED')).toBe('NETWORK_ERROR');
      expect(classifyErrorCategory('Socket timeout during fetch')).toBe('NETWORK_ERROR');
      expect(classifyErrorCategory('Connection reset ECONNRESET')).toBe('NETWORK_ERROR');
    });

    it('should classify auth errors based on status code or keywords', () => {
      expect(classifyErrorCategory('Access denied', undefined, 401)).toBe('AUTH_ERROR');
      expect(classifyErrorCategory('Forbidden operation', undefined, 403)).toBe('AUTH_ERROR');
      expect(classifyErrorCategory('Unauthorized token expired')).toBe('AUTH_ERROR');
    });

    it('should classify internal server errors', () => {
      expect(classifyErrorCategory('Internal Server Error', undefined, 500)).toBe('INTERNAL_ERROR');
      expect(classifyErrorCategory('Unhandled exception in controller')).toBe('INTERNAL_ERROR');
    });

    it('should fallback to UNKNOWN_ERROR for unclassified messages', () => {
      expect(classifyErrorCategory('Something unexpected happened')).toBe('UNKNOWN_ERROR');
    });
  });

  describe('analyzeLogEntries & Recommendations', () => {
    it('should aggregate counts and cluster recurring errors', () => {
      const entries: DiagnosticLogEntry[] = [
        {
          timestamp: '2026-09-06T12:01:00Z',
          level: 'info',
          service: 'consulting-backend',
          message: 'Health check OK',
        },
        {
          timestamp: '2026-09-06T12:02:00Z',
          level: 'warn',
          service: 'consulting-backend',
          message: 'Slow query detected',
          context: { path: '/api/vendors', statusCode: 200 },
        },
        {
          timestamp: '2026-09-06T12:03:00Z',
          level: 'error',
          service: 'consulting-backend',
          message: 'Prisma pool connection error',
          context: { path: '/api/tenants', statusCode: 500 },
          error: { name: 'PrismaError', message: 'Pool error' },
        },
        {
          timestamp: '2026-09-06T12:04:00Z',
          level: 'error',
          service: 'consulting-backend',
          message: 'Prisma pool connection error',
          context: { path: '/api/categories', statusCode: 500 },
        },
        {
          timestamp: '2026-09-06T12:05:00Z',
          level: 'error',
          service: 'consulting-backend',
          message: 'Validation failed for tenant update',
          context: { path: '/api/tenants', statusCode: 400 },
        },
        {
          timestamp: '2026-09-06T12:06:00Z',
          level: 'error',
          service: 'consulting-backend',
          message: 'ECONNREFUSED network drop',
          context: { statusCode: 502 },
        },
        {
          timestamp: '2026-09-06T12:07:00Z',
          level: 'error',
          service: 'consulting-backend',
          message: 'Unauthorized access attempt',
          context: { statusCode: 401 },
        },
        {
          timestamp: '2026-09-06T12:08:00Z',
          level: 'error',
          service: 'consulting-backend',
          message: 'Unhandled internal fault',
          context: { statusCode: 500 },
        },
        {
          timestamp: '2026-09-06T12:09:00Z',
          level: 'error',
          service: 'consulting-backend',
          message: 'Custom mystery error',
        },
      ];

      const report = analyzeLogEntries(entries);
      expect(report.totalLinesParsed).toBe(9);
      expect(report.warnCount).toBe(1);
      expect(report.errorCount).toBe(7);
      expect(report.clusters.length).toBeGreaterThan(0);

      // Verify cluster grouping
      const dbCluster = report.clusters.find(c => c.fingerprint.includes('Prisma pool connection error'));
      expect(dbCluster).toBeDefined();
      expect(dbCluster?.count).toBe(2);
      expect(dbCluster?.affectedEndpoints).toContain('/api/tenants');
      expect(dbCluster?.affectedEndpoints).toContain('/api/categories');

      // Verify resolution recommendations
      expect(report.recommendations.length).toBe(report.clusters.length);
      const valRec = report.recommendations.find(r => r.category === 'VALIDATION_ERROR');
      expect(valRec?.action).toBe(AUTO_RESOLVE_ACTIONS.VALIDATE_INPUT);

      const netRec = report.recommendations.find(r => r.category === 'NETWORK_ERROR');
      expect(netRec?.action).toBe(AUTO_RESOLVE_ACTIONS.RETRY);

      const authRec = report.recommendations.find(r => r.category === 'AUTH_ERROR');
      expect(authRec?.action).toBe(AUTO_RESOLVE_ACTIONS.CHECK_CREDENTIALS);

      const dbRec = report.recommendations.find(r => r.category === 'DATABASE_ERROR');
      expect(dbRec?.action).toBe(AUTO_RESOLVE_ACTIONS.CHECK_DB_CONNECTION);

      const internalRec = report.recommendations.find(r => r.category === 'INTERNAL_ERROR');
      expect(internalRec?.action).toBe(AUTO_RESOLVE_ACTIONS.INVESTIGATE_UNHANDLED);

      const unknownRec = report.recommendations.find(r => r.category === 'UNKNOWN_ERROR');
      expect(unknownRec?.action).toBe(AUTO_RESOLVE_ACTIONS.INVESTIGATE_UNHANDLED);
    });
  });

  describe('diagnoseLogContent', () => {
    it('should split content by newlines and parse entries up to maxLines', () => {
      const logs = [
        JSON.stringify({ level: 'info', message: 'Ready' }),
        JSON.stringify({ level: 'error', message: 'Zod validation error', context: { statusCode: 400 } }),
        'not a json line',
      ].join('\n');

      const report = diagnoseLogContent(logs, 10);
      expect(report.totalLinesParsed).toBe(2);
      expect(report.errorCount).toBe(1);
      expect(report.clusters[0].category).toBe('VALIDATION_ERROR');
    });
  });

  describe('diagnoseLogFile', () => {
    it('should read file content and perform diagnostics', async () => {
      const tmpPath = path.resolve('test-temp-app.log');
      const logContent = JSON.stringify({
        level: 'error',
        message: 'Prisma query failed',
        context: { path: '/api/data' },
      }) + '\n';

      await fs.promises.writeFile(tmpPath, logContent, 'utf8');

      const report = await diagnoseLogFile(tmpPath);
      expect(report.totalLinesParsed).toBe(1);
      expect(report.errorCount).toBe(1);

      await fs.promises.unlink(tmpPath);
    });

    it('should handle non-existent file gracefully', async () => {
      const nonExistentPath = path.resolve('logs/non-existent-diagnostic-log-12345.log');
      const report = await diagnoseLogFile(nonExistentPath);

      expect(report.totalLinesParsed).toBe(0);
      expect(report.errorCount).toBe(0);
      expect(report.clusters).toEqual([]);
    });
  });
});
