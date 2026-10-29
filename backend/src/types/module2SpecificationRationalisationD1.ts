import type { SpecificationMaterialItem } from './module2SpecificationRationalisation';
import type { StrategicInputTransaction } from './strategicSourcing';

export interface SpecificationRationalisationD1BuildInput {
  assessmentId: string;
  tenantId: string;
  customerName: string;
  calculatedAt?: string;
  transactions: StrategicInputTransaction[];
}

export interface SpecificationRationalisationMaterialAggregate extends SpecificationMaterialItem {
  spendCategory: string;
  supplierKeys: Set<string>;
  plantKeys: Set<string>;
  groupKey: string;
}
