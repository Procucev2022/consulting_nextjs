import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { Module2MaterialMappingRegister } from '../src/services/module2MaterialMappingRegister';

async function auditVerified() {
  for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
    console.log(`\n=================== VERIFIED AUDIT: ${assessmentId} ===================`);
    const c = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const { register } = Module2MaterialMappingRegister.classifyMaterials(c.transactions);

    const verified = register.filter(m => m.reviewStatus === 'TAXONOMY_VERIFIED' || m.reviewStatus === 'CLIENT_APPROVED' || m.reviewStatus === 'APPROVED');
    console.log(`Total verified items: ${verified.length}`);

    // Group verified items by mappingMethod and assignedUnspscCode
    const codeMap = new Map<string, { title: string; count: number; spend: number; samples: any[] }>();
    for (const v of verified) {
      const k = `${v.assignedUnspscCode} - ${v.assignedUnspscTitle}`;
      let e = codeMap.get(k);
      if (!e) {
        e = { title: v.assignedUnspscTitle, count: 0, spend: 0, samples: [] };
        codeMap.set(k, e);
      }
      e.count++;
      e.spend += v.totalSpendInr;
      if (e.samples.length < 5) {
        e.samples.push({
          id: v.sourceMaterialId,
          desc: v.sourceDescription,
          spendCr: v.totalSpendCr,
          method: v.mappingMethod,
          score: v.confidenceScore,
          evidence: v.evidence
        });
      }
    }

    for (const [k, d] of codeMap.entries()) {
      console.log(`\n--- Code: ${k} (Items: ${d.count}, Spend: ₹${(d.spend / 1e7).toFixed(4)} Cr) ---`);
      d.samples.forEach(s => {
        console.log(`  ID: ${s.id} | Desc: "${s.desc}" | Spend: ₹${s.spendCr} Cr | Score: ${s.score}`);
        console.log(`      Evidence: ${s.evidence}`);
      });
    }
  }
}

auditVerified().catch(console.error);
