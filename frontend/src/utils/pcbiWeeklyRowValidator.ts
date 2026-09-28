/**
 * PCBI Weekly Index Row Validation Helper
 * Validates dates, values, historical/future boundaries, and duplicates
 */

import { parseExcelDate } from './pcbiParser';
import type { ValidationContext } from './pcbiRowValidators';
import { extractFieldValue } from './pcbiRowValidators';

export function checkWeeklyDate(rawDate: unknown, pcbiId: string, rowNum: number, ctx: ValidationContext): void {
  const parsedDate = parseExcelDate(rawDate);
  if (!parsedDate) {
    ctx.issues.push({
      id: `err-week-date-${rowNum}`,
      sheetName: 'WEEKLY_INDEX',
      rowNumber: rowNum,
      column: 'Week Start',
      rawValue: String(rawDate ?? ''),
      severity: 'BLOCKING_ERROR',
      rule: 'INVALID_DATE',
      message: `Invalid week start date "${String(rawDate)}".`,
      resolution: 'Use YYYY-MM-DD format or standard Excel date serial.'
    });
    return;
  }

  if (!ctx.dateMin || parsedDate < ctx.dateMin) ctx.dateMin = parsedDate;
  if (!ctx.dateMax || parsedDate > ctx.dateMax) ctx.dateMax = parsedDate;

  if (parsedDate < '2020-04-01') {
    ctx.issues.push({
      id: `warn-week-hist-${rowNum}`,
      sheetName: 'WEEKLY_INDEX',
      rowNumber: rowNum,
      column: 'Week Start',
      rawValue: parsedDate,
      severity: 'WARNING',
      rule: 'OUTSIDE_INITIAL_PERIOD',
      message: `Date ${parsedDate} is before initial PCBI period start (2020-04-01).`,
      resolution: 'Informational check for historical boundaries.'
    });
  } else if (parsedDate > '2026-07-31') {
    ctx.issues.push({
      id: `warn-week-future-${rowNum}`,
      sheetName: 'WEEKLY_INDEX',
      rowNumber: rowNum,
      column: 'Week Start',
      rawValue: parsedDate,
      severity: 'WARNING',
      rule: 'FUTURE_OR_EXTENDED_PERIOD',
      message: `Date ${parsedDate} is beyond initial period end (2026-07-31).`,
      resolution: 'Future or extended period series.'
    });
  }

  const key = `${pcbiId}__${parsedDate}`;
  if (ctx.weeklyKeySeen.has(key)) {
    ctx.duplicateWeeklyRecordsCount++;
    ctx.issues.push({
      id: `err-week-dup-${rowNum}`,
      sheetName: 'WEEKLY_INDEX',
      rowNumber: rowNum,
      column: 'Week Start',
      rawValue: key,
      severity: 'BLOCKING_ERROR',
      rule: 'DUPLICATE_WEEKLY_RECORD',
      message: `Duplicate weekly entry for ${pcbiId} on date ${parsedDate}.`,
      resolution: 'Remove duplicate observation or distinguish series source.'
    });
  } else {
    ctx.weeklyKeySeen.add(key);
  }
}

export function checkWeeklyValue(
  rawVal: unknown,
  pcbiId: string,
  isPending: boolean,
  rowNum: number,
  ctx: ValidationContext
): void {
  if (rawVal === '' || rawVal === null || rawVal === undefined) {
    if (isPending) {
      ctx.sourcePendingCount++;
      if (ctx.sourcePendingCount <= 100) {
        ctx.issues.push({
          id: `info-week-pend-${rowNum}`,
          sheetName: 'WEEKLY_INDEX',
          rowNumber: rowNum,
          column: 'Index Value',
          rawValue: '',
          severity: 'INFORMATION',
          rule: 'SOURCE_PENDING_INDEX',
          message: `Weekly index for ${pcbiId} is marked as SOURCE_PENDING. Not used for calculations.`,
          resolution: 'Provide validated market index value when published.'
        });
      }
    } else {
      ctx.invalidIndexCount++;
      ctx.issues.push({
        id: `err-week-val-${rowNum}`,
        sheetName: 'WEEKLY_INDEX',
        rowNumber: rowNum,
        column: 'Index Value',
        rawValue: '',
        severity: 'BLOCKING_ERROR',
        rule: 'MISSING_INDEX_VALUE',
        message: `Missing index value for PCBI ID "${pcbiId}".`,
        resolution: 'Provide numeric index value or mark row as SOURCE_PENDING.'
      });
    }
    return;
  }

  const numVal = Number(rawVal);
  if (isNaN(numVal) || numVal <= 0) {
    ctx.invalidIndexCount++;
    ctx.issues.push({
      id: `err-week-nonnum-${rowNum}`,
      sheetName: 'WEEKLY_INDEX',
      rowNumber: rowNum,
      column: 'Index Value',
      rawValue: String(rawVal),
      severity: 'BLOCKING_ERROR',
      rule: 'INVALID_INDEX_VALUE',
      message: `Index value must be a positive number. Received: ${rawVal}`,
      resolution: 'Correct index value to a positive decimal number.'
    });
  }
}

export function validateWeeklyRow(
  row: Record<string, unknown>,
  idx: number,
  mappingMap: Map<string, string>,
  ctx: ValidationContext
): void {
  const rowNum = idx + 2;
  const pcbiId = String(extractFieldValue(row, mappingMap, 'pcbi_id') ?? '').trim();
  const rawDate = extractFieldValue(row, mappingMap, 'week_start');
  checkWeeklyDate(rawDate, pcbiId, rowNum, ctx);

  const rawVal = extractFieldValue(row, mappingMap, 'index_value');
  const rawStatus = String(extractFieldValue(row, mappingMap, 'data_status') ?? row['Data Status'] ?? '').trim();
  const rawNote = String(extractFieldValue(row, mappingMap, 'note') ?? row['Note'] ?? '').trim();
  const isPending = rawStatus.includes('SOURCE_PENDING') || rawNote.includes('SOURCE_PENDING');

  checkWeeklyValue(rawVal, pcbiId, isPending, rowNum, ctx);
}
