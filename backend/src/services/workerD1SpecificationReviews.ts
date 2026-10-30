import type { SpecificationRationalisationResult, TechnicalReviewRecord } from '../types/module2SpecificationRationalisation';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { SpecificationReviewD1Row } from '../types/module2ReviewD1';

export const loadSpecificationReviewHistory = async (
  db: CloudflareD1Database,
  assessmentId: string
): Promise<Record<string, TechnicalReviewRecord[]>> => {
  const response = await db.prepare(`
    SELECT review_id, candidate_id, reviewer_name, reviewer_role, review_date, status,
      technical_justification, proposed_standard, application_scope, rejection_reason
    FROM Module2SpecificationReview
    WHERE assessment_id = ?
    ORDER BY review_date ASC, review_id ASC
  `).bind(assessmentId).all<SpecificationReviewD1Row>();
  const history: Record<string, TechnicalReviewRecord[]> = {};
  for (const row of response.results || []) {
    const record: TechnicalReviewRecord = {
      reviewId: row.review_id,
      reviewerName: row.reviewer_name,
      reviewDate: row.review_date,
      status: row.status,
      technicalJustification: row.technical_justification,
      ...(row.reviewer_role ? { reviewerRole: row.reviewer_role } : {}),
      ...(row.proposed_standard ? { proposedStandard: row.proposed_standard } : {}),
      ...(row.application_scope ? { applicationScope: row.application_scope } : {}),
      ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {})
    };
    history[row.candidate_id] = [...(history[row.candidate_id] || []), record];
  }
  return history;
};

export const applySpecificationReviewHistory = (
  report: SpecificationRationalisationResult,
  history: Record<string, TechnicalReviewRecord[]>
): SpecificationRationalisationResult => {
  const candidates = report.candidates.map((candidate) => {
    const reviews = history[candidate.candidateId] || [];
    const latest = reviews[reviews.length - 1];
    if (!latest) return { ...candidate, reviewHistory: [] };
    const nextRequiredAction = latest.status === 'TECHNICALLY_VERIFIED'
      ? 'Technical review is recorded. Complete commercial validation before considering any benefit.'
      : latest.status === 'REJECTED'
        ? 'Candidate was rejected by the technical reviewer. Retain the recorded reason for audit.'
        : 'Technical review remains open. Obtain the required engineering assessment.';
    return { ...candidate, reviewStatus: latest.status, reviewHistory: reviews, nextRequiredAction };
  });
  const count = (status: string): number => candidates.filter((candidate) => candidate.reviewStatus === status).length;
  return {
    ...report,
    reviewWorkflowAvailable: true,
    candidates,
    summary: {
      ...report.summary,
      awaitingTechnicalReviewCount: count('AWAITING_TECHNICAL_REVIEW'),
      technicallyVerifiedCount: count('TECHNICALLY_VERIFIED'),
      rejectedCount: count('REJECTED'),
      potentialMatchCount: count('POTENTIAL_MATCH')
    }
  };
};
