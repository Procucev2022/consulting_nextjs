export interface SpecificationReviewD1Row {
  review_id: string;
  assessment_id: string;
  candidate_id: string;
  reviewer_name: string;
  reviewer_role: string | null;
  review_date: string;
  status: 'TECHNICALLY_VERIFIED' | 'REJECTED' | 'AWAITING_TECHNICAL_REVIEW';
  technical_justification: string;
  proposed_standard: string | null;
  application_scope: string | null;
  rejection_reason: string | null;
}

export interface AssessmentMaterialMappingD1Row {
  assessment_id: string;
  source_material_id: string;
  payload_json: string;
  reviewed_by: string;
  updated_at: string;
}

export interface ProcurementComplianceReviewD1Row {
  review_id: string;
  assessment_id: string;
  exception_id: string;
  reviewer_name: string;
  reviewer_role: string | null;
  review_date: string;
  status: 'VERIFIED_EXCEPTION' | 'NOT_AN_EXCEPTION' | 'AWAITING_REVIEW';
  technical_justification: string;
  corrective_action_plan: string | null;
  dismissal_reason: string | null;
}
