import type {
  VgtParetoHierarchy,
  VgtParetoHierarchyParent,
  VgtParetoHierarchyChild,
  VgtParetoReconciliation
} from '../types/module1Canonical';
import type { VgtProcessingResult } from '../types/vgt';

interface EntitySpendData {
  totalInr: number;
  subMap: Map<string, { spendInr: number; count: number }>;
}

export class Module1ParetoHierarchyBuilder {
  public static build(result: VgtProcessingResult, totalInr: number): VgtParetoHierarchy {
    const { suppMap, itemMap } = this.buildMaps(result);
    const { supplierToShortText, vendorParetoInr } = this.buildSupplierHierarchy(suppMap, totalInr);
    const { shortTextToSupplier, itemParetoInr } = this.buildItemHierarchy(itemMap, totalInr);

    const vendorChildVariance = this.verifyChildVariance(supplierToShortText);
    const itemChildVariance = this.verifyChildVariance(shortTextToSupplier);

    const totalSpendCr = Number((totalInr / 10000000).toFixed(4));
    const reconciliation: VgtParetoReconciliation = {
      totalValidSpendCr: totalSpendCr,
      vendorParetoSpendCr: Number((vendorParetoInr / 10000000).toFixed(4)),
      vendorParetoSpendPct: totalInr > 0 ? Number(((vendorParetoInr / totalInr) * 100).toFixed(2)) : 0,
      vendorEntitiesCount: supplierToShortText.length,
      itemParetoSpendCr: Number((itemParetoInr / 10000000).toFixed(4)),
      itemParetoSpendPct: totalInr > 0 ? Number(((itemParetoInr / totalInr) * 100).toFixed(2)) : 0,
      itemEntitiesCount: shortTextToSupplier.length,
      vendorChildVarianceCr: Number(vendorChildVariance.toFixed(4)),
      itemChildVarianceCr: Number(itemChildVariance.toFixed(4)),
      reconciliationStatus:
        vendorChildVariance < 0.05 && itemChildVariance < 0.05 ? 'RECONCILED' : 'VARIANCE_DETECTED'
    };

    return {
      supplierToShortText,
      shortTextToSupplier,
      reconciliation
    };
  }

  private static buildMaps(result: VgtProcessingResult): {
    suppMap: Map<string, EntitySpendData>;
    itemMap: Map<string, EntitySpendData>;
  } {
    const validRows = result.validRows || [];
    const validTxs = result.validNormalizedTransactions || [];

    const suppMap = new Map<string, EntitySpendData>();
    const itemMap = new Map<string, EntitySpendData>();

    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      const tx = validTxs[i];
      const spend = tx?.inrNormalizedValue ?? r?.lineSpendInr ?? 0;
      const supp = r?.vendorName?.trim() || 'UNKNOWN_VENDOR';
      const rawItem = (r?.itemDescription || '').trim();
      const item = rawItem.length > 0 ? rawItem : '[Blank / Unspecified]';

      this.addToMap(suppMap, supp, item, spend);
      this.addToMap(itemMap, item, supp, spend);
    }

