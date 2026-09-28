/**
 * PCBI Master Row Validation Helper
 * Validates benchmark definitions, required fields, quality ratings, and benchmarkability
 */

import type { ValidationContext } from './pcbiRowValidators';
import { extractFieldValue } from './pcbiRowValidators';

export interface MasterDefinitionRecord {
  pcbiId: string;
  pcbiName: string;
  benchmarkType: string;
  category: string;
  subCategory: string;
  source: string;
  geography: string;
  currency: string;
  unit: string;
  rowNumber: number;
}

export function handleMasterDisambiguation(
  rawId: string,
  currentDef: MasterDefinitionRecord,
  rowNum: number,
  ctx: ValidationContext
): void {
  const existing = ctx.pcbiMasterDefinitions.get(rawId);
  if (!existing) {
    ctx.pcbiMasterDefinitions.set(rawId, [currentDef]);
    ctx.uniquePcbiIds.add(rawId);
    return;
  }

  const isGenDuplicate = existing.some(
    (e) =>
      e.pcbiName.toLowerCase() === currentDef.pcbiName.toLowerCase() &&
      e.benchmarkType.toLowerCase() === currentDef.benchmarkType.toLowerCase() &&
      e.category.toLowerCase() === currentDef.category.toLowerCase() &&
      e.geography.toLowerCase() === currentDef.geography.toLowerCase() &&
      e.unit.toLowerCase() === currentDef.unit.toLowerCase() &&
      e.currency.toLowerCase() === currentDef.currency.toLowerCase()
  );

  if (isGenDuplicate) {
    ctx.duplicateTechnicalIdsCount++;
    ctx.issues.push({
      id: `err-master-dup-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'PCBI ID',
      rawValue: rawId,
      severity: 'BLOCKING_ERROR',
      rule: 'DUPLICATE_PCBI_ID',
      message: `Duplicate PCBI ID "${rawId}" detected in Benchmark Master.`,
      resolution: 'Ensure all PCBI IDs are unique across master benchmark definitions.'
    });
  } else {
    const disambiguatedId = `${rawId}_${existing.length + 1}`;
    ctx.technicalIdsGenerated.add(disambiguatedId);
    ctx.uniquePcbiIds.add(disambiguatedId);
    existing.push(currentDef);

    ctx.issues.push({
      id: `info-master-disambig-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'PCBI ID',
      rawValue: rawId,
      severity: 'INFORMATION',
      rule: 'TECHNICAL_ID_DISAMBIGUATED',
      message: `Repeated name "${rawId}" represents a distinct benchmark definition. Assigned stable technical ID "${disambiguatedId}".`,
      resolution: 'Preserved benchmark display name with distinct database technical ID.'
    });
  }
}

export function checkMasterQuality(
  quality: string,
  name: string,
  rowNum: number,
  ctx: ValidationContext
): void {
  if (!quality) {
    ctx.missingQualityCount++;
    ctx.issues.push({
      id: `warn-master-qual-miss-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'Quality Rating',
      rawValue: '',
      severity: 'WARNING',
      rule: 'MISSING_DATA',
      message: `Quality rating is missing for benchmark "${name}". Retained as null.`,
      resolution: 'Consultant or administrator can assign rating A, B, or C during review.'
    });
  } else if (quality === 'A' || quality === 'B' || quality === 'C') {
    ctx.qualityCounts[quality as 'A' | 'B' | 'C']++;
  } else {
    ctx.issues.push({
      id: `warn-master-qual-inv-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'Quality Rating',
      rawValue: quality,
      severity: 'WARNING',
      rule: 'UNKNOWN_QUALITY_RATING',
      message: `Quality rating "${quality}" is not A, B, or C. Retained as null.`,
      resolution: 'Specify rating A (direct), B (proxy), or C (weak proxy).'
    });
  }
}

export function checkMasterBenchmarkability(
  rawBench: unknown,
  name: string,
  rowNum: number,
  ctx: ValidationContext
): void {
  const isMissing = rawBench === undefined || rawBench === null || String(rawBench).trim() === '';
  if (isMissing) {
    ctx.missingBenchmarkabilityCount++;
    ctx.issues.push({
      id: `warn-master-bench-miss-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'Benchmarkability %',
      rawValue: '',
      severity: 'WARNING',
      rule: 'MISSING_DATA',
      message: `Benchmarkability % is not specified for "${name}". Retained as null.`,
      resolution: 'Assign estimated benchmarkable coverage percentage (0-100%) during review.'
    });
    return;
  }

  const benchPct = Number(rawBench);
  if (isNaN(benchPct) || benchPct < 0 || benchPct > 100) {
    ctx.issues.push({
      id: `err-master-bench-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'Benchmarkability %',
      rawValue: String(rawBench),
      severity: 'BLOCKING_ERROR',
      rule: 'INVALID_PERCENTAGE',
      message: `Benchmarkability % must be a numeric value between 0 and 100. Received: "${rawBench}".`,
      resolution: 'Enter a valid numeric percentage between 0 and 100.'
    });
  } else {
    ctx.totalBenchmarkabilitySum += benchPct;
    ctx.benchmarkabilityCount++;
  }
}

