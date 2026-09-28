/**
 * PCBI Reference Dataset Row Validation Helpers — Constituents, Sources & UNSPSC
 */

import { extractFieldValue } from './pcbiRowValidators';
import type { ValidationContext } from './pcbiRowValidators';
import type { PCBIConstituentTotalSummary } from '../types/pcbiAdmin';

function checkConstituentWeight(
  rawWeight: unknown,
  pcbiId: string,
  name: string,
  rowNum: number,
  ctx: ValidationContext
): void {
  if (rawWeight === undefined || rawWeight === null || rawWeight === '') return;
  const w = Number(rawWeight);
  if (isNaN(w) || w < 0 || w > 100) {
    ctx.issues.push({
      id: `err-const-weight-${rowNum}`,
      sheetName: 'CONSTITUENTS',
      rowNumber: rowNum,
      column: 'Weight %',
      rawValue: String(rawWeight),
      severity: 'BLOCKING_ERROR',
      rule: 'INVALID_WEIGHT_PERCENT',
      message: `Constituent weight must be between 0 and 100%. Received: "${rawWeight}".`,
      resolution: 'Provide a valid component weight percentage between 0 and 100.'
    });
  } else {
    const current = ctx.constituentWeightsByPcbi.get(pcbiId) || { total: 0, name };
    ctx.constituentWeightsByPcbi.set(pcbiId, {
      total: current.total + w,
      name: current.name || name
    });
  }
}

export function validateConstituentsRow(
  row: Record<string, unknown>,
  idx: number,
  mappingMap: Map<string, string>,
  ctx: ValidationContext
): void {
  const rowNum = idx + 2;
  const pcbiId = String(extractFieldValue(row, mappingMap, 'pcbi_id') ?? '').trim();
  const constituentName = String(
    extractFieldValue(row, mappingMap, 'constituent_name') ??
      extractFieldValue(row, mappingMap, 'raw_material') ??
      ''
  ).trim();

  if (!pcbiId) {
    ctx.issues.push({
      id: `err-const-id-${rowNum}`,
      sheetName: 'CONSTITUENTS',
      rowNumber: rowNum,
      column: 'PCBI ID',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: `PCBI ID is missing on Constituent row ${rowNum}.`,
      resolution: 'Specify the parent benchmark PCBI ID.'
    });
  }

  if (!constituentName) {
    ctx.issues.push({
      id: `err-const-name-${rowNum}`,
      sheetName: 'CONSTITUENTS',
      rowNumber: rowNum,
      column: 'Constituent Name',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: `Constituent / Cost Driver name is missing for ${pcbiId || `row ${rowNum}`}.`,
      resolution: 'Specify the cost driver or material component.'
    });
  }

  const rawWeight =
    extractFieldValue(row, mappingMap, 'weight_percent') ??
    extractFieldValue(row, mappingMap, 'residual_percent') ??
    extractFieldValue(row, mappingMap, 'benchmarkability_percent');

  checkConstituentWeight(rawWeight, pcbiId, constituentName, rowNum, ctx);
}

export function checkConstituentTotals(
  constituentWeights: Map<string, { total: number; name?: string }>,
  ctx: ValidationContext
): PCBIConstituentTotalSummary[] {
  const summaries: PCBIConstituentTotalSummary[] = [];

  for (const [pcbiId, data] of constituentWeights.entries()) {
    const roundedTotal = Math.round(data.total * 100) / 100;
    const isPass = Math.abs(roundedTotal - 100) <= 0.1;
    const diff = Math.round((roundedTotal - 100) * 100) / 100;

    const summary: PCBIConstituentTotalSummary = {
      pcbiId,
      benchmarkName: data.name,
      totalWeight: roundedTotal,
      differenceFrom100: diff,
      status: isPass ? 'PASS' : 'WARNING'
    };
    summaries.push(summary);

    if (!isPass) {
      ctx.constituentWeightIssuesCount++;
      ctx.issues.push({
        id: `warn-const-sum-${pcbiId}`,
        sheetName: 'CONSTITUENTS',
        rowNumber: 0,
        column: 'Weight %',
        rawValue: `${roundedTotal}%`,
        severity: 'WARNING',
        rule: 'CONSTITUENT_TOTAL_NOT_100',
        message: `Total constituent weight for ${pcbiId} is ${roundedTotal}% (difference: ${diff > 0 ? `+${diff}` : diff}%). Requires Review.`,
        resolution: 'Review constituent cost driver breakdown with consultant; weights are not automatically normalized.'
      });
    }
  }

  return summaries;
}

export function validateSourcesRow(
  row: Record<string, unknown>,
  idx: number,
  mappingMap: Map<string, string>,
  ctx: ValidationContext
): void {
  const rowNum = idx + 2;
  const sourceName = String(
    extractFieldValue(row, mappingMap, 'source_name') ??
      extractFieldValue(row, mappingMap, 'source') ??
      ''
  ).trim();

  if (!sourceName) {
    ctx.missingSourceCount++;
    ctx.issues.push({
      id: `err-source-name-${rowNum}`,
      sheetName: 'SOURCES',
      rowNumber: rowNum,
      column: 'Source Family',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: `Source Family / Publisher name is missing on row ${rowNum}.`,
      resolution: 'Provide benchmark source publisher or index provider.'
    });
  }
}

export function validateUnspscRow(
  row: Record<string, unknown>,
  idx: number,
  mappingMap: Map<string, string>,
  ctx: ValidationContext
): void {
  const rowNum = idx + 2;
  const unspsc = String(
    extractFieldValue(row, mappingMap, 'unspsc_code') ??
      extractFieldValue(row, mappingMap, 'canonical_key') ??
      ''
  ).trim();

  if (!unspsc) {
    ctx.missingUnspscCount++;
    ctx.issues.push({
      id: `err-unspsc-code-${rowNum}`,
      sheetName: 'UNSPSC_MAPPING',
      rowNumber: rowNum,
      column: 'UNSPSC Code / Key',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: `UNSPSC Code or Commodity identifier is missing on row ${rowNum}.`,
      resolution: 'Specify the 8-digit UNSPSC code or commodity mapping key.'
    });
  }
}
