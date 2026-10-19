import { Module2CanonicalService } from '../src/services/module2CanonicalService';

async function inspectEmpty() {
  for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
    console.log(`\n=================== ${assessmentId} ===================`);
    const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const txs = canonical.transactions;
    const emptyMatTxs = txs.filter(t => !(t.material_code ?? '').trim());
    console.log(`Total txs: ${txs.length}, Empty mat txs: ${emptyMatTxs.length}`);
    const emptySpend = emptyMatTxs.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0);
    console.log(`Empty mat spend: ₹${(emptySpend / 1e7).toFixed(4)} Cr`);

    // Group empty mat txs by spend_category
    const catMap = new Map<string, { count: number; spend: number; sampleDesc: string; vendors: Set<string> }>();
    for (const t of emptyMatTxs) {
      const cat = (t.spend_category ?? 'Unspecified').trim();
      let c = catMap.get(cat);
      if (!c) {
        c = { count: 0, spend: 0, sampleDesc: (t as any).material_desc ?? (t as any).item_description ?? '', vendors: new Set() };
        catMap.set(cat, c);
      }
      c.count++;
      c.spend += (t.total_spend_inr ?? 0);
      const v = (t.vendor_name ?? t.vendor_code ?? '').trim();
      if (v) c.vendors.add(v);
    }

    console.log('Spend Categories for empty material code transactions:');
    for (const [cat, data] of catMap.entries()) {
      console.log(`  Cat: "${cat}" | Txs: ${data.count} | Spend: ₹${(data.spend / 1e7).toFixed(4)} Cr | Vendors: ${data.vendors.size} | Sample Desc: "${data.sampleDesc}"`);
    }

    // Check unique descriptions among empty material code txs
    const descMap = new Map<string, { count: number; spend: number }>();
    for (const t of emptyMatTxs) {
      const desc = ((t as any).material_desc ?? (t as any).item_description ?? '').trim();
      let d = descMap.get(desc);
      if (!d) {
        d = { count: 0, spend: 0 };
        descMap.set(desc, d);
      }
      d.count++;
      d.spend += (t.total_spend_inr ?? 0);
    }
    console.log(`Total distinct descriptions among empty mat txs: ${descMap.size}`);
    const topDescs = Array.from(descMap.entries()).sort((a, b) => b[1].spend - a[1].spend).slice(0, 10);
    console.log('Top 10 descriptions by spend:');
    for (const [desc, d] of topDescs) {
      console.log(`  "${desc}": Txs: ${d.count}, Spend: ₹${(d.spend / 1e7).toFixed(4)} Cr`);
    }
  }
}

inspectEmpty().catch(console.error);
