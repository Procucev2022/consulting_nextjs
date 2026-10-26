import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { Module2MaterialMappingRegister } from '../src/services/module2MaterialMappingRegister';

async function main() {
  for (const id of ['AIC-2026-0002', 'AIC-2026-0003']) {
    const canonical = await Module2CanonicalService.getCanonicalInput(id);
    const txs = canonical?.transactions || [];
    const { coverage } = Module2MaterialMappingRegister.classifyMaterials(txs);
    console.log(`=== ${id} (${txs.length} txs) ===`);
    console.log(`Total Spend: ₹${coverage.totalSpendCr} Cr across ${coverage.totalMaterialsCount} materials`);
    console.log(`Approved: ${coverage.approvedCount} (${coverage.approvedMaterialPct}%) | ₹${coverage.approvedSpendCr} Cr (${coverage.approvedSpendPct}%)`);
    console.log(`Provisional: ${coverage.provisionalCount} (${coverage.provisionalMaterialPct}%) | ₹${coverage.provisionalSpendCr} Cr (${coverage.provisionalSpendPct}%)`);
    console.log(`Awaiting Review: ${coverage.awaitingReviewCount} (${coverage.awaitingReviewMaterialPct}%) | ₹${coverage.awaitingReviewSpendCr} Cr (${coverage.awaitingReviewSpendPct}%)`);
  }
}

main().catch(console.error);
