import { z } from 'zod';
import { PCBI_EXCLUSION_REASON_CODES, PCBI_RESOLUTION_ACTIONS } from './analysisOrchestration';
import { UI_STRINGS } from './uiStrings';

export const FRONTEND_ORCHESTRATION_INPUT_LIMITS = {
  pcbiSeriesId: 128,
  notes: 2000
} as const;

export const pcbiGapResolutionRequestSchema = z.object({
  action: z.enum(PCBI_RESOLUTION_ACTIONS),
  targetPcbiSeries: z.string().trim().min(1).max(FRONTEND_ORCHESTRATION_INPUT_LIMITS.pcbiSeriesId).optional(),
  exclusionReason: z.enum(PCBI_EXCLUSION_REASON_CODES).optional(),
  exclusionNotes: z.string().trim().max(FRONTEND_ORCHESTRATION_INPUT_LIMITS.notes).optional(),
  researchNotes: z.string().trim().max(FRONTEND_ORCHESTRATION_INPUT_LIMITS.notes).optional()
}).superRefine((value, context) => {
  if ((value.action === 'MAP_EXISTING' || value.action === 'ADD_MAP_PCBI') && !value.targetPcbiSeries) {
    context.addIssue({
      code: 'custom', path: ['targetPcbiSeries'], message: UI_STRINGS.orchestration.pcbiResolutionMissingSeries
    });
  }
  if (value.action === 'EXCLUDE' && !value.exclusionReason) {
    context.addIssue({
      code: 'custom', path: ['exclusionReason'], message: UI_STRINGS.orchestration.pcbiResolutionMissingReason
    });
  }
  if (value.action === 'EXCLUDE' && value.exclusionReason === 'OTHER' && !value.exclusionNotes) {
    context.addIssue({
      code: 'custom', path: ['exclusionNotes'], message: UI_STRINGS.orchestration.pcbiResolutionOtherReasonNotes
    });
  }
});
