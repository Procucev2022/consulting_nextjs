import { VgtModule1Runner } from './vgtModule1Runner';
import { Module2StrategicSourcingEngine } from './module2StrategicSourcingEngine';
import { Module2CanonicalCalculators } from './module2CanonicalCalculators';
import type {
  StrategicInputTransaction,
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  Module2ToModule4HandoffPackage,
  Module2CanonicalInput,
  Module2OpportunityLedgerItem,
  Module2MathematicalBridge,
  Module2Top50VendorItem,
  Module2SupplierRiskItem,
  Module2PoConsolidationItem,
  Module2RecurringSpendItem,
  Module2ForensicSummary
} from '../types';

export class Module2CanonicalService {
  private static cachedCanonicalInput: Module2CanonicalInput | null = null;
  private static cachedTransactions: StrategicInputTransaction[] = [];
  private static cachedSourcingResult: {
    summary: Module2StrategicSourcingDashboardSummary;
    profiles: CategoryStrategicSourcingProfile[];
    handoffPackages: Module2ToModule4HandoffPackage[];
  } | null = null;
  private static cachedLedger: Module2OpportunityLedgerItem[] = [];
  private static cachedBridge: Module2MathematicalBridge | null = null;
  private static cachedTop50: Module2Top50VendorItem[] = [];
  private static cachedRisk: Module2SupplierRiskItem[] = [];
  private static cachedPo: Module2PoConsolidationItem[] = [];
  private static cachedRecurring: Module2RecurringSpendItem[] = [];

  public static clearCache(): void {
    this.cachedCanonicalInput = null;
    this.cachedTransactions = [];
    this.cachedSourcingResult = null;
    this.cachedLedger = [];
    this.cachedBridge = null;
    this.cachedTop50 = [];
    this.cachedRisk = [];
    this.cachedPo = [];
    this.cachedRecurring = [];
  }

  public static getCanonicalInput(customPath?: string): Module2CanonicalInput {
    if (!customPath && this.cachedCanonicalInput) {
      return this.cachedCanonicalInput;
    }

    const vgtResult = VgtModule1Runner.processVgtDataset(customPath);
    const validRows = vgtResult.validRows ?? [];
    const validNormalized = vgtResult.validNormalizedTransactions ?? [];

    const suppliersSet = new Set<string>();
    const materialGroupsSet = new Set<string>();
    const plantsSet = new Set<string>();
    const billingMonthsSet = new Set<string>();

    const transactions: StrategicInputTransaction[] = validRows.map((r, i) => {
      const norm = validNormalized[i];
      const spendInr = norm ? norm.inrNormalizedValue : r.lineSpendInr;

      suppliersSet.add(r.vendorName);
      materialGroupsSet.add(r.materialGroup);
      plantsSet.add(r.plant);
      if (r.billingMonth) billingMonthsSet.add(r.billingMonth);

      return {
        id: r.recordId,
        po_number: r.poNumber,
        po_date: r.transactionDate,
        vendor_code: r.vendorCode,
        vendor_name: r.vendorName,
        material_code: r.itemCode,
        material_desc: r.itemDescription,
        quantity: r.quantity,
        uom: r.uom,
        unit_price: r.netPrice,
        total_spend_inr: spendInr ?? 0,
        currency: r.currency,
        plant: r.plant,
        spend_category: r.materialGroup,
        unspsc_code: r.itemCode
      };
    });

    const canonicalInput: Module2CanonicalInput = {
      datasetId: vgtResult.file.sha256.slice(0, 16),
      dataVersionId: vgtResult.dataVersion.dataVersionId,
      sourceFileName: vgtResult.file.filename,
      sourceRowCount: vgtResult.data.sourceRowCount,
      validRowCount: vgtResult.data.validRowCount,
      excludedRowCount: vgtResult.data.excludedRowCount,
      anomalyRowCount: vgtResult.data.anomalyRowCount,
      totalValidatedSpendInr: vgtResult.module1.totalConvertedInrSpend,
      totalValidatedSpendCr: vgtResult.module1.totalConvertedInrSpendCr,
      suppliersCount: suppliersSet.size,
      materialGroupsCount: materialGroupsSet.size,
      plantsCount: plantsSet.size,
      billingMonthsCount: billingMonthsSet.size,
      period: {
        startDate: '2021-04-01',
        endDate: '2022-01-31',
        actualBillingMonths: billingMonthsSet.size,
        fiscalYear: 'FY22',
        fiscalMonthCoverage: '10 of 12 months',
        isFullFiscalYear: false,
        missingMonthsNotice: 'Missing 2 billing months (Feb 2022, Mar 2022) - not assumed as zero'
      },
      currencyCoverage: {
        currenciesDetected: vgtResult.currency.currenciesDetected,
        normalizedSpendInr: vgtResult.module1.totalConvertedInrSpend
      },
      fxNormalization: {
        masterVersion: 'FX_MASTER_V2.0',
        checksum: vgtResult.file.sha256.slice(0, 16)
      },
      transactions
    };

    this.cachedCanonicalInput = canonicalInput;
    this.cachedTransactions = transactions;
    return canonicalInput;
  }

