import { INR_CRORES_DIVISOR } from '../constants';
import type { ParsedDateInfo } from '../types/currency';

export type { ParsedDateInfo } from '../types/currency';

const formatDateParts = (year: number, month: number, day: number): ParsedDateInfo => {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  return { year, monthKey, formattedDate: `${monthKey}-${String(day).padStart(2, '0')}` };
};

const parseExcelDate = (serial: number): ParsedDateInfo => {
  const date = new Date(Math.floor(serial - 25569) * 86400 * 1000);
  return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

const isSupportedYear = (year: number): boolean => year >= 1900 && year <= 2100;

const parseDateComponents = (year: number, month: number, day: number): ParsedDateInfo => {
  if (!isSupportedYear(year) || month < 1 || month > 12 || day < 1 || day > 31) return {};
  return formatDateParts(year, month, day);
};

const parseYearString = (value: string): ParsedDateInfo | null => {
  if (!/^\d{4}$/u.test(value)) return null;
  const year = Number(value);
  return isSupportedYear(year) ? { year, formattedDate: value } : {};
};

const parseIsoDateString = (value: string): ParsedDateInfo | null => {
  const match = /^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/u.exec(value);
  if (!match) return null;
  return parseDateComponents(Number(match[1]), Number(match[2]), match[3] ? Number(match[3]) : 1);
};

const parseDayMonthYearString = (value: string): ParsedDateInfo | null => {
  const match = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/u.exec(value);
  if (!match) return null;
  return parseDateComponents(Number(match[3]), Number(match[2]), Number(match[1]));
};

const parseNativeDateString = (value: string): ParsedDateInfo => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? {}
    : formatDateParts(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate());
};

const parseStringDate = (value: string): ParsedDateInfo => {
  const trimmed = value.trim();
  const year = parseYearString(trimmed);
  if (year !== null) return year;
  const isoDate = parseIsoDateString(trimmed);
  if (isoDate !== null) return isoDate;
  const dmyDate = parseDayMonthYearString(trimmed);
  return dmyDate ?? parseNativeDateString(trimmed);
};

const parseNumericDate = (value: number): ParsedDateInfo => {
  if (Number.isInteger(value) && isSupportedYear(value)) {
    return { year: value, formattedDate: `${value}` };
  }
  return value > 30000 && value < 60000 ? parseExcelDate(value) : {};
};

const parseDateObject = (value: Date): ParsedDateInfo => Number.isNaN(value.getTime())
  ? {}
  : formatDateParts(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());

/** Parse transaction date inputs without inventing a fallback year. */
export function parseDateOrYear(dateOrYear?: string | number | Date): ParsedDateInfo {
  if (dateOrYear === undefined || dateOrYear === null || dateOrYear === '') return {};
  if (typeof dateOrYear === 'number') return parseNumericDate(dateOrYear);
  if (typeof dateOrYear === 'string') return parseStringDate(dateOrYear);
  return parseDateObject(dateOrYear);
}

/** Format an INR value using Indian crore/lakh conventions. */
export function formatINRInCrores(inrAmount: number, decimals = 2): string {
  const safeAmount = Number.isFinite(inrAmount) ? inrAmount : 0;
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 && decimals <= 6 ? decimals : 2;
  return `₹${(safeAmount / INR_CRORES_DIVISOR).toFixed(safeDecimals)} Cr`;
}

/** Format an INR value using crore, lakh, or rupee units. */
export function formatINRAmount(inrAmount: number): string {
  const amount = Number.isFinite(inrAmount) ? inrAmount : 0;
  if (Math.abs(amount) >= INR_CRORES_DIVISOR) return formatINRInCrores(amount);
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
