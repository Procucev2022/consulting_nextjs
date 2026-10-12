import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { DesktopController } from '../../src/controllers/desktop.controller';

function createMockReqRes(body: Record<string, unknown> = {}, params: Record<string, string> = {}, query: Record<string, string> = {}) {
  const req = {
    body,
    params,
    query,
    headers: { 'x-request-id': 'req-test-123' }
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  } as unknown as Response;

  return { req, res };
}

describe('DesktopController', () => {
  it('handles getSystemInfo', () => {
    const { req, res } = createMockReqRes();
    DesktopController.getSystemInfo(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          operatingMode: 'INTERNAL_ASSESSMENT'
        })
      })
    );
  });

  it('handles getUpdateStatus', () => {
    const { req, res } = createMockReqRes({}, {}, { installedVersion: '1.0.1' });
    DesktopController.getUpdateStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          currentVersion: expect.any(String)
        })
      })
    );
  });

  it('handles installUpdate simulate mode', () => {
    const { req, res } = createMockReqRes({ simulateOnly: true });
    DesktopController.installUpdate(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
