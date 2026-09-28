import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { pcbiAdminController } from '../../src/controllers/pcbiAdmin.controller';
import { pcbiAdminService } from '../../src/services/pcbiAdminService';

describe('PCBI Admin Controller Tests (backend/src/controllers/pcbiAdmin.controller.ts)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let setHeaderMock: ReturnType<typeof vi.fn>;
  let sendMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();
    setHeaderMock = vi.fn().mockReturnThis();
    sendMock = vi.fn().mockReturnThis();

    req = {
      params: {},
      body: {}
    };

    res = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json'],
      setHeader: setHeaderMock as unknown as Response['setHeader'],
      send: sendMock as unknown as Response['send']
    };
  });

  it('getVersions should return version list and active version', async () => {
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        active_version: 'V1.0'
      })
    );
  });

  it('getVersion should return 404 for unknown version', async () => {
    req.params = { version: 'V999.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('getVersion should return record for existing version', async () => {
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        version: expect.objectContaining({ version: 'V1.0' })
      })
    );
  });

  it('importMaster should reject missing file_name', async () => {
    req.body = {};
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('file_name is required')
      })
    );
  });

  it('importMaster should successfully import valid payload', async () => {
    req.body = {
      version: 'V2.0',
      file_name: 'test.xlsx',
      file_size_mb: 1.0,
      benchmarks: [],
      weeklyIndices: []
    };
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        version: 'V2.0'
      })
    );
  });

  it('publishVersion should publish version and return result', async () => {
    req.params = { version: 'V1.0' };
    req.body = { published_by: 'Sriman' };
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        activeVersion: 'V1.0'
      })
    );
  });

  it('publishVersion should return 400 on error', async () => {
    req.params = { version: 'NON_EXISTENT' };
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('getValidationReport should return 404 if report is not found', async () => {
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getValidationReport(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('getValidationReport should send report when present', async () => {
    vi.spyOn(pcbiAdminService, 'getValidationReport').mockReturnValueOnce('{"test": true}');
    req.params = { version: 'V2.0' };
    await pcbiAdminController.getValidationReport(req as Request, res as Response);
    expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(sendMock).toHaveBeenCalledWith('{"test": true}');
  });

  it('getVersions should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'getVersions').mockImplementationOnce(() => {
      throw new Error('Database crash');
    });
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('getVersion should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'getVersion').mockImplementationOnce(() => {
      throw new Error('Fetch failed');
    });
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('importMaster should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'importMaster').mockRejectedValueOnce(new Error('Import failed'));
    req.body = { file_name: 'test.xlsx' };
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('getValidationReport should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'getValidationReport').mockImplementationOnce(() => {
      throw 'Raw string error';
    });
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getValidationReport(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('getVersions should handle null active version and string errors', async () => {
    vi.spyOn(pcbiAdminService, 'getActivePublishedVersion').mockReturnValueOnce(null);
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ active_version: null }));

    vi.spyOn(pcbiAdminService, 'getVersions').mockImplementationOnce(() => {
      throw 'Non-error rejection';
    });
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('getVersion should handle non-Error throw', async () => {
    vi.spyOn(pcbiAdminService, 'getVersion').mockImplementationOnce(() => {
      throw 'Plain string error';
    });
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('importMaster should handle non-Error throw', async () => {
    vi.spyOn(pcbiAdminService, 'importMaster').mockRejectedValueOnce('Custom failure string');
    req.body = { file_name: 'valid.xlsx' };
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('publishVersion should handle Error and non-Error throw and use default publisher', async () => {
    req.params = { version: 'V1.0' };
    req.body = {}; // published_by omitted to exercise default 'Admin'
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalled();

    vi.spyOn(pcbiAdminService, 'publishVersion').mockRejectedValueOnce('String publish error');
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
  });
});


