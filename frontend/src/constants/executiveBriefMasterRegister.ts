/**
 * Executive Brief Master Opportunity Register Constants
 * Conforming strictly to Section 12, Section 15, and Section 18 of Prompt 275.
 */

import type { ExecutiveBriefMasterOpportunityItem } from '../types';
import { EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART1 } from './executiveBriefMasterRegisterPart1';
import { EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART2 } from './executiveBriefMasterRegisterPart2';

export const EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES: readonly ExecutiveBriefMasterOpportunityItem[] = [
  ...EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART1,
  ...EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES_PART2
];
