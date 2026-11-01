import { Module2CanonicalService } from '../src/services/module2CanonicalService';

async function main() {
  const sourcing = Module2CanonicalService.getSourcingAnalysis('AIC-2026-0002');
  const p = sourcing.profiles.find(x => x.categoryId === 'CAT-11300');
  console.log('CAT-11300 details:', {
    volBundling: p?.volumeBundlingOpportunityInr,
    specialist: p?.categorySpecialistOpportunityInr,
    gross: p?.grossQuantifiableBenefitInr,
    net: p?.netQuantifiableOpportunityInr,
    eauction: p?.potentialEAuctionOpportunityInr,
    consol: p?.potentialVendorConsolidationOpportunityInr,
    overlap: p?.overlappingOpportunityInr
  });
}

main().catch(console.error);
