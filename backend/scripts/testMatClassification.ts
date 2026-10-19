import { Module2CanonicalService } from '../src/services/module2CanonicalService';

async function test() {
  const c = await Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
  const txs = c.transactions;
  const emptyBoth = txs.filter(t => !(t.material_code ?? '').trim() && !((t as any).material_desc ?? (t as any).item_description ?? '').trim());
  console.log('Empty both code and desc:', emptyBoth.length);

  // Check how many have material_code vs not
  const withCode = txs.filter(t => (t.material_code ?? '').trim());
  const withoutCode = txs.filter(t => !(t.material_code ?? '').trim());
  console.log('With code:', withCode.length, 'Without code:', withoutCode.length);
}
test().catch(console.error);
