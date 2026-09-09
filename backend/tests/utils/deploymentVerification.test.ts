import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import {
  executeBackendOperation,
  executeDatabaseOperation,
  executeFileUploadOperation,
  runDeploymentOperationsVerification
} from '../../src/utils/deploymentVerification';
import { db } from '../../src/services/db';
import app from '../../src/app';

describe('Deployment Operations Verification Utility (utils/deploymentVerification.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeBackendOperation', () => {
    it('should successfully verify backend operation against real Express app', async () => {
      const result = await executeBackendOperation(app);
      expect(result.status).toBe('passed');
      expect(result.statusCode).toBe(200);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.details?.healthy).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle non-200 responses from backend', async () => {
      const failingApp = express();
      failingApp.get('/api/health', (_req, res) => {
        res.status(503).json({ status: 'unhealthy' });
      });

      const result = await executeBackendOperation(failingApp);
      expect(result.status).toBe('failed');
      expect(result.statusCode).toBe(503);
      expect(result.error).toContain('Expected HTTP 200, received 503');
    });

    it('should handle network/connection exceptions gracefully', async () => {
      const brokenApp = express();
      brokenApp.get('/api/health', (req) => {
        req.destroy(new Error('Connection aborted'));
      });

      const result = await executeBackendOperation(brokenApp);
      expect(result.status).toBe('failed');
      expect(result.statusCode).toBe(500);
      expect(result.error).toBeDefined();
    });
    it('should handle non-Error string exceptions in backend operation', async () => {
      const mockApp = {
        address: () => {
          throw 'Non-error network failure';
        }
      } as any;

      const result = await executeBackendOperation(mockApp);
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Backend operation failed');
    });
  });

  describe('executeDatabaseOperation', () => {
    it('should successfully verify database operation and retrieved models', async () => {
      const result = await executeDatabaseOperation();
      expect(result.status).toBe('passed');
      expect(result.model).toBe('TenantMaster');
      expect(result.recordsRetrieved).toBeGreaterThan(0);
      expect(result.details?.tenantId).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing or empty tenant record', async () => {
      vi.spyOn(db, 'getTenant').mockReturnValueOnce(null as any);

      const result = await executeDatabaseOperation();
      expect(result.status).toBe('failed');
      expect(result.recordsRetrieved).toBe(0);
      expect(result.error).toContain('Tenant record not found');
    });

    it('should handle tenant with missing tenant_id', async () => {
      vi.spyOn(db, 'getTenant').mockReturnValueOnce({} as any);

      const result = await executeDatabaseOperation();
      expect(result.status).toBe('failed');
      expect(result.recordsRetrieved).toBe(0);
      expect(result.error).toContain('Tenant record not found');
    });

    it('should handle database retrieval errors', async () => {
      vi.spyOn(db, 'getTenant').mockImplementationOnce(() => {
        throw new Error('Database read lock timeout');
      });

      const result = await executeDatabaseOperation();
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Database read lock timeout');
    });

    it('should handle non-Error exceptions in database operation', async () => {
      vi.spyOn(db, 'getTenant').mockImplementationOnce(() => {
        throw 'Raw db exception';
      });

      const result = await executeDatabaseOperation();
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Database operation failed');
    });
  });

  describe('executeFileUploadOperation', () => {
    it('should successfully verify file uploading and ingestion against real app', async () => {
      const result = await executeFileUploadOperation(app);
      expect(result.status).toBe('passed');
      expect(result.fileName).toContain('.xlsx');
      expect(result.recordsIngested).toBeGreaterThan(0);
      expect(result.details?.totalQueueLength).toBeGreaterThan(0);
    });

    it('should handle failed file upload responses with message', async () => {
      const rejectingApp = express();
      rejectingApp.use(express.json());
      rejectingApp.post('/api/ingestion', (_req, res) => {
        res.status(400).json({ success: false, message: 'Invalid file format' });
      });

      const result = await executeFileUploadOperation(rejectingApp);
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Invalid file format');
    });

    it('should handle failed file upload responses without message', async () => {
      const rejectingApp = express();
      rejectingApp.use(express.json());
      rejectingApp.post('/api/ingestion', (_req, res) => {
        res.status(502).json({ success: false });
      });

      const result = await executeFileUploadOperation(rejectingApp);
      expect(result.status).toBe('failed');
      expect(result.error).toBe('HTTP 502');
    });

    it('should handle successful upload with undefined data property', async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.post('/api/ingestion', (_req, res) => {
        res.status(200).json({ success: true });
      });

      const result = await executeFileUploadOperation(customApp);
      expect(result.status).toBe('passed');
      expect(result.details?.totalQueueLength).toBe(0);
    });

    it('should handle file upload server exceptions', async () => {
      const crashingApp = express();
      crashingApp.post('/api/ingestion', (req) => {
        req.destroy(new Error('Socket hung up'));
      });

      const result = await executeFileUploadOperation(crashingApp);
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should handle non-Error exceptions in file upload operation', async () => {
      const mockApp = {
        address: () => {
          throw 'Raw upload failure';
        }
      } as any;

      const result = await executeFileUploadOperation(mockApp);
      expect(result.status).toBe('failed');
      expect(result.error).toBe('File upload operation failed');
    });
  });

  describe('runDeploymentOperationsVerification', () => {
    it('should execute full suite and return comprehensive passing report', async () => {
      const report = await runDeploymentOperationsVerification(app);
      expect(report.success).toBe(true);
      expect(report.backendOperation.status).toBe('passed');
      expect(report.databaseOperation.status).toBe('passed');
      expect(report.fileUploadOperation.status).toBe('passed');
      expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(report.timestamp).toBeDefined();
    });

    it('should report failure if any individual operation fails', async () => {
      vi.spyOn(db, 'getTenant').mockReturnValueOnce(null as any);

      const report = await runDeploymentOperationsVerification(app);
      expect(report.success).toBe(false);
      expect(report.databaseOperation.status).toBe('failed');
    });
  });
});
