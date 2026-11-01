import type {
  PCBIBenchmarkComponent,
  PCBIClientPurchaseTransaction,
  PCBIComponentCalculation
} from '../types/pcbi';

export function calculateCompositeCost(
  benchmarkId: string,
  components: Map<string, PCBIBenchmarkComponent[]>,
  getIndexForDateFn: (
    pcbiId: string,
    dateStr: string,
    compId?: string
  ) => { indexValue: number } | null,
  tx: PCBIClientPurchaseTransaction,
  P0: number,
  baseDate: string,
  residualPct: number
): { price: number; breakdowns: PCBIComponentCalculation[]; isUnavailable?: boolean } {
  const comps = components.get(benchmarkId) || [];
  if (comps.length === 0) {
    return { price: 0, breakdowns: [], isUnavailable: true };
  }
  let currentCompCostsSum = 0;
  const breakdowns: PCBIComponentCalculation[] = [];

  for (const comp of comps) {
    const weight = comp.weight_percent / 100;
    const baseCompCost = P0 * weight;
    const baseCompIdxInfo = getIndexForDateFn(benchmarkId, baseDate, comp.id);
    const currCompIdxInfo = getIndexForDateFn(benchmarkId, tx.po_date, comp.id);

    if (
      !baseCompIdxInfo ||
      !currCompIdxInfo ||
      baseCompIdxInfo.indexValue <= 0 ||
      currCompIdxInfo.indexValue <= 0
    ) {
      // Missing or unverified observation returns explicit unavailable
      return { price: 0, breakdowns: [], isUnavailable: true };
    }

    const baseCompIdx = baseCompIdxInfo.indexValue;
    const currCompIdx = currCompIdxInfo.indexValue;
    const movementRatio = currCompIdx / baseCompIdx;
    const currentCompCost = baseCompCost * movementRatio;
    currentCompCostsSum += currentCompCost;

    breakdowns.push({
      transaction_id: tx.id,
      component_id: comp.id,
      component_name: comp.component_name,
      base_component_cost: Number(baseCompCost.toFixed(2)),
      base_index: baseCompIdx,
      current_index: currCompIdx,
      index_movement_ratio: Number(movementRatio.toFixed(4)),
      current_component_cost: Number(currentCompCost.toFixed(2)),
      weight_percent: comp.weight_percent
    });
  }

  const residualCost = P0 * (residualPct / 100);
  return { price: Number((currentCompCostsSum + residualCost).toFixed(2)), breakdowns, isUnavailable: false };
}
