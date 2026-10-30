import { D1_TABLES } from '../constants/d1';
import { MODULE2_D1_COMPLIANCE as CONFIG } from '../constants/module2ProcurementComplianceD1';
import type {
  ComplianceReviewRecord, ProcurementComplianceExceptionItem,
  ProcurementComplianceOptions, ProcurementComplianceResult, ProcurementComplianceStatus
} from '../types/module2ProcurementCompliance';
import type { ProcurementComplianceReviewD1Row } from '../types/module2ReviewD1';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import { buildComplianceSummary, buildControlChecks } from './workerD1ProcurementComplianceSummary';

const clean = (value: unknown): string => String(value ?? '').trim();
const positive = (value: number): number => Number.isFinite(value) && value > 0 ? value : 0;
const amount = (value: number): number => Number(positive(value).toFixed(CONFIG.DECIMAL_PLACES));
const crores = (value: number): number => amount(value / CONFIG.INR_PER_CRORE);
const supplierKey = (row: StrategicInputTransaction): string => clean(row.vendor_code) || clean(row.vendor_name);
const materialKey = (row: StrategicInputTransaction): string =>
  clean(row.material_code) || clean(row.material_desc).toLowerCase();

const stableId = (key: string): string => {
  let hash = 2166136261;
  for (const character of key) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `CMP-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const groupBy = (
  transactions: StrategicInputTransaction[],
  keyFor: (row: StrategicInputTransaction) => string
): Map<string, StrategicInputTransaction[]> => {
  const groups = new Map<string, StrategicInputTransaction[]>();
  for (const row of transactions) {
    const key = keyFor(row);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  return groups;
};

const median = (values: number[]): number => {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
};

const toSupportingTransaction = (
  row: StrategicInputTransaction
): ProcurementComplianceExceptionItem['supportingTransactions'][number] => ({
  transactionId: clean(row.id) || undefined,
  poNumber: clean(row.po_number) || 'Unavailable',
  poDate: clean(row.po_date) || 'Unavailable',
  vendorCode: clean(row.vendor_code),
  vendorName: clean(row.vendor_name) || 'Unavailable',
  materialCode: clean(row.material_code),
  materialDesc: clean(row.material_desc) || 'Unavailable',
  plant: clean(row.plant) || undefined,
  quantity: positive(row.quantity),
  uom: clean(row.uom) || 'Unavailable',
  unitPrice: positive(row.unit_price),
  totalSpendInr: positive(row.total_spend_inr),
  currency: clean(row.currency) || 'INR'
});

const reviewHistoryFor = (
  exceptionId: string, options: ProcurementComplianceOptions
): ComplianceReviewRecord[] => {
  const configured = options.reviews?.[exceptionId];
  if (!configured) return [];
  return Array.isArray(configured) ? configured : [configured];
};

const createException = (
  input: Pick<ProcurementComplianceExceptionItem, 'exceptionId' | 'checkType' | 'checkTitle' |
    'spendCategory' | 'vendorName' | 'vendorCode' | 'materialCode' | 'materialDesc' | 'plant' |
    'financialExposureStatus' | 'financialExposureStatusLabel' | 'methodologyDescription' |
    'evidenceDetails' | 'dataGapsDisclosed' | 'potentialRelatedLevers' | 'nextActionRequired'> & {
      rows: StrategicInputTransaction[];
      exposureInr: number;
      defaultStatus: ProcurementComplianceStatus;
    },
  options: ProcurementComplianceOptions
): ProcurementComplianceExceptionItem => {
  const history = reviewHistoryFor(input.exceptionId, options);
  const latest = history[history.length - 1];
  const spend = amount(input.rows.reduce((total, row) => total + positive(row.total_spend_inr), 0));
  const exposure = amount(input.exposureInr);
  return {
    exceptionId: input.exceptionId,
    checkType: input.checkType,
    checkTitle: input.checkTitle,
    spendCategory: input.spendCategory,
    vendorName: input.vendorName,
    ...(input.vendorCode ? { vendorCode: input.vendorCode } : {}),
    ...(input.materialCode ? { materialCode: input.materialCode } : {}),
    materialDesc: input.materialDesc,
    ...(input.plant ? { plant: input.plant } : {}),
    supportingTransactionsCount: input.rows.length,
    expenditureUnderReviewInr: spend,
    expenditureUnderReviewCr: crores(spend),
    potentialFinancialExposureInr: exposure,
    potentialFinancialExposureCr: crores(exposure),
    financialExposureStatus: input.financialExposureStatus,
    financialExposureStatusLabel: input.financialExposureStatusLabel,
    methodologyDescription: input.methodologyDescription,
    evidenceDetails: input.evidenceDetails,
    dataGapsDisclosed: input.dataGapsDisclosed,
    reviewStatus: latest?.status || input.defaultStatus,
    reviewHistory: history,
    potentialRelatedLevers: input.potentialRelatedLevers,
    nextActionRequired: input.nextActionRequired,
    supportingTransactions: input.rows.map(toSupportingTransaction)
  };
};

const buildPriceExceptions = (
  transactions: StrategicInputTransaction[], options: ProcurementComplianceOptions
): ProcurementComplianceExceptionItem[] => {
  const groups = groupBy(transactions, (row) => {
    const material = materialKey(row);
    const unit = clean(row.uom).toLowerCase();
    return material && unit && positive(row.unit_price) ? `${material}|${unit}` : '';
  });
  const exceptions: ProcurementComplianceExceptionItem[] = [];
  for (const [key, rows] of groups) {
    const suppliers = new Set(rows.map(supplierKey).filter(Boolean));
    if (suppliers.size < CONFIG.MIN_PRICE_COMPARISON_SUPPLIERS) continue;
    const baseline = median(rows.map((row) => positive(row.unit_price)));
    const prices = rows.map((row) => positive(row.unit_price));
    const spread = Math.max(...prices) - Math.min(...prices);
    if (baseline <= 0 || spread / baseline < CONFIG.PRICE_VARIANCE_RATIO) continue;
    const higherPriceRows = rows.filter((row) => positive(row.unit_price) > baseline);
    const exposure = higherPriceRows.reduce((total, row) =>
      total + (positive(row.unit_price) - baseline) * positive(row.quantity), 0);
    const primary = [...higherPriceRows].sort((left, right) => right.unit_price - left.unit_price)[0];
    if (!primary) continue;
    exceptions.push(createException({
      exceptionId: stableId(`PRICE|${key}`),
      checkType: 'PRICE_INCONSISTENCY',
      checkTitle: CONFIG.PRICE_VARIANCE_TITLE,
      spendCategory: clean(primary.spend_category) || 'Unclassified',
      vendorName: clean(primary.vendor_name) || 'Multiple suppliers',
      vendorCode: clean(primary.vendor_code),
      materialCode: clean(primary.material_code),
      materialDesc: clean(primary.material_desc) || 'Unavailable',
      plant: clean(primary.plant),
      rows,
      exposureInr: exposure,
      financialExposureStatus: 'PRICE_VARIANCE_INVESTIGATION_SIGNAL',
      financialExposureStatusLabel: 'Price difference requiring investigation; not a confirmed loss',
      methodologyDescription: CONFIG.PRICE_VARIANCE_METHOD,
      evidenceDetails: [
        `${suppliers.size} suppliers are present for the material and unit.`,
        `Observed unit price spread is ${amount(spread / baseline * 100)}% against a median of ${amount(baseline)}.`,
        `Screening threshold is ${amount(CONFIG.PRICE_VARIANCE_RATIO * 100)}%.`
      ],
      dataGapsDisclosed: [],
      potentialRelatedLevers: [],
      nextActionRequired: 'Validate specification, purchase date, delivery terms, and commercial conditions before any conclusion.',
      defaultStatus: 'AWAITING_REVIEW'
    }, options));
  }
  return exceptions;
};

const buildDuplicateScheduleExceptions = (
  transactions: StrategicInputTransaction[], options: ProcurementComplianceOptions
): ProcurementComplianceExceptionItem[] => {
  const groups = groupBy(transactions, (row) => clean(row.po_number) && clean(row.po_line)
    ? `${clean(row.po_number)}|${clean(row.po_line)}` : '');
  const exceptions: ProcurementComplianceExceptionItem[] = [];
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    const primary = rows[0];
    const potentialDuplicateSpend = Math.min(...rows.map((row) => positive(row.total_spend_inr)));
    exceptions.push(createException({
      exceptionId: stableId(`PO_LINE|${key}`),
      checkType: 'PO_TRANSACTION_EXCEPTION',
      checkTitle: CONFIG.DUPLICATE_SCHEDULE_TITLE,
      spendCategory: clean(primary.spend_category) || 'Unclassified',
      vendorName: clean(primary.vendor_name) || 'Unavailable',
      vendorCode: clean(primary.vendor_code),
      materialCode: clean(primary.material_code),
      materialDesc: clean(primary.material_desc) || 'Unavailable',
      plant: clean(primary.plant),
      rows,
      exposureInr: potentialDuplicateSpend,
      financialExposureStatus: 'POTENTIAL_PO_SCHEDULE_DUPLICATE',
      financialExposureStatusLabel: 'Potential repeated purchase order line; confirm source schedule',
      methodologyDescription: CONFIG.DUPLICATE_SCHEDULE_METHOD,
      evidenceDetails: [`${rows.length} D1 transaction rows share purchase order and line ${key}.`],
      dataGapsDisclosed: [],
      potentialRelatedLevers: [],
      nextActionRequired: 'Compare the source purchase order schedule and invoices to confirm whether the repeated line is valid.',
      defaultStatus: 'POTENTIAL_EXCEPTION'
    }, options));
  }
  return exceptions;
};

const buildMissingEvidenceExceptions = (
  transactions: StrategicInputTransaction[], options: ProcurementComplianceOptions
): ProcurementComplianceExceptionItem[] => transactions.flatMap((row, index) => {
  const gaps = [
    !clean(row.po_number) ? 'Purchase order number is missing.' : '',
    !clean(row.material_code) ? 'Material code is missing.' : '',
    !clean(row.uom) ? 'Unit of measure is missing.' : ''
  ].filter(Boolean);
  if (gaps.length === 0) return [];
  return [createException({
    exceptionId: stableId(`MISSING|${clean(row.id) || index}`),
    checkType: 'PO_TRANSACTION_EXCEPTION',
    checkTitle: CONFIG.MISSING_EVIDENCE_TITLE,
    spendCategory: clean(row.spend_category) || 'Unclassified',
    vendorName: clean(row.vendor_name) || 'Unavailable',
    vendorCode: clean(row.vendor_code),
    materialCode: clean(row.material_code),
    materialDesc: clean(row.material_desc) || 'Unavailable',
    plant: clean(row.plant),
    rows: [row],
    exposureInr: 0,
    financialExposureStatus: 'NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED',
    financialExposureStatusLabel: 'Additional source data is required; no exposure quantified',
    methodologyDescription: CONFIG.MISSING_EVIDENCE_METHOD,
    evidenceDetails: gaps,
    dataGapsDisclosed: gaps,
    potentialRelatedLevers: [],
    nextActionRequired: 'Correct the missing source identifiers in the assessment data and rerun the control review.',
    defaultStatus: 'DATA_INSUFFICIENT'
  }, options)];
});

export const buildProcurementComplianceResult = (
  assessmentId: string,
  tenantId: string,
  customerName: string,
  transactions: StrategicInputTransaction[],
  options: ProcurementComplianceOptions = {}
): ProcurementComplianceResult => {
  const exceptions = [
    ...buildPriceExceptions(transactions, options),
    ...buildDuplicateScheduleExceptions(transactions, options),
    ...buildMissingEvidenceExceptions(transactions, options)
  ].sort((left, right) => left.exceptionId.localeCompare(right.exceptionId));
  return {
    assessmentId,
    customerName,
    calculatedAt: new Date().toISOString(),
    summary: buildComplianceSummary(tenantId, customerName, transactions, exceptions),
    controlChecks: buildControlChecks(transactions, exceptions),
    exceptions,
    methodologySafeguards: [...CONFIG.METHODOLOGY_SAFEGUARDS],
    financialDisclaimer: CONFIG.FINANCIAL_DISCLAIMER,
    contractComplianceNotice: CONFIG.CONTRACT_STATUS
  };
};

export const loadProcurementComplianceReviewHistory = async (
  db: CloudflareD1Database,
  assessmentId: string
): Promise<Record<string, ComplianceReviewRecord[]>> => {
  const response = await db.prepare(`
    SELECT review_id, assessment_id, exception_id, reviewer_name, reviewer_role, review_date, status,
      technical_justification, corrective_action_plan, dismissal_reason
    FROM ${D1_TABLES.complianceReviews}
    WHERE assessment_id = ?
    ORDER BY review_date ASC, review_id ASC
  `).bind(assessmentId).all<ProcurementComplianceReviewD1Row>();
  const history: Record<string, ComplianceReviewRecord[]> = {};
  for (const row of response.results || []) {
    const record: ComplianceReviewRecord = {
      reviewId: row.review_id,
      exceptionId: row.exception_id,
      reviewerName: row.reviewer_name,
      reviewDate: row.review_date,
      status: row.status,
      technicalJustification: row.technical_justification,
      ...(row.reviewer_role ? { reviewerRole: row.reviewer_role } : {}),
      ...(row.corrective_action_plan ? { correctiveActionPlan: row.corrective_action_plan } : {}),
      ...(row.dismissal_reason ? { dismissalReason: row.dismissal_reason } : {})
    };
    history[row.exception_id] = [...(history[row.exception_id] || []), record];
  }
  return history;
};
