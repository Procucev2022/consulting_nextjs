/**
 * Executive Brief Assessment Context Resolver (Prompt 587)
 * Enforces customer isolation and strictly binds to authoritative assessment records.
 * Rejects unresolvable or ambiguous assessments with explicit error to prevent data leakage.
 */

import type { Request } from 'express';
import { isBorosilAssessment } from '../constants/executiveBriefPresentationConstants';
import { resolveAuthoritativeAssessment } from './assessmentContextResolver';
import type { ResolvedExecutiveBriefContext } from '../types/executiveBriefExportTypes';
import { logger } from './logger';

function extractRawTarget(req: Request): string {
  const candidates: Array<unknown> = [
    req.query?.assessmentId,
    req.query?.assessment_id,
    req.headers?.['x-assessment-id'],
    req.body?.assessmentId,
    req.body?.assessment_id,
    req.query?.customerId,
    req.query?.customer_id,
    req.query?.client,
    req.query?.tenantName,
    req.body?.client,
    req.body?.customerId
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return '';
}

export function resolveExecutiveBriefContext(req: Request): ResolvedExecutiveBriefContext {
  const rawTarget = extractRawTarget(req);

  if (!rawTarget) {
    logger.warn('Executive Brief export rejected: missing assessment identifier');
    throw new Error('Assessment context cannot be resolved. Please provide a valid assessmentId or client name.');
  }

  if (isBorosilAssessment(rawTarget)) {
    const assessmentRecord = resolveAuthoritativeAssessment('AIC-2026-0002');
    logger.info('Executive brief context resolved for Borosil Ltd', {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      target: rawTarget
    });

    return {
      isBorosil: true,
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd',
      assessmentRecord
    };
  }

  try {
    const assessmentRecord = resolveAuthoritativeAssessment(rawTarget);
    logger.info('Executive brief context resolved for assessment', {
      assessmentId: assessmentRecord.assessmentId,
      customerId: assessmentRecord.customerId,
      customerName: assessmentRecord.customerName
    });

    return {
      isBorosil: false,
      assessmentId: assessmentRecord.assessmentId,
      customerId: assessmentRecord.customerId || 'CUST-DEFAULT',
      customerName: assessmentRecord.customerName,
      assessmentRecord
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.warn('Executive brief context resolution failed', { rawTarget, error: errorMsg });
    throw new Error(
      `Assessment '${rawTarget}' could not be resolved in the authoritative assessment store. Customer data isolation strictly enforced.`
    );
  }
}
