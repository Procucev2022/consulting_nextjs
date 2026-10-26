import type {
  AppOperatingMode,
  AssessmentRole,
  OperatingModeConfig
} from '../types/assessment';
import {
  APP_OPERATING_MODES,
  DEFAULT_ASSESSMENT_CONFIG,
  ASSESSMENT_ROLES
} from '../constants/assessment';
import logger from '../utils/logger';

export class OperatingModeService {
  private static instance: OperatingModeService;
  private currentMode: AppOperatingMode;

  private constructor() {
    const envMode = process.env.APP_OPERATING_MODE;
    if (envMode === APP_OPERATING_MODES.PUBLIC_SAAS) {
      this.currentMode = APP_OPERATING_MODES.PUBLIC_SAAS;
    } else {
      this.currentMode = APP_OPERATING_MODES.INTERNAL_ASSESSMENT;
    }

    logger.info('OperatingModeService initialized', {
      mode: this.currentMode,
      phase: DEFAULT_ASSESSMENT_CONFIG.phaseName
    });
  }

  public static getInstance(): OperatingModeService {
    if (!OperatingModeService.instance) {
      OperatingModeService.instance = new OperatingModeService();
    }
    return OperatingModeService.instance;
  }

  public getMode(): AppOperatingMode {
    return this.currentMode;
  }

  public setMode(mode: AppOperatingMode): void {
    if (mode === APP_OPERATING_MODES.PUBLIC_SAAS) {
      logger.warn('Attempted to switch operating mode to PUBLIC_SAAS at runtime - denied', {
        currentMode: this.currentMode,
        targetMode: mode
      });
      throw new Error('Operating mode override denied: Switching to PUBLIC_SAAS is strictly prohibited in Internal Assessment desktop release.');
    }
    const prev = this.currentMode;
    this.currentMode = mode;
    logger.info('Operating mode changed', {
      previousMode: prev,
      newMode: mode
    });
  }

  public isInternalAssessment(): boolean {
    return this.currentMode === APP_OPERATING_MODES.INTERNAL_ASSESSMENT;
  }

  public isPublicSaaS(): boolean {
    return this.currentMode === APP_OPERATING_MODES.PUBLIC_SAAS;
  }

  public isCustomerAccessAllowed(): boolean {
    return this.currentMode === APP_OPERATING_MODES.PUBLIC_SAAS;
  }

  public getConfig(): OperatingModeConfig {
    const isInternal = this.isInternalAssessment();
    const allowedRoles: AssessmentRole[] = isInternal
      ? [
          ASSESSMENT_ROLES.INTERNAL_ADMIN,
          ASSESSMENT_ROLES.ANALYST,
          ASSESSMENT_ROLES.CONSULTANT
        ]
      : [
          ASSESSMENT_ROLES.INTERNAL_ADMIN,
          ASSESSMENT_ROLES.ANALYST,
          ASSESSMENT_ROLES.CONSULTANT,
          ASSESSMENT_ROLES.CUSTOMER
        ];

    return {
      mode: this.currentMode,
      isInternalAssessment: isInternal,
      isPublicSaaS: !isInternal,
      workspaceTitle: DEFAULT_ASSESSMENT_CONFIG.workspaceTitle,
      phaseName: DEFAULT_ASSESSMENT_CONFIG.phaseName,
      features: {
        publicRegistration: !isInternal,
        tierUpgrade: !isInternal,
        subscriptionPurchase: !isInternal,
        customerSelfOnboarding: !isInternal,
        customerSaaSDashboard: !isInternal,
        assessmentCentre: isInternal
      },
      allowedRoles
    };
  }
}

export const operatingModeService = OperatingModeService.getInstance();

export const saasRouteGuard = (
  _req: unknown,
  res: { status: (code: number) => { json: (data: unknown) => void } },
  next: () => void
): void => {
  if (operatingModeService.isInternalAssessment()) {
    res.status(403).json({
      success: false,
      message: 'Access Denied: Public SaaS features and customer self-registration are strictly disabled during Internal Assessment Desktop release.',
      code: 'PUBLIC_SAAS_DISABLED'
    });
    return;
  }
  next();
};
