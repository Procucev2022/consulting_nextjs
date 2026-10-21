import { AssessmentStore } from '../src/services/assessmentStore';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';

const store = AssessmentStore.getInstance();
const assessments = store.getAssessments();
console.log('Assessments:', assessments.map(a => ({ id: a.assessmentId, name: a.customerName })));

for (const a of assessments) {
  try {
    const txs = Module2CanonicalService.getCanonicalTransactions(a.assessmentId);
    const coal = txs.filter(t => /coal|western/i.test(t.material_desc || '') || /coal|western/i.test(t.vendor_name || ''));
    console.log(a.assessmentId, 'Total:', txs.length, 'Coal/Western matches:', coal.length);
    if (coal.length > 0) {
      console.log('Sample:', JSON.stringify(coal.slice(0, 2), null, 2));
    }
  } catch (err: any) {
    console.log(a.assessmentId, 'Error:', err.message);
  }
}
