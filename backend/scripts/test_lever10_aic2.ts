import { Module2AlternateSourcingEngine } from '../src/services/module2AlternateSourcingEngine';

const res = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0002');
console.log('--- ALL OPPORTUNITIES ---');
for (const o of res.opportunities) {
  console.log({
    id: o.opportunityId,
    code: o.materialCode,
    desc: o.materialDescription,
    matchedCat: o.matchedVendorCategory,
    matchType: o.matchType,
    allLoc: o.potentialVendorsAllLocations,
    prefRegion: o.potentialVendorsPreferredRegion
  });
}
