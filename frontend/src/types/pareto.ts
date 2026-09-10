/**
 * Pareto 80/20 Spend Hierarchy Types
 */

export interface ParetoHierarchyChild {
  name: string;
  spendCr: number;
  percentage: number;
}

export interface ParetoHierarchyParent {
  id: string;
  name: string;
  totalSpendCr: number;
  sharePct: number;
  cumulativeSpendCr: number;
  cumulativePct: number;
  children: ParetoHierarchyChild[];
  isCutoffBoundary?: boolean;
}

export interface ParetoSpendData {
  vendorHierarchy: ParetoHierarchyParent[];
  itemHierarchy: ParetoHierarchyParent[];
  totalSpendCr: number;
  paretoSpendCr: number;
  paretoPct: number;
}

export interface ParetoRawRecord {
  vendorName: string;
  shortText: string;
  spendCr: number;
}

export interface ParetoSpendHierarchyProps {
  vendorHierarchy?: ParetoHierarchyParent[];
  itemHierarchy?: ParetoHierarchyParent[];
  totalSpendCr?: number;
  currency?: string;
  onNavigateToValidation?: () => void;
}