function checkMasterRequiredFields(
  rawId: string,
  name: string,
  benchType: string,
  rowNum: number,
  ctx: ValidationContext
): void {
  if (!rawId) {
    ctx.issues.push({
      id: `err-master-id-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'PCBI ID',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: 'PCBI ID is missing or empty in Benchmark Master row.',
      resolution: 'Provide a technical PCBI ID (e.g., PCBI-0001).'
    });
  }

  if (!name) {
    ctx.issues.push({
      id: `err-master-name-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'Benchmark Name',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: 'Benchmark Name (PCBI Name) is required in Benchmark Master row.',
      resolution: 'Specify the benchmark display name (e.g., Aluminium).'
    });
  }

  if (!benchType) {
    ctx.issues.push({
      id: `err-master-type-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'Benchmark Type',
      rawValue: '',
      severity: 'BLOCKING_ERROR',
      rule: 'REQUIRED_FIELD_MISSING',
      message: `Benchmark Type is missing for "${name || rawId}".`,
      resolution: 'Specify benchmark type (e.g., DIRECT, COMPOSITE_PROXY, RAW_MATERIAL).'
    });
  }
}

function buildMasterDefinition(
  row: Record<string, unknown>,
  mappingMap: Map<string, string>,
  rawId: string,
  name: string,
  benchType: string,
  rowNum: number,
  ctx: ValidationContext
): MasterDefinitionRecord {
  const category = String(extractFieldValue(row, mappingMap, 'category') ?? '').trim();
  if (!category) {
    ctx.issues.push({
      id: `warn-master-cat-${rowNum}`,
      sheetName: 'PCBI_MASTER',
      rowNumber: rowNum,
      column: 'Category',
      rawValue: '',
      severity: 'WARNING',
      rule: 'RECOMMENDED_FIELD_MISSING',
      message: `Benchmark Category is recommended for "${name || rawId}".`,
      resolution: 'Assign procurement or commodity category.'
    });
  }

  return {
    pcbiId: rawId,
    pcbiName: name || rawId,
    benchmarkType: benchType,
    category,
    subCategory: String(extractFieldValue(row, mappingMap, 'sub_category') ?? '').trim(),
    source: String(extractFieldValue(row, mappingMap, 'benchmark_source') ?? '').trim(),
    geography: String(extractFieldValue(row, mappingMap, 'geography') ?? '').trim(),
    currency: String(extractFieldValue(row, mappingMap, 'currency') ?? '').trim(),
    unit: String(extractFieldValue(row, mappingMap, 'benchmark_unit') ?? '').trim(),
    rowNumber: rowNum
  };
}

function resolveMasterName(row: Record<string, unknown>, mappingMap: Map<string, string>): string {
  const bName = extractFieldValue(row, mappingMap, 'benchmark_name');
  if (bName) {
    return String(bName).trim();
  }
  const pName = extractFieldValue(row, mappingMap, 'pcbi_name');
  if (pName) {
    return String(pName).trim();
  }
  const cKey = extractFieldValue(row, mappingMap, 'canonical_key');
  if (cKey) {
    return String(cKey).trim();
  }
  return '';
}

function resolveQuality(row: Record<string, unknown>, mappingMap: Map<string, string>): string {
  const rawQuality = extractFieldValue(row, mappingMap, 'quality_rating');
  return rawQuality ? String(rawQuality).trim().toUpperCase() : '';
}

export function validateMasterRow(
  row: Record<string, unknown>,
  idx: number,
  mappingMap: Map<string, string>,
  ctx: ValidationContext
): void {
  const rowNum = idx + 2;
  const rawId = String(extractFieldValue(row, mappingMap, 'pcbi_id') ?? '').trim();
  const name = resolveMasterName(row, mappingMap);
  const benchType = String(extractFieldValue(row, mappingMap, 'benchmark_type') ?? '').trim();

  checkMasterRequiredFields(rawId, name, benchType, rowNum, ctx);

  const currentDef = buildMasterDefinition(row, mappingMap, rawId, name, benchType, rowNum, ctx);
  if (rawId) {
    handleMasterDisambiguation(rawId, currentDef, rowNum, ctx);
  }

  const quality = resolveQuality(row, mappingMap);
  checkMasterQuality(quality, name || rawId, rowNum, ctx);

  const rawBench = extractFieldValue(row, mappingMap, 'benchmarkability_percent');
  checkMasterBenchmarkability(rawBench, name || rawId, rowNum, ctx);
}

