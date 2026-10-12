import type {
  VgtSupplierSpendItem,
  VgtMaterialGroupSpendItem,
  VgtPlantSpendItem,
  VgtMonthlySpendItem,
  VgtCurrencyBreakdownItem,
  VgtActualDataCoverage,
  VgtPeriodMetadata,
  VgtParetoHierarchy
} from '../types/module1Canonical';
import type { VgtProcessingResult } from '../types/vgt';
import { Module1ParetoHierarchyBuilder } from './module1ParetoHierarchyBuilder';
import { Module1PeriodMetadataBuilder } from './module1PeriodMetadataBuilder';

export class Module1CanonicalAggregator {
  public static buildSupplierSpend(result: VgtProcessingResult, totalInr: number): VgtSupplierSpendItem[] {
    const suppMap = new Map<string, { count: number; spendInr: number }>();
    const validRows = result.validRows || [];
    const validTxs = result.validNormalizedTransactions || [];

    for (let i = 0; i < validRows.length; i++) {
      const name = validRows[i].vendorName;
      const val = validTxs[i]?.inrNormalizedValue ?? 0;
      const ex = suppMap.get(name) || { count: 0, spendInr: 0 };
      ex.count++;
      ex.spendInr += val;
      suppMap.set(name, ex);
    }

    const sorted = Array.from(suppMap.entries()).sort((a, b) => b[1].spendInr - a[1].spendInr);
    let cumulative = 0;
    return sorted.map(([name, data], idx) => {
      cumulative += data.spendInr;
      const share = totalInr > 0 ? (data.spendInr / totalInr) * 100 : 0;
      const cumPct = totalInr > 0 ? (cumulative / totalInr) * 100 : 0;
      const cr = Number((data.spendInr / 10000000).toFixed(4));
      return {
        rank: idx + 1,
        supplierName: name,
        supplier_name: name,
        transactionCount: data.count,
        records_count: data.count,
        spendInr: Number(data.spendInr.toFixed(2)),
        spendCr: cr,
        spend_inr_cr: cr,
        sharePct: Number(share.toFixed(2)),
        share_pct: Number(share.toFixed(2)),
        cumulativePct: Number(cumPct.toFixed(2)),
        cumulative_share_pct: Number(cumPct.toFixed(2)),
        paretoClass: cumPct <= 80 ? 'A' : 'B',
        in_pareto_80: cumPct <= 80
      };
    });
  }

  public static buildMaterialGroupSpend(result: VgtProcessingResult, totalInr: number): VgtMaterialGroupSpendItem[] {
    const mgMap = new Map<string, { count: number; spendInr: number }>();
    const validRows = result.validRows || [];
    const validTxs = result.validNormalizedTransactions || [];

    for (let i = 0; i < validRows.length; i++) {
      const cat = validRows[i].materialGroup || 'Direct Material';
      const val = validTxs[i]?.inrNormalizedValue ?? 0;
      const ex = mgMap.get(cat) || { count: 0, spendInr: 0 };
      ex.count++;
      ex.spendInr += val;
      mgMap.set(cat, ex);
    }

    const sorted = Array.from(mgMap.entries()).sort((a, b) => b[1].spendInr - a[1].spendInr);
    return sorted.map(([cat, data]) => {
      const share = totalInr > 0 ? (data.spendInr / totalInr) * 100 : 0;
      const cr = Number((data.spendInr / 10000000).toFixed(4));
      return {
        groupCode: cat,
        group_code: cat,
        groupName: `${cat} Materials & Supplies`,
        group_name: `${cat} Materials & Supplies`,
        recordCount: data.count,
        records_count: data.count,
        spendInr: Number(data.spendInr.toFixed(2)),
        spendCr: cr,
        spend_inr_cr: cr,
        sharePct: Number(share.toFixed(2)),
        share_pct: Number(share.toFixed(2)),
        color: '#0284c7'
      };
    });
  }

  public static buildPlantSpend(result: VgtProcessingResult, totalInr: number): VgtPlantSpendItem[] {
    const plantMap = new Map<string, { count: number; spendInr: number }>();
    const validRows = result.validRows || [];
    const validTxs = result.validNormalizedTransactions || [];

    for (let i = 0; i < validRows.length; i++) {
      const plant = validRows[i].plant;
      const val = validTxs[i]?.inrNormalizedValue ?? 0;
      const ex = plantMap.get(plant) || { count: 0, spendInr: 0 };
      ex.count++;
      ex.spendInr += val;
      plantMap.set(plant, ex);
    }

    const sorted = Array.from(plantMap.entries()).sort((a, b) => b[1].spendInr - a[1].spendInr);
    return sorted.map(([code, data]) => {
      const share = totalInr > 0 ? (data.spendInr / totalInr) * 100 : 0;
      const cr = Number((data.spendInr / 10000000).toFixed(4));
      return {
        plantCode: code,
        plant_code: code,
        plantName: `Plant ${code} Facility`,
        plant_name: `Plant ${code} Facility`,
        recordCount: data.count,
        records_count: data.count,
        spendInr: Number(data.spendInr.toFixed(2)),
        spendCr: cr,
        spend_inr_cr: cr,
        sharePct: Number(share.toFixed(2)),
        share_pct: Number(share.toFixed(2))
      };
    });
  }

  public static getIndianFiscalYear(mKey: string): string {
    return Module1PeriodMetadataBuilder.getIndianFiscalYear(mKey);
  }

