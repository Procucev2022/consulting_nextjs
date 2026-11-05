import type { Module2StrategicSourcingEngine } from '../services/module2StrategicSourcingEngine';
import type { StrategicInputTransaction } from './strategicSourcing';
import type { CategoryStrategicSourcingProfile } from './module2StrategicSourcing';

export interface ScopedCategoryProfile extends CategoryStrategicSourcingProfile {
  sourceCategoryKey: string;
  detailsOmitted: true;
}

export interface ScopedModule2Analysis {
  transactions: StrategicInputTransaction[];
  analysis: ReturnType<typeof Module2StrategicSourcingEngine.analyze>;
}

export interface ScopedModule2CacheEntry {
  expiresAt: number;
  rowCount: number;
  value: Promise<ScopedModule2Analysis>;
}

export interface ScopedModule2Supplier {
  supplierName: string;
  categories: string[];
  totalSpendInr: number;
  totalTransactions: number;
  potentialConsolidationRelevance: string;
}
