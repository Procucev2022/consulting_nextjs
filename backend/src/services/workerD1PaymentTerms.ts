import {
  MODULE2_D1_PAYMENT_TERMS, MODULE2_D1_PAYMENT_TERMS_MESSAGES
} from '../constants/module2PaymentTermsD1';
import type {
  PaymentTermsCoverageClassification, PaymentTermsD1SourceRow, PaymentTermsFieldEvidence,
  PaymentTermsParsedEvidence, PaymentTermsSupplierAccumulator
} from '../types/module2PaymentTermsD1';
import type {
  PaymentTermsDataAvailabilityStatus, PaymentTermsDataGapReason, PaymentTermsRecordCoverage,
  PaymentTermsResult, SupplierPaymentTermsProfile
} from '../types/module2PaymentTerms';

const sourceObject = (rawJson: PaymentTermsD1SourceRow['raw_json']): {
  values: Record<string, unknown>;
  sourceParseFailed: boolean;
} => {
  if (rawJson && typeof rawJson === 'object' && !Array.isArray(rawJson)) {
    return { values: rawJson, sourceParseFailed: false };
  }
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    return { values: {}, sourceParseFailed: false };
  }
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { values: parsed as Record<string, unknown>, sourceParseFailed: false };
    }
    return { values: {}, sourceParseFailed: true };
  } catch {
    return { values: {}, sourceParseFailed: true };
  }
};

const normalizedFieldName = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/gu, '');

