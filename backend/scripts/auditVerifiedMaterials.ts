import { Module2VendorConsolidationEngine } from '../src/services/module2VendorConsolidationEngine';
import type { MaterialMappingEntry } from '../src/types/module2MaterialMapping';

async function main(): Promise<void> {
  const resTextile = await Module2VendorConsolidationEngine.calculate('AIC-2026-0002');
  const resCement = await Module2VendorConsolidationEngine.calculate('AIC-2026-0003');

  const textileVerified = (resTextile.mappingRegister ?? [])
    .filter((m: MaterialMappingEntry) => m.reviewStatus === 'TAXONOMY_VERIFIED' || m.reviewStatus === 'APPROVED' || m.reviewStatus === 'CLIENT_APPROVED')
    .sort((a: MaterialMappingEntry, b: MaterialMappingEntry) => b.totalSpendInr - a.totalSpendInr);

  const cementVerified = (resCement.mappingRegister ?? [])
    .filter((m: MaterialMappingEntry) => m.reviewStatus === 'TAXONOMY_VERIFIED' || m.reviewStatus === 'APPROVED' || m.reviewStatus === 'CLIENT_APPROVED')
    .sort((a: MaterialMappingEntry, b: MaterialMappingEntry) => b.totalSpendInr - a.totalSpendInr);

  console.log('TEXTILE_VERIFIED_COUNT:', textileVerified.length);
  console.log('CEMENT_VERIFIED_COUNT:', cementVerified.length);

  console.log('\n--- TEXTILE TOP 50 VERIFIED MATERIALS ---');
  textileVerified.slice(0, 50).forEach((m: MaterialMappingEntry, idx: number) => {
    console.log(`${idx + 1} | MatID: ${m.sourceMaterialId} | Desc: "${m.sourceDescription}" | UNSPSC: ${m.assignedUnspscCode} (${m.assignedUnspscTitle}) | Spend: ₹${m.totalSpendCr} Cr | Evidence: "${m.evidence}" | Method: ${m.mappingMethod} | Score: ${m.confidenceScore}`);
  });

  console.log('\n--- CEMENT TOP 50 VERIFIED MATERIALS ---');
  cementVerified.slice(0, 50).forEach((m: MaterialMappingEntry, idx: number) => {
    console.log(`${idx + 1} | MatID: ${m.sourceMaterialId} | Desc: "${m.sourceDescription}" | UNSPSC: ${m.assignedUnspscCode} (${m.assignedUnspscTitle}) | Spend: ₹${m.totalSpendCr} Cr | Evidence: "${m.evidence}" | Method: ${m.mappingMethod} | Score: ${m.confidenceScore}`);
  });
}

main().catch(console.error);
