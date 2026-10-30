export interface AssessmentSnapshotRow {
  entry_id: string;
  payload_json: string;
}

export type AssessmentSnapshotType = 'assessment' | 'customer' | 'version' | 'run' | 'audit';
