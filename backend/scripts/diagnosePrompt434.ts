import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { Module2MaterialMappingRegister } from '../src/services/module2MaterialMappingRegister';
import { Module2VendorConsolidationEngine } from '../src/services/module2VendorConsolidationEngine';

async function diagnose() {
  console.log('--- DIAGNOSING ABC TEXTILE (AIC-2026-0002) ---');
  const canonical = await Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
  const txs = canonical.transactions;
  console.log('Total txs:', txs.length);

  const { register, coverage, exceptions, materialCodeToMapping } = Module2MaterialMappingRegister.classifyMaterials(txs);
  console.log('Register size (materials classified):', register.length);
  console.log('materialCodeToMapping size:', materialCodeToMapping.size);

  const emptyMatTxs = txs.filter(t => !(t.material_code ?? '').trim());
  console.log('Txs with empty material_code:', emptyMatTxs.length);
  const emptySpend = emptyMatTxs.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0);
  console.log('Empty mat spend INR:', emptySpend, 'Cr:', emptySpend / 1e7);

  // Check what groupTransactionsByUnspsc does
  const result = await Module2VendorConsolidationEngine.calculate('AIC-2026-0002');
  console.log('Categories count:', result.categories.length);
  for (const cat of result.categories) {
    if (cat.unspscCode === '80111600' || cat.totalSpendCr > 200) {
      console.log('Found category:', {
        unspscCode: cat.unspscCode,
        unspscCategory: cat.unspscCategory,
        spendCategory: cat.spendCategory,
        classificationType: cat.classificationType,
        totalSpendCr: cat.totalSpendCr,
        distinctMaterialsCount: cat.distinctMaterialsCount,
        suppliersCount: cat.suppliers.length,
      });
    }
  }

  // Check how empty material code txs are mapped in materialCodeToMapping
  console.log('Mapping for "":', materialCodeToMapping.get(''));

  // What are the transactions that got into 80111600?
  const cat8011 = result.categories.find(c => c.unspscCode === '80111600');
  if (cat8011) {
    console.log('80111600 suppliers sample:', cat8011.suppliers.slice(0, 5));
  }

  // Where does 80111600 come from?
  // Let's check how materials get mapped to 80111600
  const matsWith8011 = register.filter(m => m.assignedUnspscCode === '80111600');
  console.log('Materials mapped to 80111600 in register:', matsWith8011.length);
  matsWith8011.forEach(m => console.log('Mat:', m.sourceMaterialId, m.sourceDescription, m.totalSpendCr));

  // Let's check how transactions get mapped to 80111600 in groupTransactionsByUnspsc:
  const txsMappedTo8011 = txs.filter(t => {
    const matId = (t.material_code ?? '').trim();
    const mapping = materialCodeToMapping.get(matId);
    return mapping?.assignedUnspscCode === '80111600';
  });
  console.log('Transactions where mapping.assignedUnspscCode === 80111600:', txsMappedTo8011.length);
  const txsSpend8011 = txsMappedTo8011.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0);
  console.log('Spend of those transactions INR:', txsSpend8011, 'Cr:', txsSpend8011 / 1e7);

  // Check transactions whose source unspsc_code is 80111600
  const txsSource8011 = txs.filter(t => (t.unspsc_code ?? '').trim() === '80111600');
  console.log('Transactions whose t.unspsc_code === 80111600:', txsSource8011.length);
}

diagnose().catch(console.error);
