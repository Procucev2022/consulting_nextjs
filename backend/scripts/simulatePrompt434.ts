import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { OFFICIAL_UNSPSC_TAXONOMY_RULES } from '../src/constants/module2MaterialMappingTaxonomy';
import type { StrategicInputTransaction } from '../src/types/strategicSourcing';
import type { MaterialMappingEntry, ClassificationCoverageSummary, MappingReviewStatus } from '../src/types/module2MaterialMapping';
import { determineCategoryClassification } from '../src/services/module2VendorConsolidationCategoryHelper';

function getMaterialIdentifier(t: StrategicInputTransaction): string {
  const code = (t.material_code ?? '').trim();
  if (code) return code;
  const desc = ((t as any).material_desc ?? (t as any).item_description ?? '').trim();
  if (desc) return `UNCODED_${desc}`;
  return `TX_${t.id}`;
}

async function simulate() {
  for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
    console.log(`\n=================== SIMULATION: ${assessmentId} ===================`);
    const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const txs = canonical.transactions;

    // 1. Aggregate materials
    const aggMap = new Map<string, any>();
    for (const t of txs) {
      const matId = getMaterialIdentifier(t);
      const desc = ((t as any).material_desc ?? (t as any).item_description ?? matId).trim();
      const cat = (t.spend_category ?? 'General').trim();
      const supp = (t.vendor_code ?? t.vendor_name ?? '').trim();

      let agg = aggMap.get(matId);
      if (!agg) {
        agg = {
          sourceMaterialId: matId,
          sourceDescription: desc,
          sourceCategory: cat,
          totalSpendInr: 0,
          transactionCount: 0,
          suppliers: new Set(),
          rawUnspscCode: t.unspsc_code?.trim(),
          rawCommodity: (t.unspsc_commodity ?? t.unspsc_category)?.trim()
        };
        aggMap.set(matId, agg);
      }
      agg.totalSpendInr += t.total_spend_inr ?? 0;
      agg.transactionCount += 1;
      if (supp) agg.suppliers.add(supp);
    }

    // 2. Classify materials
    const register: MaterialMappingEntry[] = [];
    const mappingMap = new Map<string, MaterialMappingEntry>();

    for (const [matId, agg] of aggMap.entries()) {
      const totalSpendCr = Math.round((agg.totalSpendInr / 10000000) * 10000) / 10000;
      let matchedRule = null;
      for (const r of OFFICIAL_UNSPSC_TAXONOMY_RULES) {
        if (r.pattern.test(agg.sourceDescription)) {
          matchedRule = r;
          break;
        }
      }

      let entry: MaterialMappingEntry;
      if (matchedRule) {
        const isVer = matchedRule.confidenceScore >= 95;
        const status: MappingReviewStatus = isVer ? 'TAXONOMY_VERIFIED' : 'PROVISIONAL';
        entry = {
          sourceMaterialId: matId,
          sourceDescription: agg.sourceDescription,
          sourceCategory: agg.sourceCategory,
          taxonomyVersion: 'UNv260801',
          mappingDate: '2026-10-19',
          totalSpendInr: Math.round(agg.totalSpendInr * 100) / 100,
          totalSpendCr,
          transactionCount: agg.transactionCount,
          qualifyingSuppliersCount: agg.suppliers.size,
          assignedUnspscCode: matchedRule.unspscCode,
          assignedUnspscTitle: matchedRule.unspscTitle,
          unspscSegment: matchedRule.segmentTitle,
          unspscFamily: matchedRule.familyTitle,
          unspscClass: matchedRule.classTitle,
          unspscCommodity: matchedRule.commodityTitle,
          mappingMethod: 'MATERIAL_DESCRIPTION_MATCH',
          confidenceScore: matchedRule.confidenceScore,
          evidence: matchedRule.evidence,
          reviewStatus: status
        };
      } else {
        entry = {
          sourceMaterialId: matId,
          sourceDescription: agg.sourceDescription,
          sourceCategory: agg.sourceCategory,
          taxonomyVersion: 'UNv260801',
          mappingDate: '2026-10-19',
          totalSpendInr: Math.round(agg.totalSpendInr * 100) / 100,
          totalSpendCr,
          transactionCount: agg.transactionCount,
          qualifyingSuppliersCount: agg.suppliers.size,
          assignedUnspscCode: '00000000',
          assignedUnspscTitle: 'Unclassified Material — Engineering Review Queued',
          unspscSegment: 'Unclassified Segment',
          unspscFamily: 'Unclassified Family',
          unspscClass: 'Unclassified Class',
          unspscCommodity: 'Unclassified Commodity',
          mappingMethod: 'MANUAL_REVIEW_REQUIRED',
          confidenceScore: 0,
          evidence: 'Description lacks specific technical taxonomy keywords; queued for review',
          reviewStatus: 'AWAITING_REVIEW',
          reviewReason: 'Ambiguous or client-proprietary material description requiring engineering classification.'
        };
      }
      register.push(entry);
      mappingMap.set(matId, entry);
    }

    // 3. Waterfall
    const totalMaterials = register.length;
    const totalSpendInr = Math.round(register.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;
    const ver = register.filter(m => m.reviewStatus === 'TAXONOMY_VERIFIED');
    const prov = register.filter(m => m.reviewStatus === 'PROVISIONAL');
    const rev = register.filter(m => m.reviewStatus === 'AWAITING_REVIEW');

    const verSpend = Math.round(ver.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;
    const provSpend = Math.round(prov.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;
    const revSpend = Math.round(rev.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;

    console.log(`Unique Material/Item Population: ${totalMaterials}`);
    console.log(`Total Spend: ₹${(totalSpendInr / 1e7).toFixed(4)} Cr`);
    console.log(`  Taxonomy-Verified: ${ver.length} (${(ver.length / totalMaterials * 100).toFixed(1)}%) | ₹${(verSpend / 1e7).toFixed(4)} Cr (${(verSpend / totalSpendInr * 100).toFixed(1)}%)`);
    console.log(`  Provisional:       ${prov.length} (${(prov.length / totalMaterials * 100).toFixed(1)}%) | ₹${(provSpend / 1e7).toFixed(4)} Cr (${(provSpend / totalSpendInr * 100).toFixed(1)}%)`);
    console.log(`  Awaiting Review:   ${rev.length} (${(rev.length / totalMaterials * 100).toFixed(1)}%) | ₹${(revSpend / 1e7).toFixed(4)} Cr (${(revSpend / totalSpendInr * 100).toFixed(1)}%)`);
    console.log(`  Sum Check: ${ver.length + prov.length + rev.length} === ${totalMaterials}? ${ver.length + prov.length + rev.length === totalMaterials}`);
    console.log(`  Spend Sum Check: ₹${((verSpend + provSpend + revSpend) / 1e7).toFixed(4)} Cr === ₹${(totalSpendInr / 1e7).toFixed(4)} Cr? ${Math.abs((verSpend + provSpend + revSpend) - totalSpendInr) < 1}`);

    // 4. Group by category
    const catMap = new Map<string, { txs: StrategicInputTransaction[]; code: string; title: string }>();
    for (const t of txs) {
      const matId = getMaterialIdentifier(t);
      const mapping = mappingMap.get(matId);
      const isMapped = mapping && mapping.reviewStatus !== 'AWAITING_REVIEW';
      const code = isMapped ? mapping.assignedUnspscCode : '00000000';
      const title = isMapped ? mapping.assignedUnspscTitle : 'Unclassified Materials (Review Queued)';
      const key = `${title} [${code}]`;
      let g = catMap.get(key);
      if (!g) {
        g = { txs: [], code, title };
        catMap.set(key, g);
      }
      g.txs.push(t);
    }

    console.log(`\nCategories Count: ${catMap.size}`);
    let catSpendSum = 0;
    let catMatSum = 0;
    const catRows: any[] = [];

    for (const [key, g] of catMap.entries()) {
      const catTxs = g.txs;
      const catSpend = Math.round(catTxs.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0) * 100) / 100;
      catSpendSum += catSpend;

      const catMatIds = new Set(catTxs.map(t => getMaterialIdentifier(t)));
      catMatSum += catMatIds.size;

      let cVer = 0, cVerSpd = 0;
      let cProv = 0, cProvSpd = 0;
      let cRev = 0, cRevSpd = 0;

      for (const mId of catMatIds) {
        const m = mappingMap.get(mId);
        if (!m || m.reviewStatus === 'AWAITING_REVIEW') {
          cRev++;
          cRevSpd += m ? m.totalSpendInr : 0;
        } else if (m.reviewStatus === 'TAXONOMY_VERIFIED') {
          cVer++;
          cVerSpd += m.totalSpendInr;
        } else {
          cProv++;
          cProvSpd += m.totalSpendInr;
        }
      }

      const { classificationType } = determineCategoryClassification(g.title, catTxs, g.code, mappingMap);
      catRows.push({
        code: g.code,
        title: g.title,
        type: classificationType,
        totalMats: catMatIds.size,
        verCount: cVer,
        provCount: cProv,
        revCount: cRev,
        verCr: (cVerSpd / 1e7).toFixed(4),
        provCr: (cProvSpd / 1e7).toFixed(4),
        revCr: (cRevSpd / 1e7).toFixed(4),
        totalCr: (catSpend / 1e7).toFixed(4)
      });
    }

    catRows.sort((a, b) => parseFloat(b.totalCr) - parseFloat(a.totalCr));
    console.log(`--------------------------------------------------------------------------------------------------------------------`);
    console.log(`Code     | Type            | Mats (Ver/Prov/Rev) | Ver Spend   | Prov Spend  | Rev Spend   | Total Spend | Title`);
    console.log(`--------------------------------------------------------------------------------------------------------------------`);
    catRows.forEach(r => {
      console.log(
        `${r.code.padEnd(8)} | ${r.type.padEnd(15)} | ${String(r.totalMats).padStart(5)} (${String(r.verCount).padStart(3)}/${String(r.provCount).padStart(4)}/${String(r.revCount).padStart(4)}) | ₹${String(r.verCr).padStart(8)} Cr | ₹${String(r.provCr).padStart(8)} Cr | ₹${String(r.revCr).padStart(8)} Cr | ₹${String(r.totalCr).padStart(8)} Cr | ${r.title}`
      );
    });

    console.log(`--------------------------------------------------------------------------------------------------------------------`);
    console.log(`Total Category Spend Sum: ₹${(catSpendSum / 1e7).toFixed(4)} Cr (Diff from source: ₹${((catSpendSum - totalSpendInr) / 1e7).toFixed(6)} Cr)`);
    console.log(`Total Category Materials Sum: ${catMatSum} (Diff from population: ${catMatSum - totalMaterials})`);
  }
}

simulate().catch(console.error);
