/**
 * Number formatting shared by the Executive Brief summary, PDF, PPTX, and audit outputs.
 */
import {
  CRORE_DECIMALS,
  CRORE_UNIT_LABEL,
  INR_PER_CRORE,
  INR_SYMBOL,
  THOUSANDS_SEPARATOR,
  THOUSANDS_SEPARATOR_REGEX
} from '../constants/executiveBriefCertifiedFigureConstants';

export const formatCrore = (valueInr: number): string =>
  `${INR_SYMBOL}${(valueInr / INR_PER_CRORE).toFixed(CRORE_DECIMALS)} ${CRORE_UNIT_LABEL}`;

export const formatWithThousands = (value: number): string =>
  value.toString().replace(THOUSANDS_SEPARATOR_REGEX, THOUSANDS_SEPARATOR);

/**
 * Crore values render as "₹X Cr". Counts render with their unit, such as "31,671 Invoices".
 */
export const formatSummaryValue = (value: number, unit?: string): string =>
  unit === undefined ? formatCrore(value) : `${formatWithThousands(value)} ${unit}`;
