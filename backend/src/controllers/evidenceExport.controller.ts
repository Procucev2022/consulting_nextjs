/**
 * Evidence Export Controller (Prompt 305)
 * Handles HTTP requests for evidence workbooks, zip packages, and parity validation.
 */

import type { Request, Response } from 'express';
import {
  downloadWorkbookParamSchema,
  downloadPackageParamSchema,
  parityQuerySchema,
  downloadSavingsTypeParamSchema,
  savingsTypeInventoryParamSchema
} from '../constants/evidenceValidation';
import { evidenceWorkbookService } from '../services/evidenceWorkbookService';
import type { EvidenceWorkbookType, CanonicalSavingsType } from '../types/evidenceWorkbook';
import logger from '../utils/logger';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    userId?: string;
    role?: string;
    tenantId?: string;
    email?: string;
  };
}

export class EvidenceExportController {
  /**
   * Resolves authenticated user and tenant
   */
  private static resolveUser(req: Request): { id: string; role: string; tenantId: string; email?: string } {
    const customReq = req as RequestWithUser;
    const u = customReq.user;
    const h = req.headers;
    const headerRole = (h?.['x-user-role'] || h?.['x-role']) as string | undefined;
    const headerTenant = (h?.['x-tenant-id'] || h?.['x-buyer-id']) as string | undefined;
    const headerUserId = h?.['x-user-id'] as string | undefined;

    const id = u?.id ?? u?.userId ?? headerUserId ?? 'usr-default';
    const role = (headerRole ?? u?.role ?? 'ADMIN').toUpperCase();
    const tenantId = u?.tenantId ?? headerTenant ?? 'TNT-GLOBAL-8902';

    return { id, role, tenantId, email: u?.email ?? 'admin@procucev.com' };
  }

  /**
   * GET /api/evidence/:jobId/inventory
   */
  public static async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const user = EvidenceExportController.resolveUser(req);
      const inventory = evidenceWorkbookService.getInventory(jobId);

      res.status(200).json({
        success: true,
        jobId,
        tenantId: user.tenantId,
        items: inventory
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to retrieve evidence inventory', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve evidence inventory', error: err.message });
    }
  }

  /**
   * GET /api/evidence/:jobId/workbooks/:workbookType/download
   */
  public static async downloadWorkbook(req: Request, res: Response): Promise<void> {
    try {
      const parsed = downloadWorkbookParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid workbook download parameters',
          errors: parsed.error.issues
        });
        return;
      }

      const { jobId, workbookType } = parsed.data;
      const user = EvidenceExportController.resolveUser(req);

      // Authorization: Admin check
      if (user.role !== 'ADMIN') {
        logger.warn('Unauthorized attempt to download evidence workbook', {
          jobId,
          workbookType,
          userId: user.id,
          role: user.role
        });
        res.status(403).json({
          success: false,
          message: 'Access denied: Admin role required for forensic evidence workbooks'
        });
        return;
      }

      const { buffer, filename } = evidenceWorkbookService.generateWorkbookBuffer(
        jobId,
        workbookType as EvidenceWorkbookType,
        user
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      res.status(200).send(buffer);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to download evidence workbook', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to download evidence workbook', error: err.message });
    }
  }

  /**
   * GET /api/evidence/:jobId/package/download
   */
  public static async downloadCompletePackage(req: Request, res: Response): Promise<void> {
    try {
      const parsed = downloadPackageParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid package download parameters',
          errors: parsed.error.issues
        });
        return;
      }

      const { jobId } = parsed.data;
      const user = EvidenceExportController.resolveUser(req);

      if (user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Admin role required for complete evidence package'
        });
        return;
      }

      const { zipBuffer, filename } = evidenceWorkbookService.generateCompletePackageZip(jobId, user);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', zipBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      res.status(200).send(zipBuffer);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to download complete evidence package', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to download complete evidence package', error: err.message });
    }
  }

  /**
   * GET /api/evidence/:jobId/parity
   */
  public static async getParityValidation(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const queryParsed = parityQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: queryParsed.error.issues
        });
        return;
      }
      const workbookType = queryParsed.data.workbookType as EvidenceWorkbookType | undefined;

      const summary = evidenceWorkbookService.validateParity(jobId, workbookType);
      res.status(200).json({
        success: true,
        parity: summary
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to validate evidence parity', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to validate evidence parity', error: err.message });
    }
  }

  /**
   * GET /api/evidence/jobs/:jobId/savings/inventory
   * GET /api/evidence/jobs/:jobId/savings/:savingsType/inventory
   */
  public static async getSavingsInventory(req: Request, res: Response): Promise<void> {
    try {
      const parsed = savingsTypeInventoryParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Invalid params', errors: parsed.error.issues });
        return;
      }
      const { jobId, savingsType } = parsed.data;
      const user = EvidenceExportController.resolveUser(req);
      const items = evidenceWorkbookService.getSavingsTypeInventory(
        jobId,
        savingsType as CanonicalSavingsType | undefined
      );

      res.status(200).json({
        success: true,
        jobId,
        tenantId: user.tenantId,
        items
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to get savings type inventory', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve savings inventory', error: err.message });
    }
  }

  /**
   * GET /api/evidence/jobs/:jobId/savings/:savingsType/download
   */
  public static async downloadSavingsTypeWorkbook(req: Request, res: Response): Promise<void> {
    try {
      const parsed = downloadSavingsTypeParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Invalid download parameters', errors: parsed.error.issues });
        return;
      }
      const { jobId, savingsType } = parsed.data;
      const user = EvidenceExportController.resolveUser(req);

      if (user.role !== 'ADMIN' && user.role !== 'CONSULTANT') {
        logger.warn('Unauthorized attempt to download savings type evidence workbook', {
          jobId,
          savingsType,
          userId: user.id,
          role: user.role
        });
        res.status(403).json({
          success: false,
          message: 'Access denied: Admin role required for evidence workbook download'
        });
        return;
      }

      const { buffer, filename } = evidenceWorkbookService.generateSavingsTypeWorkbookBuffer(
        jobId,
        savingsType as CanonicalSavingsType,
        user
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      res.status(200).send(buffer);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to download savings type evidence workbook', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to download savings workbook', error: err.message });
    }
  }
}

