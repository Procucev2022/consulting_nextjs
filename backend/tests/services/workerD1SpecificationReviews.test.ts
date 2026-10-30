import { describe, expect, it } from 'vitest';
import { buildSpecificationRationalisationFromD1 } from '../../src/services/workerD1SpecificationRationalisation';
import {
  applySpecificationReviewHistory, loadSpecificationReviewHistory
} from '../../src/services/workerD1SpecificationReviews';
import type { SpecificationRationalisationResult } from '../../src/types/module2SpecificationRationalisation';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';

const transactions: StrategicInputTransaction[] = [
  { id: 'TX-A', vendor_name: 'Supplier A', material_code: 'MAT-A', material_desc: 'Bolt M12',
    spend_category: 'Hardware', uom: 'EA', quantity: 2, unit_price: 10, total_spend_inr: 20 },
  { id: 'TX-B', vendor_name: 'Supplier B', material_code: 'MAT-B', material_desc: ' bolt m12 ',
    spend_category: 'hardware', uom: 'ea', quantity: 3, unit_price: 15, total_spend_inr: 45 }
];

const report = (): SpecificationRationalisationResult => buildSpecificationRationalisationFromD1({
  assessmentId: 'A1', tenantId: 'T1', customerName: 'Customer One', transactions
});

describe('D1 specification review persistence', () => {
  it('loads chronologically ordered review records and omits nullable fields when absent', async () => {
    const fixture = createWorkerDatabase();
    try {
      const insert = fixture.db.prepare(`INSERT INTO Module2SpecificationReview (
        review_id, assessment_id, candidate_id, reviewer_name, reviewer_role, review_date, status,
        technical_justification, proposed_standard, application_scope, rejection_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      insert.run('REV-2', 'A1', 'SPEC-1', 'Asha', null, '2026-02-02T00:00:00.000Z',
        'TECHNICALLY_VERIFIED', 'Reviewed drawing', null, null, null);
      insert.run('REV-1', 'A1', 'SPEC-1', 'Asha', 'Engineer', '2026-02-01T00:00:00.000Z',
        'AWAITING_TECHNICAL_REVIEW', 'Requested review', 'Bolt M12', 'Line 1', null);

      const history = await loadSpecificationReviewHistory(fixture.d1, 'A1');
      expect(history['SPEC-1']).toEqual([
        expect.objectContaining({ reviewId: 'REV-1', reviewerRole: 'Engineer', proposedStandard: 'Bolt M12' }),
        expect.objectContaining({ reviewId: 'REV-2', reviewerName: 'Asha', status: 'TECHNICALLY_VERIFIED' })
      ]);
      expect(history['SPEC-1']?.[1]).not.toHaveProperty('reviewerRole');
      expect(await loadSpecificationReviewHistory(fixture.d1, 'A2')).toEqual({});
    } finally {
      fixture.close();
    }
  });

  it('applies a persisted verification and counts review states without claiming savings', () => {
    const base = report();
    const candidateId = base.candidates[0].candidateId;
    const result = applySpecificationReviewHistory(base, {
      [candidateId]: [{
        reviewId: 'REV-1', reviewerName: 'Asha', reviewerRole: 'Engineer', reviewDate: '2026-01-01',
        status: 'TECHNICALLY_VERIFIED', technicalJustification: 'Checked approved drawings.'
      }]
    });
    expect(result).toMatchObject({
      reviewWorkflowAvailable: true,
      summary: { technicallyVerifiedCount: 1, awaitingTechnicalReviewCount: 0, rejectedCount: 0, potentialMatchCount: 0,
        commercialSavingsQuantifiedInr: 0 },
      candidates: [expect.objectContaining({ reviewStatus: 'TECHNICALLY_VERIFIED', reviewHistory: [
        expect.objectContaining({ reviewId: 'REV-1' })
      ] })]
    });
    expect(result.candidates[0].nextRequiredAction).toContain('commercial validation');
  });

  it.each([
    ['REJECTED', 'rejected by the technical reviewer'],
    ['AWAITING_TECHNICAL_REVIEW', 'review remains open']
  ] as const)('applies %s state and keeps the next action explicit', (status, action) => {
    const base = report();
    const candidateId = base.candidates[0].candidateId;
    const result = applySpecificationReviewHistory(base, {
      [candidateId]: [{
        reviewId: 'REV-2', reviewerName: 'Asha', reviewDate: '2026-01-02', status,
        technicalJustification: 'Decision recorded.'
      }]
    });
    expect(result.candidates[0].nextRequiredAction).toContain(action);
    expect(result.summary).toMatchObject({
      rejectedCount: status === 'REJECTED' ? 1 : 0,
      awaitingTechnicalReviewCount: status === 'AWAITING_TECHNICAL_REVIEW' ? 1 : 0
    });
  });

  it('keeps an unreviewed candidate in the potential state', () => {
    const result = applySpecificationReviewHistory(report(), {});
    expect(result).toMatchObject({
      reviewWorkflowAvailable: true,
      summary: { potentialMatchCount: 1, awaitingTechnicalReviewCount: 0 },
      candidates: [expect.objectContaining({ reviewStatus: 'POTENTIAL_MATCH', reviewHistory: [] })]
    });
  });
});
