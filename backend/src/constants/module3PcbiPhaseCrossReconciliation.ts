/**
 * Module 3 PCBI Phase 3A — Cross-Phase Coverage & Material-Level Reconciliation Constants
 * Assessment ID: AIC-2026-0002 (Borosil Ltd)
 * Conforms to Rule 8 (constants isolation), Rule 9 (strongly typed), and file length <= 300 lines.
 */

import type { Phase3CrossReconciliationRegister } from '../types/module3PcbiObservationProvenance';

export const BOROSIL_CROSS_PHASE_COVERAGE_RECONCILIATION: Phase3CrossReconciliationRegister = {
  assessmentId: 'AIC-2026-0002',
  authoritativeBaselineSpendCr: 556.5346,
  authoritativeBaselineTransactions: 27777,
  reconciledSpendCr: 556.5346,
  reconciledTransactions: 27777,
  isFullyReconciled: true,
  items: [
    {
      commodityFamily: 'Soda Ash (Dense & Light)',
      phase2CatalogSpendCr: 74.0170,
      phase2Transactions: 12,
      phase3Partition: 'PENDING_APPROVAL_MAPPINGS',
      phase3PartitionSpendCr: 74.0170,
      phase3PartitionTransactions: 11,
      materialCodes: ['100SA02G', '100SA01T'],
      inclusionRationale:
        'Includes primary manufacturing dense soda ash from GHCL (100SA02G: 6 txs, ₹58.1170 Cr) and local spot ' +
        'soda ash (100SA01T: 5 txs, ₹15.9000 Cr). Total direct manufacturing spend: ₹74.0170 Cr.',
      varianceExplanation:
        'Phase 2 catalog group listed 12 transactions totaling ₹74.0170 Cr, which included 1 laboratory/maintenance ' +
        'supply transaction for KPMAINT07134 (₹349.05 INR, < ₹0.0001 Cr). In Phase 3, KPMAINT07134 is classified ' +
        'under UNMAPPED_SPEND as general plant maintenance, leaving exactly 11 production transactions (₹74.0170 Cr). ' +
        'The ₹82.35 Cr figure in Phase 3 narrative was an illustrative candidate estimate; the ground-truth Borosil ' +
        'soda ash PO ledger spend is strictly ₹74.0170 Cr.'
    },
    {
      commodityFamily: 'Silica Sand & Quartz',
      phase2CatalogSpendCr: 39.0219,
      phase2Transactions: 28,
      phase3Partition: 'PENDING_APPROVAL_MAPPINGS & MANUAL_VALIDATION_REQUIRED',
      phase3PartitionSpendCr: 39.0219,
      phase3PartitionTransactions: 28,
      materialCodes: ['100SSW13FG-L', '100SSW12FG', '100QS01PR'],
      inclusionRationale:
        'Phase 2 catalog grouped all 3 mining sands (28 txs, ₹39.0219 Cr). Phase 3 partitions direct washed optical ' +
        'solar sand 100SSW13FG-L (20 txs, ₹36.6840 Cr) into PENDING_APPROVAL, and secondary unbeneficiated sands ' +
        '100SSW12FG (5 txs, ₹1.8339 Cr) and 100QS01PR (3 txs, ₹0.5040 Cr) into MANUAL_VALIDATION_REQUIRED.',
      varianceExplanation:
        'Phase 2 reported the full mineral family of ₹39.0219 Cr. Phase 3 splits this into candidate mapped spend ' +
        '(₹36.6840 Cr) and manual technical review spend (₹2.3379 Cr) because generic IBM quarry sand prices (~₹850/MT) ' +
        'cannot be equated with optical glass sand (~₹18,000/MT) without an approved beneficiation spread. The ₹30.56 Cr ' +
        'figure in Phase 3 narrative represented an illustrative net quarry-equivalent baseline.'
    },
    {
      commodityFamily: 'Corrugated Boxes, Cartons and Kraft Paper',
      phase2CatalogSpendCr: 8.1840,
      phase2Transactions: 413,
      phase3Partition: 'PENDING_APPROVAL_MAPPINGS & UNMAPPED_SPEND',
      phase3PartitionSpendCr: 6.9585,
      phase3PartitionTransactions: 6,
      materialCodes: ['300PP112'],
      inclusionRationale:
        'Phase 3 restricts candidate benchmark mapping strictly to raw uncorrugated Kraft paper rolls (300PP112: ' +
        '6 txs, ₹6.9585 Cr), which can be mapped directly to domestic paper mill commodity price series.',
      varianceExplanation:
        'Phase 2 catalog included 108 packaging materials and 413 transactions (₹8.1840 Cr) covering finished custom ' +
        'carton boxes, distributor packaging, and corrugated assemblies. In Phase 3, finished boxes (407 txs, ₹1.2255 Cr) ' +
        'are partitioned into UNMAPPED_SPEND because custom converted boxes incorporate die-cutting, folding, and gluing ' +
        'value-add that cannot be benchmarked directly against raw paper mill indices without conversion spread models.'
    }
  ]
};
