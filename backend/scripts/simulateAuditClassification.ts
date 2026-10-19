import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { Module2MaterialMappingRegister } from '../src/services/module2MaterialMappingRegister';

async function test(): Promise<void> {
  const cT = await Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
  const cC = await Module2CanonicalService.getCanonicalInput('AIC-2026-0003');

  const resT = Module2MaterialMappingRegister.classifyMaterials(cT?.transactions ?? []);
  const resC = Module2MaterialMappingRegister.classifyMaterials(cC?.transactions ?? []);

  console.log('Textile Coverage:', JSON.stringify(resT.coverage, null, 2));
  console.log('Cement Coverage:', JSON.stringify(resC.coverage, null, 2));
}

test().catch(console.error);
