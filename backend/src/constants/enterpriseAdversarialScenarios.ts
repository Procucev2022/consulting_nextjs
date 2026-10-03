/**
 * Enterprise Production Hardening Adversarial Scenarios Index (Part W: 1 to 40)
 */

import { ENTERPRISE_SCENARIOS_PART_1 } from './enterpriseScenariosPart1';
import { ENTERPRISE_SCENARIOS_PART_2 } from './enterpriseScenariosPart2';
import type { EnterpriseAdversarialScenarioResult } from '../types/enterpriseHardeningTypes';

export const ENTERPRISE_40_ADVERSARIAL_SCENARIOS: EnterpriseAdversarialScenarioResult[] = [
  ...ENTERPRISE_SCENARIOS_PART_1,
  ...ENTERPRISE_SCENARIOS_PART_2
];