  public static buildMonthlySpend(result: VgtProcessingResult): VgtMonthlySpendItem[] {
    const monthMap = new Map<string, { count: number; spendInr: number }>();
    const validRows = result.validRows || [];
    const validTxs = result.validNormalizedTransactions || [];

    for (let i = 0; i < validRows.length; i++) {
      const date = validRows[i].transactionDate;
      const mKey = date.slice(0, 7);
      const val = validTxs[i]?.inrNormalizedValue ?? 0;
      const ex = monthMap.get(mKey) || { count: 0, spendInr: 0 };
      ex.count++;
      ex.spendInr += val;
      monthMap.set(mKey, ex);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let prevSpendInr = 0;

    return sorted.map(([mKey, data], idx) => {
      const fy = this.getIndianFiscalYear(mKey);
      const [y, m] = mKey.split('-');
      const mIdx = (parseInt(m || '1', 10) - 1 + 12) % 12;
      const label = `${monthNames[mIdx]} ${y}`;
      const cr = Number((data.spendInr / 10000000).toFixed(4));
      const momChange = idx > 0 && prevSpendInr > 0
        ? Number((((data.spendInr - prevSpendInr) / prevSpendInr) * 100).toFixed(1))
        : 0;
      prevSpendInr = data.spendInr;

      return {
        monthKey: mKey,
        month_key: mKey,
        monthLabel: label,
        month_label: label,
        fiscalYear: fy,
        recordCount: data.count,
        records_count: data.count,
        spendInr: Number(data.spendInr.toFixed(2)),
        spendCr: cr,
        spend_inr_cr: cr,
        mom_change_pct: momChange
      };
    });
  }

  public static buildPeriodMetadata(monthlySpend: VgtMonthlySpendItem[]): VgtPeriodMetadata {
    return Module1PeriodMetadataBuilder.build(monthlySpend);
  }

  public static buildCurrencyBreakdown(result: VgtProcessingResult): VgtCurrencyBreakdownItem[] {
    return result.forensicBridge.currencyBridges.map((b) => ({
      currency: b.currency,
      transactionCount: b.validTxCount,
      originalSpend: b.originalValue,
      profileFxRate: b.profileRate,
      profileSpendInr: b.profileInrValue,
      profileSpendCr: b.profileInrCr,
      historicalSpendInr: b.historicalInrValue,
      historicalSpendCr: b.historicalInrCr,
      fxImpactInr: b.fxImpactInr,
      fxImpactCr: b.fxImpactCr,
      fxImpactPct: b.fxImpactPct
    }));
  }

  public static buildDataCoverage(monthlySpend: VgtMonthlySpendItem[]): VgtActualDataCoverage {
    if (monthlySpend.length === 0) {
      return {
        billingMonthsCount: 0,
        startDate: 'N/A',
        endDate: 'N/A',
        firstTransactionDate: 'N/A',
        lastTransactionDate: 'N/A',
        dateRangeLabel: '0 Billing Months',
        coverageDescription: '0 Billing Months'
      };
    }
    const getMKey = (m?: VgtMonthlySpendItem): string => m?.monthKey ?? m?.month_key ?? '2024-04';
    const sortedMonths = [...monthlySpend].sort((a, b) => getMKey(a).localeCompare(getMKey(b)));
    const firstKey = getMKey(sortedMonths[0]);
    const lastKey = getMKey(sortedMonths[sortedMonths.length - 1]);
    const start = `${firstKey}-01`;
    const [lastYr, lastMo] = lastKey.split('-').map(Number);
    const lastDay = new Date(lastYr || 2025, lastMo || 1, 0).getDate();
    const end = `${lastKey}-${String(lastDay).padStart(2, '0')}`;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fmtMonth = (k: string): string => {
      const [y, m] = k.split('-');
      const mIdx = (parseInt(m || '1', 10) - 1 + 12) % 12;
      return `${monthNames[mIdx]} ${y || '2024'}`;
    };
    const dateRangeLabel = `${fmtMonth(firstKey)} – ${fmtMonth(lastKey)}`;
    return {
      billingMonthsCount: monthlySpend.length,
      startDate: start,
      endDate: end,
      firstTransactionDate: start,
      lastTransactionDate: end,
      dateRangeLabel,
      coverageDescription: `${monthlySpend.length} Billing Months (${dateRangeLabel})`
    };
  }

  public static verifyFinancialInvariants(
    totalInr: number,
    supps: VgtSupplierSpendItem[],
    mgs: VgtMaterialGroupSpendItem[],
    plants: VgtPlantSpendItem[],
    months: VgtMonthlySpendItem[]
  ): number {
    const sumSupp = supps.reduce((s, x) => s + (x.spendInr ?? (x.spend_inr_cr * 10000000)), 0);
    const sumMgs = mgs.reduce((s, x) => s + (x.spendInr ?? (x.spend_inr_cr * 10000000)), 0);
    const sumPlants = plants.reduce((s, x) => s + (x.spendInr ?? (x.spend_inr_cr * 10000000)), 0);
    const sumMonths = months.reduce((s, x) => s + (x.spendInr ?? (x.spend_inr_cr * 10000000)), 0);

    const varSupp = Math.abs(sumSupp - totalInr);
    const varMgs = Math.abs(sumMgs - totalInr);
    const varPlants = Math.abs(sumPlants - totalInr);
    const varMonths = Math.abs(sumMonths - totalInr);

    if (supps.length > 0 && (varSupp > 1.0 || varMgs > 1.0 || varPlants > 1.0 || varMonths > 1.0)) {
      return Number(Math.max(varSupp, varMgs, varPlants, varMonths).toFixed(2));
    }
    return 0;
  }

  public static buildParetoHierarchy(result: VgtProcessingResult, totalInr: number): VgtParetoHierarchy {
    return Module1ParetoHierarchyBuilder.build(result, totalInr);
  }
}
