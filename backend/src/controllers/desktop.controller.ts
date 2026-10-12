import type { Request, Response } from 'express';
import { SYSTEM_BUILD_IDENTITY } from '../constants/assessment';
import type { SystemBuildInfo } from '../types/assessment';
import { desktopUpdateService } from '../services/desktopUpdateService';

export class DesktopController {
  public static getSystemInfo(_req: Request, res: Response): void {
    const info: SystemBuildInfo = {
      applicationVersion: SYSTEM_BUILD_IDENTITY.APP_VERSION,
      buildNumber: SYSTEM_BUILD_IDENTITY.BUILD_NUMBER,
      gitCommit: SYSTEM_BUILD_IDENTITY.GIT_COMMIT,
      buildTimestamp: SYSTEM_BUILD_IDENTITY.BUILD_TIMESTAMP,
      operatingMode: SYSTEM_BUILD_IDENTITY.OPERATING_MODE,
      certificationStatus: SYSTEM_BUILD_IDENTITY.CERTIFICATION_STATUS,
      e2eCertificationId: SYSTEM_BUILD_IDENTITY.E2E_CERTIFICATION_ID,
      fxMaster: {
        version: SYSTEM_BUILD_IDENTITY.FX_MASTER_VERSION,
        checksum: SYSTEM_BUILD_IDENTITY.FX_MASTER_CHECKSUM
      },
      pcbiMaster: {
        version: SYSTEM_BUILD_IDENTITY.PCBI_MASTER_VERSION,
        checksum: SYSTEM_BUILD_IDENTITY.PCBI_MASTER_CHECKSUM
      }
    };
    res.json({ success: true, data: info });
  }

  public static getUpdateStatus(req: Request, res: Response): void {
    const stagedDir = typeof req.query.stagedDir === 'string' ? req.query.stagedDir : undefined;
    const installedVersion = typeof req.query.installedVersion === 'string' ? req.query.installedVersion : undefined;
    const installedBuild = typeof req.query.installedBuild === 'string' ? req.query.installedBuild : undefined;

    const result = desktopUpdateService.getDesktopUpdateStatus({
      stagedDir,
      installedVersion,
      installedBuild
    });

    res.json({ success: true, data: result });
  }

  public static installUpdate(req: Request, res: Response): void {
    const stagedDir = typeof req.body?.stagedDir === 'string' ? req.body.stagedDir : undefined;
    const simulateOnly = Boolean(req.body?.simulateOnly);

    const result = desktopUpdateService.triggerInstallUpdate({
      stagedDir,
      simulateOnly
    });

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message, error: result.error });
      return;
    }

    res.json({ success: true, data: result });
  }
}