const numberFrom = (value: unknown): number | undefined => {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const normalized = String(value).trim().replaceAll(',', '');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const fieldValue = (
  values: Record<string, unknown>, aliases: readonly string[]
): { present: boolean; value: unknown; key: string } => {
  const entry = Object.entries(values).find(([key]) => aliases.includes(normalizedFieldName(key)));
  return entry ? { present: true, value: entry[1], key: normalizedFieldName(entry[0]) }
    : { present: false, value: undefined, key: '' };
};

export const extractPaymentTermsEvidence = (
  rawJson: PaymentTermsD1SourceRow['raw_json']
): PaymentTermsFieldEvidence => {
  const source = sourceObject(rawJson);
  const term = fieldValue(source.values, MODULE2_D1_PAYMENT_TERMS.TERM_FIELD_ALIASES);
  const creditDays = term.key === 'creditdays' || term.key === 'paymentdays'
    ? numberFrom(term.value) : undefined;
  const discountPercent = numberFrom(fieldValue(
    source.values, MODULE2_D1_PAYMENT_TERMS.DISCOUNT_PERCENT_ALIASES
  ).value);
  const discountDays = numberFrom(fieldValue(
    source.values, MODULE2_D1_PAYMENT_TERMS.DISCOUNT_DAYS_ALIASES
  ).value);
  const rawPaymentTerms = term.value === null || term.value === undefined
    ? undefined : String(term.value).trim() || undefined;
  return {
    fieldPresent: term.present,
    sourceParseFailed: source.sourceParseFailed,
    rawPaymentTerms,
    directCreditDays: creditDays,
    discountPercent: discountPercent !== undefined && discountPercent > 0 ? discountPercent : undefined,
    discountDays: discountDays !== undefined && discountDays > 0 ? discountDays : undefined
  };
};

const uniqueDayCount = (matches: Iterable<RegExpMatchArray>): number | undefined => {
  const days = [...new Set([...matches].map((match) => Number(match[1])))];
  if (days.length !== 1 || days[0] < 0 || days[0] > MODULE2_D1_PAYMENT_TERMS.MAX_CREDIT_DAYS) return undefined;
  return days[0];
};

export const parsePaymentTermsEvidence = (
  evidence: PaymentTermsFieldEvidence
): PaymentTermsParsedEvidence => {
  const directDays = evidence.directCreditDays;
  if (directDays !== undefined && Number.isInteger(directDays) && directDays >= 0 &&
    directDays <= MODULE2_D1_PAYMENT_TERMS.MAX_CREDIT_DAYS) {
    return { creditDays: directDays, nonCreditTerms: directDays === 0 };
  }
  const terms = evidence.rawPaymentTerms?.trim() || '';
  if (MODULE2_D1_PAYMENT_TERMS.NON_CREDIT_TERM_PATTERN.test(terms)) {
    return { creditDays: 0, nonCreditTerms: true };
  }
  if (!terms || MODULE2_D1_PAYMENT_TERMS.END_OF_MONTH_PATTERN.test(terms)) {
    return { nonCreditTerms: false };
  }
  if (MODULE2_D1_PAYMENT_TERMS.AMBIGUOUS_TERMS_PATTERN.test(terms)) {
    return { nonCreditTerms: false };
  }
  const netPattern = new RegExp(MODULE2_D1_PAYMENT_TERMS.NET_DAYS_PATTERN.source, 'gi');
  const netDays = uniqueDayCount(terms.matchAll(netPattern));
  if (netDays !== undefined) return { creditDays: netDays, nonCreditTerms: netDays === 0 };
  const dayPattern = new RegExp(MODULE2_D1_PAYMENT_TERMS.DAY_COUNT_PATTERN.source, 'gi');
  const parsedDays = uniqueDayCount(terms.matchAll(dayPattern));
  return parsedDays === undefined
    ? { nonCreditTerms: false }
    : { creditDays: parsedDays, nonCreditTerms: parsedDays === 0 };
};

const safeSpend = (value: PaymentTermsD1SourceRow['spend_inr']): number => {
  const parsed = numberFrom(value);
  return parsed !== undefined && parsed >= 0 ? parsed : 0;
};

const availabilityFor = (
  records: PaymentTermsRecordCoverage[]
): PaymentTermsDataAvailabilityStatus => {
  const completeCount = records.filter((record) => record.coverageStatus ===
    MODULE2_D1_PAYMENT_TERMS.COMPLETE_RECORD_STATUS).length;
  if (completeCount === 0) return MODULE2_D1_PAYMENT_TERMS.DATA_UNAVAILABLE_STATUS;
  if (completeCount < records.length) return MODULE2_D1_PAYMENT_TERMS.PARTIAL_STATUS;
  return MODULE2_D1_PAYMENT_TERMS.NOT_QUANTIFIABLE_STATUS;
};

const profileAvailability = (profile: PaymentTermsSupplierAccumulator): PaymentTermsDataAvailabilityStatus => {
  if (profile.incompleteRecordCount === profile.transactionCount) {
    return MODULE2_D1_PAYMENT_TERMS.DATA_UNAVAILABLE_STATUS;
  }
  if (profile.incompleteRecordCount > 0) return MODULE2_D1_PAYMENT_TERMS.PARTIAL_STATUS;
  return MODULE2_D1_PAYMENT_TERMS.NOT_QUANTIFIABLE_STATUS;
};

const coverageClassification = (
  evidence: PaymentTermsFieldEvidence, parsed: PaymentTermsParsedEvidence
): PaymentTermsCoverageClassification => {
  const complete = evidence.fieldPresent && parsed.creditDays !== undefined && !evidence.sourceParseFailed;
  const missingField = !evidence.fieldPresent && !evidence.sourceParseFailed;
  const gapReason: PaymentTermsDataGapReason | undefined = complete ? undefined
    : missingField ? 'FIELD_NOT_IN_SOURCE_ERP' : 'UNPARSEABLE_PAYMENT_TERM_FORMAT';
  const coverageStatus = complete ? MODULE2_D1_PAYMENT_TERMS.COMPLETE_RECORD_STATUS
    : missingField ? MODULE2_D1_PAYMENT_TERMS.MISSING_RECORD_STATUS
      : MODULE2_D1_PAYMENT_TERMS.PARTIAL_RECORD_STATUS;
  const gapDetails = evidence.sourceParseFailed ? MODULE2_D1_PAYMENT_TERMS_MESSAGES.INVALID_SOURCE
    : gapReason === 'FIELD_NOT_IN_SOURCE_ERP' ? MODULE2_D1_PAYMENT_TERMS_MESSAGES.MISSING_FIELD
      : gapReason ? MODULE2_D1_PAYMENT_TERMS_MESSAGES.UNPARSEABLE : undefined;
  return { coverageStatus, gapReason, gapDetails, requiresValidation: !complete };
};

const recordCoverage = (row: PaymentTermsD1SourceRow): PaymentTermsRecordCoverage => {
  const evidence = extractPaymentTermsEvidence(row.raw_json);
  const parsed = parsePaymentTermsEvidence(evidence);
  const classification = coverageClassification(evidence, parsed);
  return {
    recordId: String(row.record_id || row.transaction_id || ''),
    vendorCode: String(row.supplier_code || ''),
    vendorName: String(row.supplier_name || MODULE2_D1_PAYMENT_TERMS.UNKNOWN_VALUE),
    poNumber: String(row.po_number || ''),
    poDate: String(row.po_date || ''),
    spendInr: safeSpend(row.spend_inr),
    rawPaymentTerms: evidence.rawPaymentTerms,
    parsedCreditDays: parsed.creditDays,
    hasDiscountTerms: evidence.discountPercent !== undefined || evidence.discountDays !== undefined,
    discountPercent: evidence.discountPercent,
    discountDays: evidence.discountDays,
    ...classification
  };
};

const supplierKey = (record: PaymentTermsRecordCoverage, category: string): string =>
  `${record.vendorCode.toLowerCase()}|${record.vendorName.toLowerCase()}|${category.toLowerCase()}`;

const supplierProfiles = (
  rows: PaymentTermsD1SourceRow[], records: PaymentTermsRecordCoverage[]
): SupplierPaymentTermsProfile[] => {
  const profiles = new Map<string, PaymentTermsSupplierAccumulator>();
  rows.forEach((row, index) => {
    const record = records[index];
    const category = String(row.spend_category || MODULE2_D1_PAYMENT_TERMS.UNKNOWN_VALUE);
    const key = supplierKey(record, category);
    const profile = profiles.get(key) || {
      supplierCode: record.vendorCode || MODULE2_D1_PAYMENT_TERMS.UNKNOWN_VALUE,
      supplierName: record.vendorName,
      spendCategory: category,
      totalSpendInr: 0,
      transactionCount: 0,
      termsSpend: new Map<string, number>(),
      creditDaysSpend: 0,
      verifiedSpendInr: 0,
      incompleteRecordCount: 0
    };
    profile.totalSpendInr += record.spendInr;
    profile.transactionCount += 1;
    if (record.rawPaymentTerms && record.coverageStatus === MODULE2_D1_PAYMENT_TERMS.COMPLETE_RECORD_STATUS) {
      profile.termsSpend.set(record.rawPaymentTerms,
        (profile.termsSpend.get(record.rawPaymentTerms) || 0) + record.spendInr);
    }
    if (record.coverageStatus === MODULE2_D1_PAYMENT_TERMS.COMPLETE_RECORD_STATUS) {
      profile.verifiedSpendInr += record.spendInr;
      profile.creditDaysSpend += (record.parsedCreditDays || 0) * record.spendInr;
    } else profile.incompleteRecordCount += 1;
    profiles.set(key, profile);
  });
  return [...profiles.values()].map((profile) => {
    const observedPaymentTerms = [...profile.termsSpend.keys()].sort();
    const primaryPaymentTerms = [...profile.termsSpend.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] || '';
    const dataAvailability = profileAvailability(profile);
    return {
      supplierCode: profile.supplierCode,
      supplierName: profile.supplierName,
      spendCategory: profile.spendCategory,
      totalSpendInr: profile.totalSpendInr,
      totalSpendCr: profile.totalSpendInr / MODULE2_D1_PAYMENT_TERMS.INR_PER_CRORE,
      transactionCount: profile.transactionCount,
      observedPaymentTerms,
      primaryPaymentTerms,
      weightedAvgCreditDays: profile.verifiedSpendInr > 0
        ? profile.creditDaysSpend / profile.verifiedSpendInr : 0,
      dataAvailability,
      indicativeWorkingCapitalReleasedCr: 0,
      indicativeFinancingBenefitCr: 0,
      earlyPaymentDiscountOpportunityCr: 0,
      requiresValidation: profile.incompleteRecordCount > 0
    };
  }).sort((left, right) => right.totalSpendInr - left.totalSpendInr);
};

export const buildPaymentTermsResult = (
  assessmentId: string, rows: PaymentTermsD1SourceRow[]
): PaymentTermsResult => {
  const coverageRecords = rows.map(recordCoverage);
  const totalSpendInr = coverageRecords.reduce((sum, record) => sum + record.spendInr, 0);
  const completeRecords = coverageRecords.filter((record) => record.coverageStatus ===
    MODULE2_D1_PAYMENT_TERMS.COMPLETE_RECORD_STATUS);
  const incompleteRecords = coverageRecords.filter((record) => record.coverageStatus !==
    MODULE2_D1_PAYMENT_TERMS.COMPLETE_RECORD_STATUS);
  const verifiedSpendInr = completeRecords.reduce((sum, record) => sum + record.spendInr, 0);
  const missingSpendInr = incompleteRecords.reduce((sum, record) => sum + record.spendInr, 0);
  const gapReasonCounts = incompleteRecords.reduce<Record<string, number>>((counts, record) => {
    const reason = record.gapReason as PaymentTermsDataGapReason;
    counts[reason] = (counts[reason] || 0) + 1;
    return counts;
  }, {});
  const totalRecordsCount = coverageRecords.length;
  const coverageSummary = {
    assessmentId,
    totalSpendAnalysedInr: totalSpendInr,
    totalSpendAnalysedCr: totalSpendInr / MODULE2_D1_PAYMENT_TERMS.INR_PER_CRORE,
    verifiedSpendInr,
    verifiedSpendCr: verifiedSpendInr / MODULE2_D1_PAYMENT_TERMS.INR_PER_CRORE,
    missingSpendInr,
    missingSpendCr: missingSpendInr / MODULE2_D1_PAYMENT_TERMS.INR_PER_CRORE,
    verifiedSpendPct: totalSpendInr > 0 ? verifiedSpendInr / totalSpendInr * 100 : 0,
    missingSpendPct: totalSpendInr > 0 ? missingSpendInr / totalSpendInr * 100 : 0,
    totalRecordsCount,
    completeRecordsCount: completeRecords.length,
    partialRecordsCount: coverageRecords.filter((record) => record.coverageStatus ===
      MODULE2_D1_PAYMENT_TERMS.PARTIAL_RECORD_STATUS).length,
    missingRecordsCount: coverageRecords.filter((record) => record.coverageStatus ===
      MODULE2_D1_PAYMENT_TERMS.MISSING_RECORD_STATUS).length,
    recordsRequiringValidationCount: incompleteRecords.length,
    gapReasonCounts,
    overallDataAvailabilityStatus: availabilityFor(coverageRecords),
    overallStatusDisplayText: MODULE2_D1_PAYMENT_TERMS.STATUS_DISPLAY_LABELS[
      availabilityFor(coverageRecords)
    ],
    reconciliationDeltaInr: totalSpendInr - verifiedSpendInr - missingSpendInr,
    procucevModellingRatePctPer30Days: MODULE2_D1_PAYMENT_TERMS.MODELLING_RATE_PER_30_DAYS * 100,
    totalWorkingCapitalReleasedCr: 0,
    totalFinancingBenefitCr: 0,
    totalEarlyPaymentDiscountsCr: 0
  };
  return {
    assessmentId,
    coverageSummary,
    opportunities: [],
    supplierProfiles: supplierProfiles(rows, coverageRecords),
    coverageRecords,
    methodologyDisclosures: [
      MODULE2_D1_PAYMENT_TERMS_MESSAGES.SOURCE_DISCLOSURE,
      MODULE2_D1_PAYMENT_TERMS_MESSAGES.BENEFIT_DISCLOSURE,
      MODULE2_D1_PAYMENT_TERMS_MESSAGES.NO_FINANCING_BENEFIT
    ]
  };
};

