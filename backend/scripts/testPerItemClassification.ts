import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { OFFICIAL_UNSPSC_TAXONOMY_RULES } from '../src/constants/module2MaterialMappingTaxonomy';

async function testPerItemClassification() {
  const c = await Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
  const txs = c.transactions;

  // Let's create an item identifier for each transaction:
  // If t.material_code is present, use t.material_code.trim()
  // If not, use 'UNCODED_' + sanitize(description)
  const itemMap = new Map<string, { desc: string; count: number; spend: number; isUncoded: boolean }>();

  for (const t of txs) {
    const rawCode = (t.material_code ?? '').trim();
    const rawDesc = ((t as any).material_desc ?? (t as any).item_description ?? '').trim();
    const itemId = rawCode || `UNCODED_${rawDesc.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40)}`;

    let item = itemMap.get(itemId);
    if (!item) {
      item = { desc: rawDesc || rawCode, count: 0, spend: 0, isUncoded: !rawCode };
      itemMap.set(itemId, item);
    }
    item.count++;
    item.spend += (t.total_spend_inr ?? 0);
  }

  console.log('Total distinct items:', itemMap.size);
  const uncoded = Array.from(itemMap.values()).filter(i => i.isUncoded);
  console.log('Uncoded items count:', uncoded.length);
  const uncodedSpend = uncoded.reduce((s, i) => s + i.spend, 0);
  console.log('Uncoded spend Cr:', (uncodedSpend / 1e7).toFixed(4));

  // Test rule matching on uncoded items
  let matchedCount = 0;
  let matchedSpend = 0;
  const matchDetails = new Map<string, { count: number; spend: number; rule: string }>();

  for (const u of uncoded) {
    let matchedRule = null;
    for (const r of OFFICIAL_UNSPSC_TAXONOMY_RULES) {
      if (r.pattern.test(u.desc)) {
        matchedRule = r;
        break;
      }
    }
    if (matchedRule) {
      matchedCount++;
      matchedSpend += u.spend;
      const k = `${matchedRule.unspscCode} - ${matchedRule.unspscTitle}`;
      let d = matchDetails.get(k);
      if (!d) {
        d = { count: 0, spend: 0, rule: k };
        matchDetails.set(k, d);
      }
      d.count++;
      d.spend += u.spend;
    }
  }

  console.log(`Uncoded items matching rules: ${matchedCount} / ${uncoded.length} (Spend: ₹${(matchedSpend / 1e7).toFixed(4)} Cr)`);
  console.log(`Uncoded items awaiting review: ${uncoded.length - matchedCount} (Spend: ₹${((uncodedSpend - matchedSpend) / 1e7).toFixed(4)} Cr)`);
  console.log('Rule matches on uncoded items:');
  for (const [k, d] of matchDetails.entries()) {
    console.log(`  ${k}: ${d.count} items, ₹${(d.spend / 1e7).toFixed(4)} Cr`);
  }
}

testPerItemClassification().catch(console.error);
