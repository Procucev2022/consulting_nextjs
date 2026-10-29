import { MODULE2_D1_AUDIT_DOSSIER } from '../constants/module2D1AuditDossier';
import type { Module2D1AuditDossier } from '../types/module2D1AuditDossier';
import type { ScopedModule2Analysis } from '../types/module2D1Scoped';
import { Module2CanonicalCalculators } from './module2CanonicalCalculators';

export const buildModule2D1AuditDossier = (
  assessmentId: string,
  tenantId: string | undefined,
  result: ScopedModule2Analysis,
  generatedAt = new Date().toISOString()
): Module2D1AuditDossier => ({
  schemaVersion: MODULE2_D1_AUDIT_DOSSIER.schemaVersion,
  generatedAt,
  assessmentId,
  tenantId: tenantId ?? null,
  source: {
    system: MODULE2_D1_AUDIT_DOSSIER.sourceSystem,
    table: MODULE2_D1_AUDIT_DOSSIER.sourceTable,
    includedRecords: result.transactions.length,
    includedSpendInr: result.transactions.reduce((total, transaction) => total + transaction.total_spend_inr, 0),
    includedRecordsDisclosure: MODULE2_D1_AUDIT_DOSSIER.includedRecordsDisclosure,
    excludedRecordsDisclosure: MODULE2_D1_AUDIT_DOSSIER.excludedRecordsDisclosure
  },
  analysis: {
    summary: result.analysis.summary,
    categoryProfiles: result.analysis.profiles,
    opportunityLedger: Module2CanonicalCalculators.buildOpportunityLedger(
      result.analysis.profiles, result.transactions
    ),
    handoffPackages: result.analysis.handoffPackages
  },
  savingsDisclosure: MODULE2_D1_AUDIT_DOSSIER.savingsDisclosure
});
