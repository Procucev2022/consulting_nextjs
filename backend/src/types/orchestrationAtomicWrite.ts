import type { D1AtomicWriteContext } from './d1AtomicWrite';

export interface OrchestrationAtomicWriteContext extends D1AtomicWriteContext {
  requestId: string;
  tenantId: string;
  assessmentId: string;
  action: string;
}
