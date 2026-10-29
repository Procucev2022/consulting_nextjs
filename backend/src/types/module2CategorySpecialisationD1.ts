import type { ScopedModule2Analysis } from './module2D1Scoped';

export interface CategorySpecialisationD1BuildInput {
  assessmentId: string;
  tenantId: string;
  customerName: string;
  scopedAnalysis: ScopedModule2Analysis;
  calculatedAt?: string;
}
