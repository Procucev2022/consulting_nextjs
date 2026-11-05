import { z } from 'zod';
import { PCBI_HISTORICAL_QUERY_DEFAULT_LIMIT, PCBI_HISTORICAL_QUERY_MAX_LIMIT } from './pcbiHistorical';

export const pcbiHistoricalObservationsQuerySchema = z.object({
  pcbiId: z.string().trim().min(1).max(120).optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  limit: z.number().int().min(1).max(PCBI_HISTORICAL_QUERY_MAX_LIMIT)
    .default(PCBI_HISTORICAL_QUERY_DEFAULT_LIMIT)
}).superRefine((input, context) => {
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    context.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must not be earlier than start date.' });
  }
});

export const pcbiHistoricalObservationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    archiveOnly: z.literal(true),
    frequency: z.literal('MONTHLY'),
    count: z.number().int().nonnegative(),
    observations: z.array(z.object({
      pcbi_id: z.string().min(1),
      observation_date: z.iso.date(),
      value_inr: z.number().finite(),
      original_value: z.number().finite(),
      original_currency: z.string().min(1),
      fx_rate: z.number().finite().positive(),
      unit: z.string().min(1),
      source: z.string().min(1),
      status: z.string().min(1),
      observation_frequency: z.literal('MONTHLY')
    }).passthrough())
  })
}).refine((response) => response.data.count === response.data.observations.length, {
  message: 'Historical observation count must match the returned rows.'
});