  public static getCanonicalTransactions(customPath?: string): StrategicInputTransaction[] {
    if (this.cachedTransactions.length > 0 && !customPath) {
      return this.cachedTransactions;
    }
    const input = this.getCanonicalInput(customPath);
    return input.transactions;
  }

  public static getSourcingAnalysis(forceRefresh = false): {
    summary: Module2StrategicSourcingDashboardSummary;
    profiles: CategoryStrategicSourcingProfile[];
    handoffPackages: Module2ToModule4HandoffPackage[];
  } {
    if (!forceRefresh && this.cachedSourcingResult) {
      return this.cachedSourcingResult;
    }

    const txs = this.getCanonicalTransactions();
    const result = Module2StrategicSourcingEngine.analyze(txs);

    this.cachedSourcingResult = result;
    return result;
  }

  public static getOpportunityLedger(forceRefresh = false): Module2OpportunityLedgerItem[] {
    if (!forceRefresh && this.cachedLedger.length > 0) {
      return this.cachedLedger;
    }

    const { profiles } = this.getSourcingAnalysis(forceRefresh);
    const txs = this.getCanonicalTransactions();
    const ledger = Module2CanonicalCalculators.buildOpportunityLedger(profiles, txs);

    this.cachedLedger = ledger;
    return ledger;
  }

  public static getMathematicalBridge(forceRefresh = false): Module2MathematicalBridge {
    if (!forceRefresh && this.cachedBridge) {
      return this.cachedBridge;
    }

    const { summary } = this.getSourcingAnalysis(forceRefresh);
    const input = this.getCanonicalInput();
    const bridge = Module2CanonicalCalculators.buildBridge(input, summary);

    this.cachedBridge = bridge;
    return bridge;
  }

  public static getTop50Vendors(): Module2Top50VendorItem[] {
    if (this.cachedTop50.length > 0) {
      return this.cachedTop50;
    }
    const txs = this.getCanonicalTransactions();
    this.cachedTop50 = Module2CanonicalCalculators.buildTop50Vendors(txs);
    return this.cachedTop50;
  }

  public static getSupplierRiskAnalysis(): Module2SupplierRiskItem[] {
    if (this.cachedRisk.length > 0) {
      return this.cachedRisk;
    }
    const { profiles } = this.getSourcingAnalysis();
    this.cachedRisk = Module2CanonicalCalculators.buildSupplierRisk(profiles);
    return this.cachedRisk;
  }

  public static getPoConsolidationAnalysis(): Module2PoConsolidationItem[] {
    if (this.cachedPo.length > 0) {
      return this.cachedPo;
    }
    const txs = this.getCanonicalTransactions();
    this.cachedPo = Module2CanonicalCalculators.buildPoConsolidation(txs);
    return this.cachedPo;
  }

  public static getRecurringSpendAnalysis(): Module2RecurringSpendItem[] {
    if (this.cachedRecurring.length > 0) {
      return this.cachedRecurring;
    }
    const { profiles } = this.getSourcingAnalysis();
    this.cachedRecurring = Module2CanonicalCalculators.buildRecurringSpend(profiles);
    return this.cachedRecurring;
  }

  public static getForensicSummary(): Module2ForensicSummary {
    return {
      canonicalInput: this.getCanonicalInput(),
      bridge: this.getMathematicalBridge(),
      ledger: this.getOpportunityLedger(),
      dashboardSummary: this.getSourcingAnalysis().summary,
      profiles: this.getSourcingAnalysis().profiles,
      top50Vendors: this.getTop50Vendors(),
      supplierRisk: this.getSupplierRiskAnalysis(),
      poConsolidation: this.getPoConsolidationAnalysis(),
      recurringSpend: this.getRecurringSpendAnalysis()
    };
  }
}
