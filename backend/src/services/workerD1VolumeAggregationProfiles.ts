import { MODULE2_D1_VOLUME } from '../constants/module2D1Scoped';
import type {
  MaterialVolumeProfile, PlantVolumeBreakdown, VolumeAggregationMaterialGroup, VolumeAggregationOpportunity
} from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

export const cleanVolumeValue = (value?: string): string => value?.trim() || '';
const normalizeVolumeValue = (value?: string): string => cleanVolumeValue(value).toLocaleUpperCase('en-US');
const numberOrZero = (value: number): number => Number.isFinite(value) ? value : 0;

export const roundVolumeSpendInCrores = (amountInr: number): number => Number(
  (amountInr / MODULE2_D1_VOLUME.INR_PER_CRORE).toFixed(MODULE2_D1_VOLUME.AMOUNT_DECIMAL_PLACES)
);

export const activeVolumeMonths = (transactions: StrategicInputTransaction[]): Set<string> => new Set(
  transactions.map((transaction) => cleanVolumeValue(transaction.po_date).slice(0, 7))
    .filter((month) => /^\d{4}-\d{2}$/.test(month))
);

export const groupVolumeTransactions = (
  transactions: StrategicInputTransaction[]
): VolumeAggregationMaterialGroup[] => {
  const groups = new Map<string, VolumeAggregationMaterialGroup>();
  transactions.forEach((transaction, index) => {
    const code = normalizeVolumeValue(transaction.material_code);
    const description = cleanVolumeValue(transaction.material_desc);
    const unit = normalizeVolumeValue(transaction.uom);
    const identity = code ? `CODE:${code}` : `UNMAPPED:${description.toLocaleUpperCase('en-US')}:${index}`;
    const key = `${identity}|UOM:${unit || 'MISSING'}`;
    const current = groups.get(key) || {
      key,
      code,
      description,
      category: cleanVolumeValue(transaction.spend_category) || 'Unclassified',
      unit,
      transactions: []
    };
    current.transactions.push(transaction);
    groups.set(key, current);
  });
  return [...groups.values()];
};

export const volumeSuppliers = (transactions: StrategicInputTransaction[]): string[] => [...new Set(
  transactions.map((transaction) => cleanVolumeValue(transaction.vendor_name)).filter(Boolean)
)].sort();

export const volumePlants = (transactions: StrategicInputTransaction[]): string[] => [...new Set(
  transactions.map((transaction) => cleanVolumeValue(transaction.plant)).filter(Boolean)
)].sort();

export const totalVolumeSpend = (transactions: StrategicInputTransaction[]): number => transactions.reduce(
  (total, transaction) => total + numberOrZero(transaction.total_spend_inr), 0
);

export const totalVolumeQuantity = (transactions: StrategicInputTransaction[]): number => transactions.reduce(
  (total, transaction) => total + numberOrZero(transaction.quantity), 0
);

export const classifyVolumeDemand = (
  transactions: StrategicInputTransaction[]
): VolumeAggregationOpportunity['demandClassification'] => {
  const months = activeVolumeMonths(transactions).size;
  if (months >= MODULE2_D1_VOLUME.RECURRING_MONTH_COUNT) return 'RECURRING';
  if (months === 1) return 'PERIODIC_SEASONAL';
  return 'INSUFFICIENT_HISTORY';
};

export const buildVolumeMaterialProfiles = (
  groups: VolumeAggregationMaterialGroup[]
): MaterialVolumeProfile[] => groups.map((group) => {
  const spend = totalVolumeSpend(group.transactions);
  const quantity = totalVolumeQuantity(group.transactions);
  const plants = volumePlants(group.transactions);
  const suppliers = volumeSuppliers(group.transactions);
  const months = activeVolumeMonths(group.transactions).size;
  const incompatible = !group.unit;
  return {
    materialId: group.code || group.key,
    materialCode: group.code,
    materialDesc: group.description,
    category: group.category,
    unspscCode: group.transactions.find((transaction) => transaction.unspsc_code)?.unspsc_code || '',
    baseUom: group.unit,
    totalQuantity: quantity,
    totalSpendInr: spend,
    totalSpendCr: roundVolumeSpendInCrores(spend),
    wavgPriceInr: quantity > 0 ? spend / quantity : 0,
    demandClassification: classifyVolumeDemand(group.transactions),
    demandClassificationEvidence: months
      ? `Observed transactions in ${months} distinct calendar month(s).`
      : 'Transaction dates are unavailable.',
    sourceTransactionDates: group.transactions
      .map((transaction) => cleanVolumeValue(transaction.po_date)).filter(Boolean),
    orderCount: group.transactions.length,
    plantCount: plants.length,
    supplierCount: suppliers.length,
    plantVolumeDispersionIndex: plants.length > 0 ? Number((1 - 1 / plants.length).toFixed(4)) : 0,
    hasIncompatibleUom: incompatible,
    excludedQuantity: incompatible ? quantity : 0
  };
});

export const buildVolumePlantProfiles = (
  transactions: StrategicInputTransaction[]
): PlantVolumeBreakdown[] => {
  const plants = new Map<string, StrategicInputTransaction[]>();
  transactions.forEach((transaction, index) => {
    const plant = cleanVolumeValue(transaction.plant) || `UNASSIGNED-${index + 1}`;
    plants.set(plant, [...(plants.get(plant) || []), transaction]);
  });
  const total = totalVolumeSpend(transactions);
  return [...plants.entries()].map(([plantCode, rows]) => {
    const spend = totalVolumeSpend(rows);
    return {
      plantCode,
      plantName: plantCode,
      region: '',
      state: '',
      hubDistanceKm: 0,
      totalSpendInr: spend,
      totalSpendCr: roundVolumeSpendInCrores(spend),
      transactionCount: rows.length,
      distinctMaterialsCount: new Set(
        rows.map((row) => cleanVolumeValue(row.material_code) || cleanVolumeValue(row.material_desc)).filter(Boolean)
      ).size,
      supplierCount: volumeSuppliers(rows).length,
      volumeSharePct: total > 0 ? Number((spend / total * 100).toFixed(2)) : 0
    };
  }).sort((left, right) => right.totalSpendInr - left.totalSpendInr);
};
