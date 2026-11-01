import * as path from 'path';
import { AssessmentDatasetParser } from '../src/services/assessmentDatasetParser';
import { Module2BundleBuilder } from '../src/services/module2BundleBuilder';
import { Module2StrategicSourcingEngine } from '../src/services/module2StrategicSourcingEngine';

async function main(): Promise<void> {
  const rootDir = path.resolve(__dirname, '../..');
  const poFilePath = path.resolve(
    rootDir,
    'data/dev/assessments/AIC-2026-0002/uploads/Borosil_PO_Consol_Excluding_BSL_Pune.xlsx'
  );

  console.log('--- PARSING Borosil PO Dataset ---');
  const parsed = AssessmentDatasetParser.parseDataset(poFilePath, {
    assessmentId: 'AIC-2026-0002',
    dataVersionId: 'DV-AIC-2026-0002-V1',
    fileName: 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx',
    isTestData: false
  });

  console.log('Parsed Module 1 Metrics:');
  console.log(' - totalConvertedInrSpend:', parsed.module1.totalConvertedInrSpend);
  console.log(' - totalConvertedInrSpendCr:', parsed.module1.totalConvertedInrSpendCr);
  console.log(' - sourceRowCount:', parsed.data.sourceRowCount);
  console.log(' - validRowCount:', parsed.data.validRowCount);
  console.log(' - excludedRowCount:', parsed.data.excludedRowCount);

  // Let's compute exact sum of parsed.validRows spend
  let sumValidSpend = 0;
  let sumNormSpend = 0;
  for (let i = 0; i < parsed.validRows.length; i++) {
    const r = parsed.validRows[i];
    const n = parsed.validNormalizedTransactions[i];
    sumValidSpend += Number(r.lineSpendInr ?? 0);
    sumNormSpend += Number(n?.inrNormalizedValue ?? r.lineSpendInr ?? 0);
  }
  console.log(' - sum of validRows.lineSpendInr:', sumValidSpend);
  console.log(' - sum of validNormalizedTransactions.inrNormalizedValue:', sumNormSpend);

  const bundle = Module2BundleBuilder.bundleFromParsed(parsed);
  console.log('\nBundle Canonical Input:');
  console.log(' - validRowCount:', bundle.canonicalInput.validRowCount);
  console.log(' - totalValidatedSpendInr:', bundle.canonicalInput.totalValidatedSpendInr);
  console.log(' - totalValidatedSpendCr:', bundle.canonicalInput.totalValidatedSpendCr);

  console.log('\nBundle Sourcing Result Summary:');
  console.log(' - totalSpendAnalyzedInr:', bundle.sourcingResult.summary.totalSpendAnalyzedInr);
  console.log(' - totalSpendAnalyzedInrCr:', bundle.sourcingResult.summary.totalSpendAnalyzedInrCr);
  console.log(' - addressableSpendInr:', (bundle.sourcingResult.summary as any).addressableSpendInr);
  console.log(' - addressableSpendInrCr:', (bundle.sourcingResult.summary as any).addressableSpendInrCr);

  console.log('\nBundle Bridge:');
  console.log(bundle.bridge);

  console.log('\nProfiles Count:', bundle.sourcingResult.profiles.length);
  // Calculate addressable spend across all profiles (133 categories)
  let totalProfileSpend = 0;
  let totalAddressableProfileSpend = 0;
  let totalGrossOpp = 0;
  let totalNetOpp = 0;
  let quantProfileCount = 0;
  let quantProfileSpend = 0;

  for (const prof of bundle.sourcingResult.profiles) {
    totalProfileSpend += prof.totalSpendInr;
    if (prof.isAddressable !== false) {
      totalAddressableProfileSpend += prof.totalSpendInr;
    }
    totalGrossOpp += prof.grossOpportunityInr;
    totalNetOpp += prof.netOpportunityInr;
    if (prof.isQuantifiable) {
      quantProfileCount++;
      quantProfileSpend += prof.totalSpendInr;
    }
  }

  console.log('\nProfiles Aggregation:');
  console.log(' - totalProfileSpend:', totalProfileSpend);
  console.log(' - totalAddressableProfileSpend (133 cats):', totalAddressableProfileSpend);
  console.log(' - totalGrossOpp:', totalGrossOpp);
  console.log(' - totalNetOpp:', totalNetOpp);
  console.log(' - quantProfileCount:', quantProfileCount);
  console.log(' - quantProfileSpend (106 packages):', quantProfileSpend);
  console.log(' - difference (non-quantifiable):', totalAddressableProfileSpend - quantProfileSpend);

  // Check 106 packages ledger
  console.log('\nLedger Packages Count:', bundle.ledger.length);
  let ledgerSpend = 0;
  let ledgerGross = 0;
  let ledgerOverlap = 0;
  let ledgerNet = 0;
  for (const item of bundle.ledger) {
    ledgerSpend += item.eligibleSpendInr ?? 0;
    ledgerGross += item.grossOpportunityInr ?? 0;
    ledgerOverlap += item.overlapDeductionInr ?? 0;
    ledgerNet += item.netDefensibleOpportunityInr ?? 0;
  }
  console.log('Ledger Aggregation:');
  console.log(' - ledgerSpend:', ledgerSpend);
  console.log(' - ledgerGross:', ledgerGross);
  console.log(' - ledgerOverlap:', ledgerOverlap);
  console.log(' - ledgerNet:', ledgerNet);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
