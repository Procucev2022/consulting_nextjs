export interface AssessmentSnapshotRow {
  assessment_id: string;
  entry_id: string;
  payload_json: string;
}

export type AssessmentSnapshotType = 'assessment' | 'customer' | 'version' | 'run' | 'audit';
