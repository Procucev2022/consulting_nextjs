/**
 * Borosil Ltd Authoritative PCBI Benchmark Requirement Items (Frontend Constants)
 * Conforms to Rule 8 (constants isolation), Rule 9 (strongly typed), file length <= 300 lines.
 * Strictly reconciles to ₹556.5346426 Cr baseline and 27,777 included transactions.
 */

import type { PCBIMissingIndexGapItem } from '../types/module3GapList';
import { BOROSIL_REQUIREMENTS_PART1 } from './pcbiBorosilRequirementsPart1';
import { BOROSIL_REQUIREMENTS_PART2 } from './pcbiBorosilRequirementsPart2';

export const BOROSIL_DEFAULT_REQUIREMENTS: PCBIMissingIndexGapItem[] = [
  ...BOROSIL_REQUIREMENTS_PART1,
  ...BOROSIL_REQUIREMENTS_PART2
];

export { BOROSIL_REQUIREMENTS_PART1 } from './pcbiBorosilRequirementsPart1';
export { BOROSIL_REQUIREMENTS_PART2 } from './pcbiBorosilRequirementsPart2';
