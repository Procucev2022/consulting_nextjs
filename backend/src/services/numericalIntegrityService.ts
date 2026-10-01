/**
 * Numerical Integrity & Scale-Error Certification Service (Prompt 256)
 * Audits all numerical invariants on absolute numeric raw INR values.
 */

import {
  AUDITED_NUMERICAL_INVARIANTS,
  WATERFALL_RECONCILIATION_STAGES,
  AUDITED_MODULE_4_PACKAGES,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR
} from '../constants/numericalAuditConstants';
import type {
  AuditedNumericalInvariant,
  WaterfallStageLineage,
  Module4PackageLineage
} from '../types/numericalAuditTypes';
import {
  verifyRawInrEquality,
  detectScaleError,
  formatINR,
  formatINRCrore
} from '../utils/moneyModel';

export class NumericalIntegrityService {
  private static instance: NumericalIntegrityService;

  public static getInstance(): NumericalIntegrityService {
    if (!NumericalIntegrityService.instance) {
      NumericalIntegrityService.instance = new NumericalIntegrityService();
    }
    return NumericalIntegrityService.instance;
  }

  /**
   * Audits all invariants on absolute raw INR values with scale error defense
   */
  public auditAllInvariants(customInvariants?: AuditedNumericalInvariant[]): AuditedNumericalInvariant[] {
    const list = customInvariants ?? AUDITED_NUMERICAL_INVARIANTS;
    return list.map((inv) => {
      const equality = verifyRawInrEquality(inv.lhsRawInr, inv.rhsRawInr);
      const scaleCheck = detectScaleError(inv.lhsRawInr, inv.rhsRawInr);

      const status = equality.isMatch && !scaleCheck.hasScaleError ? 'PASS' : 'FAIL';

      return {
        ...inv,
        varianceRawInr: equality.variance,
        calculationStatus: status
      };
    });
  }

  /**
   * Returns full waterfall reconciliation lineage with transaction counts and IDs
   */
  public getWaterfallLineage(): WaterfallStageLineage[] {
    return WATERFALL_RECONCILIATION_STAGES;
  }

  /**
   * Returns Module 4 package lineage
   */
  public getModule4PackageLineage(): Module4PackageLineage[] {
    return AUDITED_MODULE_4_PACKAGES;
  }

  /**
   * Reconciles Module 4 handoff packages and verifies cap against net defensible opportunity
   */
  public verifyModule4HandoffIntegrity(): {
    isReconciled: boolean;
    sumApprovedPackagesInr: number;
    approvedHandoffTotalInr: number;
    netDefensibleOpportunityInr: number;
    isWithinCap: boolean;
    varianceInr: number;
  } {
    const packages = this.getModule4PackageLineage();
    const sumApproved = packages.reduce((acc, pkg) => acc + pkg.approvedBenefitInr, 0);
    const approvedTotal = RAW_APPROVED_MODULE4_INR;
    const netDefensible = RAW_NET_DEFENSIBLE_INR;

    const varianceInr = Math.abs(sumApproved - approvedTotal);
    const isReconciled = varianceInr === 0;
    const isWithinCap = approvedTotal <= netDefensible;

    return {
      isReconciled,
      sumApprovedPackagesInr: sumApproved,
      approvedHandoffTotalInr: approvedTotal,
      netDefensibleOpportunityInr: netDefensible,
      isWithinCap,
      varianceInr
    };
  }

  /**
   * Generates Numerical Integrity Certification Markdown section
   */
  public generateNumericalAuditMarkdown(customHandoff?: {
    sumApprovedPackagesInr: number;
    approvedHandoffTotalInr: number;
    netDefensibleOpportunityInr: number;
    isWithinCap: boolean;
    varianceInr: number;
  }): string {
    const invariants = this.auditAllInvariants();
    const handoff = customHandoff ?? this.verifyModule4HandoffIntegrity();

    return `## Critical Numerical Invariant Audit (Prompt 256)

Every invariant is evaluated directly on absolute numeric INR values with scale-error defense.

| Invariant ID | Description | LHS Raw INR | RHS Raw INR | Variance | Display (LHS vs RHS) | Status |
|---|---|---|---|---|---|---|
${invariants.map((inv) => `| \`${inv.invariantId}\` | ${inv.description} | ${inv.lhsRawInr} | ${inv.rhsRawInr} | ₹${inv.varianceRawInr.toFixed(2)} | ${inv.lhsDisplay} = ${inv.rhsDisplay} | **${inv.calculationStatus}** |`).join('\n')}

### Module 4 Handoff Reconciliation
- **Sum of Approved Wave 1 Packages**: ${formatINR(handoff.sumApprovedPackagesInr)} (${formatINRCrore(handoff.sumApprovedPackagesInr)})
- **Module 4 Approved Handoff Total**: ${formatINR(handoff.approvedHandoffTotalInr)} (${formatINRCrore(handoff.approvedHandoffTotalInr)})
- **Net Defensible Opportunity Cap**: ${formatINR(handoff.netDefensibleOpportunityInr)} (${formatINRCrore(handoff.netDefensibleOpportunityInr)})
- **Variance**: ₹${handoff.varianceInr.toFixed(2)}
- **Cap Adherence**: **${handoff.isWithinCap ? 'PASS (<= Net Defensible Opportunity)' : 'FAIL'}**
`;
  }
}

export const numericalIntegrityService = NumericalIntegrityService.getInstance();
