import { z } from 'zod';
import type { ReportingPeriodMode } from '../types/reportingPeriod';

export const REPORTING_PERIOD_MODES = [
  'ALL_AVAILABLE',
  'LAST_12_MONTHS',
  'LAST_24_MONTHS',
  'LAST_36_MONTHS',
  'CUSTOM',
  'FINANCIAL_YEAR'
] as const satisfies readonly ReportingPeriodMode[];

export const DEFAULT_REPORTING_PERIOD_MODE: ReportingPeriodMode = 'ALL_AVAILABLE';

export const INDIAN_FISCAL_YEAR_START_MONTH = 4; // April
export const INDIAN_FISCAL_YEAR_END_MONTH = 3;   // March

export const reportingPeriodSelectionSchema = z.object({
  mode: z.enum([
    'ALL_AVAILABLE',
    'LAST_12_MONTHS',
    'LAST_24_MONTHS',
    'LAST_36_MONTHS',
    'CUSTOM',
    'FINANCIAL_YEAR'
  ]),
  customStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  customEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  selectedFiscalYear: z.string().regex(/^FY\d{2}$/).optional()
}).refine((data) => {
  if (data.mode === 'CUSTOM') {
    return Boolean(data.customStartDate && data.customEndDate && data.customStartDate <= data.customEndDate);
  }
  if (data.mode === 'FINANCIAL_YEAR') {
    return Boolean(data.selectedFiscalYear);
  }
  return true;
}, {
  message: 'Invalid date boundaries or missing fiscal year for selected reporting period mode'
});
