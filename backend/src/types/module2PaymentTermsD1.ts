export interface PaymentTermsD1SourceRow {
  record_id?: string | null;
  transaction_id?: string | null;
  po_number?: string | null;
  po_date?: string | null;
  supplier_code?: string | null;
  supplier_name?: string | null;
  spend_category?: string | null;
  spend_inr?: number | string | null;
  raw_json?: string | Record<string, unknown> | null;
}

export interface PaymentTermsFieldEvidence {
  fieldPresent: boolean;
  sourceParseFailed: boolean;
  rawPaymentTerms?: string;
  directCreditDays?: number;
  discountPercent?: number;
  discountDays?: number;
}

export interface PaymentTermsParsedEvidence {
  creditDays?: number;
  nonCreditTerms: boolean;
}

export interface PaymentTermsCoverageClassification {
  coverageStatus: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  gapReason?: 'FIELD_NOT_IN_SOURCE_ERP' | 'UNPARSEABLE_PAYMENT_TERM_FORMAT';
  gapDetails?: string;
  requiresValidation: boolean;
}

export interface PaymentTermsSupplierAccumulator {
  supplierCode: string;
  supplierName: string;
  spendCategory: string;
  totalSpendInr: number;
  transactionCount: number;
  termsSpend: Map<string, number>;
  creditDaysSpend: number;
  verifiedSpendInr: number;
  incompleteRecordCount: number;
}
