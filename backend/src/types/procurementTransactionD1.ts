import type { z } from 'zod';
import type { procurementTransactionScopeSchema } from '../constants/procurementTransactionD1';
import type { RawTransactionLedgerRecord } from './module1Forensic';

export type ProcurementTransactionScope = z.infer<typeof procurementTransactionScopeSchema>;

export interface ProcurementTransactionQuery {
  sql: string;
  values: string[];
  cacheKey: string;
}

export interface ProcurementTransactionRow {
  raw_json: string;
}

export type ProcurementTransactionScopeCache = Map<string, RawTransactionLedgerRecord[]>;
