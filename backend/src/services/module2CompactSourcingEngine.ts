import { MODULE2_D1_PROFILE_DETAIL_FIELDS } from '../constants/module2D1Scoped';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { ScopedCategoryProfile } from '../types/module2D1Scoped';
import { Module2StrategicSourcingEngine } from './module2StrategicSourcingEngine';

/** Keep list/summary calculations identical while retaining audit detail only for a requested category. */
export class Module2CompactSourcingEngine extends Module2StrategicSourcingEngine {
  public static buildCategoryProfile(
    categoryName: string, transactions: StrategicInputTransaction[]
  ): ScopedCategoryProfile {
    const profile = super.buildCategoryProfile(categoryName, transactions, false);
    const compact: ScopedCategoryProfile = {
      ...profile, sourceCategoryKey: categoryName, detailsOmitted: true,
      exclusions: [], levers: [], waterfall: []
    };
    for (const field of MODULE2_D1_PROFILE_DETAIL_FIELDS) delete compact[field];
    return compact;
  }
}