    return { suppMap, itemMap };
  }

  private static addToMap(
    map: Map<string, EntitySpendData>,
    primaryKey: string,
    subKey: string,
    spend: number
  ): void {
    let entry = map.get(primaryKey);
    if (!entry) {
      entry = { totalInr: 0, subMap: new Map() };
      map.set(primaryKey, entry);
    }
    entry.totalInr += spend;

    const subItem = entry.subMap.get(subKey) || { spendInr: 0, count: 0 };
    subItem.spendInr += spend;
    subItem.count++;
    entry.subMap.set(subKey, subItem);
  }

  private static buildSupplierHierarchy(
    suppMap: Map<string, EntitySpendData>,
    totalInr: number
  ): { supplierToShortText: VgtParetoHierarchyParent[]; vendorParetoInr: number } {
    const sorted = Array.from(suppMap.entries()).sort((a, b) => b[1].totalInr - a[1].totalInr);
    let cumInr = 0;
    let paretoInr = 0;
    let boundaryMarked = false;
    const hierarchy: VgtParetoHierarchyParent[] = [];

    for (let idx = 0; idx < sorted.length; idx++) {
      const [name, data] = sorted[idx];
      cumInr += data.totalInr;
      paretoInr += data.totalInr;
      const parentCr = Number((data.totalInr / 10000000).toFixed(4));
      const cumCr = Number((cumInr / 10000000).toFixed(2));
      const sharePct = totalInr > 0 ? Number(((data.totalInr / totalInr) * 100).toFixed(2)) : 0;
      const cumPct = totalInr > 0 ? Number(((cumInr / totalInr) * 100).toFixed(2)) : 0;

      const children: VgtParetoHierarchyChild[] = Array.from(data.subMap.entries())
        .map(([cName, cData]) => ({
          name: cName,
          spendCr: Number((cData.spendInr / 10000000).toFixed(4)),
          percentage: data.totalInr > 0 ? Number(((cData.spendInr / data.totalInr) * 100).toFixed(1)) : 0,
          transactionCount: cData.count
        }))
        .sort((a, b) => b.spendCr - a.spendCr);

      const isCutoff = !boundaryMarked && cumPct >= 80;
      if (isCutoff) {
        boundaryMarked = true;
      }

      hierarchy.push({
        id: `VENDOR-${idx + 1}-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 30)}`,
        name,
        totalSpendCr: parentCr,
        sharePct,
        cumulativeSpendCr: cumCr,
        cumulativePct: cumPct,
        children,
        transactionCount: children.reduce((acc, c) => acc + (c.transactionCount || 0), 0),
        isCutoffBoundary: isCutoff
      });

      if (cumPct >= 80) {
        break;
      }
    }

    return { supplierToShortText: hierarchy, vendorParetoInr: paretoInr };
  }

  private static buildItemHierarchy(
    itemMap: Map<string, EntitySpendData>,
    totalInr: number
  ): { shortTextToSupplier: VgtParetoHierarchyParent[]; itemParetoInr: number } {
    const sorted = Array.from(itemMap.entries()).sort((a, b) => b[1].totalInr - a[1].totalInr);
    let cumInr = 0;
    let paretoInr = 0;
    let boundaryMarked = false;
    const hierarchy: VgtParetoHierarchyParent[] = [];

    for (let idx = 0; idx < sorted.length; idx++) {
      const [name, data] = sorted[idx];
      cumInr += data.totalInr;
      paretoInr += data.totalInr;
      const parentCr = Number((data.totalInr / 10000000).toFixed(4));
      const cumCr = Number((cumInr / 10000000).toFixed(2));
      const sharePct = totalInr > 0 ? Number(((data.totalInr / totalInr) * 100).toFixed(2)) : 0;
      const cumPct = totalInr > 0 ? Number(((cumInr / totalInr) * 100).toFixed(2)) : 0;

      const children: VgtParetoHierarchyChild[] = Array.from(data.subMap.entries())
        .map(([cName, cData]) => ({
          name: cName,
          spendCr: Number((cData.spendInr / 10000000).toFixed(4)),
          percentage: data.totalInr > 0 ? Number(((cData.spendInr / data.totalInr) * 100).toFixed(1)) : 0,
          transactionCount: cData.count
        }))
        .sort((a, b) => b.spendCr - a.spendCr);

      const isCutoff = !boundaryMarked && cumPct >= 80;
      if (isCutoff) {
        boundaryMarked = true;
      }

      hierarchy.push({
        id: `ITEM-${idx + 1}-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 30)}`,
        name,
        totalSpendCr: parentCr,
        sharePct,
        cumulativeSpendCr: cumCr,
        cumulativePct: cumPct,
        children,
        transactionCount: children.reduce((acc, c) => acc + (c.transactionCount || 0), 0),
        isCutoffBoundary: isCutoff
      });

      if (cumPct >= 80) {
        break;
      }
    }

    return { shortTextToSupplier: hierarchy, itemParetoInr: paretoInr };
  }

  private static verifyChildVariance(hierarchy: VgtParetoHierarchyParent[]): number {
    let variance = 0;
    for (const parent of hierarchy) {
      const childSum = parent.children.reduce((sum, c) => sum + c.spendCr, 0);
      const diff = Math.abs(parent.totalSpendCr - childSum);
      if (diff > 0.01) {
        variance += diff;
      }
    }
    return variance;
  }
}
