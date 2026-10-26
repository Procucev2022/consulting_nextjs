import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { Module2MaterialMappingRegister } from '../src/services/module2MaterialMappingRegister';

async function check() {
  for (const id of ['AIC-2026-0002', 'AIC-2026-0003']) {
    const c = await Module2CanonicalService.getCanonicalInput(id);
    const txs = c.transactions;
    const nonEmptyMats = new Set(txs.map(t => (t.material_code ?? '').trim()).filter(Boolean));
    const allMatsWithEmpty = new Set(txs.map(t => (t.material_code ?? '').trim()));
    console.log(id, 'Total txs:', txs.length, 'Non-empty material codes:', nonEmptyMats.size, 'With empty:', allMatsWithEmpty.size);
    
    const { register, coverage } = Module2MaterialMappingRegister.classifyMaterials(txs);
    console.log(id, 'Register items:', register.length, 'Coverage totalMaterialsCount:', coverage.totalMaterialsCount);
  }
}
check().catch(console.error);
