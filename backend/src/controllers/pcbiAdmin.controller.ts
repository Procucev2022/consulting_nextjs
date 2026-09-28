/**
 * PCBI Master Admin Controller
 */

import type { Request, Response } from 'express';
import { pcbiAdminService } from '../services/pcbiAdminService';
import logger from '../utils/logger';
import type { PCBIImportPayload } from '../types/pcbiAdmin';

export class PCBIAdminController {
  public async getVersions(_req: Request, res: Response): Promise<void> {
    try {
      const versions = pcbiAdminService.getVersions();
      const active = pcbiAdminService.getActivePublishedVersion();
      res.json({
        success: true,
        total: versions.length,
        active_version: active?.version || null,
        versions
      });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI versions', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI versions' });
    }
  }

  public async getVersion(req: Request, res: Response): Promise<void> {
    try {
      const { version } = req.params;
      const record = pcbiAdminService.getVersion(version);
      if (!record) {
        res.status(404).json({ success: false, message: `Version ${version} not found` });
        return;
      }
      res.json({ success: true, version: record });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI version details', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI version details' });
    }
  }

  public async importMaster(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as PCBIImportPayload;
      if (!payload?.file_name) {
        res.status(400).json({ success: false, message: 'Invalid PCBI import payload: file_name is required' });
        return;
      }

      const result = await pcbiAdminService.importMaster(payload);
      res.status(201).json(result);
    } catch (err: unknown) {
      logger.error('Failed to import PCBI Master', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to import PCBI Master dataset' });
    }
  }

  public async publishVersion(req: Request, res: Response): Promise<void> {
    try {
      const version = req.params.version || (req.body?.version as string);
      const publishedBy = (req.body?.published_by as string) || 'Admin';

      const result = await pcbiAdminService.publishVersion(version, publishedBy);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Failed to publish PCBI version', { error: msg });
      res.status(400).json({ success: false, message: msg });
    }
  }

  public async getValidationReport(req: Request, res: Response): Promise<void> {
    try {
      const { version } = req.params;
      const report = pcbiAdminService.getValidationReport(version);
      if (!report) {
        res.status(404).json({ success: false, message: `Validation report for version ${version} not found` });
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="PCBI_Validation_Report_${version}.json"`);
      res.send(report);
    } catch (err: unknown) {
      logger.error('Failed to get validation report', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, message: 'Failed to retrieve validation report' });
    }
  }
}

export const pcbiAdminController = new PCBIAdminController();
