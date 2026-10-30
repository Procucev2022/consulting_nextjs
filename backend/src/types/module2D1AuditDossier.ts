import type { Module2OpportunityLedgerItem } from './module2Canonical';
import type { Module2ToModule4HandoffPackage } from './module2StrategicSourcingProfiles';
import type { ScopedModule2Analysis } from './module2D1Scoped';

export interface Module2D1AuditDossier {
  schemaVersion: string;
  generatedAt: string;
  assessmentId: string;
  tenantId: string | null;
  source: {
    system: string;
    table: string;
    includedRecords: number;
    includedSpendInr: number;
    includedRecordsDisclosure: string;
    excludedRecordsDisclosure: string;
  };
  analysis: {
    summary: ScopedModule2Analysis['analysis']['summary'];
    categoryProfiles: ScopedModule2Analysis['analysis']['profiles'];
    opportunityLedger: Module2OpportunityLedgerItem[];
    handoffPackages: Module2ToModule4HandoffPackage[];
  };
  savingsDisclosure: string;
}
