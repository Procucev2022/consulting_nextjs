/**
 * Module 2 — Ten Strategic Sourcing Levers Overview Constants
 * Compliant with Rule 8, 9, strict type isolation and barrel exports
 */

import type { LeverOverviewItem } from '../types/module2Components';
import { UI_STRINGS } from './uiStrings';

const LEVER_STRINGS = UI_STRINGS.module2LeversOverview.levers.map((lever) => ({
  ...lever,
  requiredFields: [...lever.requiredFields],
  preconditions: [...lever.preconditions]
}));

export const TEN_LEVERS_OVERVIEW_CONFIG: LeverOverviewItem[] = [
  {
    id: 1,
    code: 'LEV-01',
    name: LEVER_STRINGS[0].name,
    purpose: LEVER_STRINGS[0].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[0].statusLabel,
    historicalOpportunityCr: null, // Populated dynamically from calculation engine
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[0].methodologySummary,
    requiredFields: LEVER_STRINGS[0].requiredFields,
    preconditions: LEVER_STRINGS[0].preconditions
  },
  {
    id: 2,
    code: 'LEV-02',
    name: LEVER_STRINGS[1].name,
    purpose: LEVER_STRINGS[1].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[1].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[1].methodologySummary,
    requiredFields: LEVER_STRINGS[1].requiredFields,
    preconditions: LEVER_STRINGS[1].preconditions
  },
  {
    id: 3,
    code: 'LEV-03',
    name: LEVER_STRINGS[2].name,
    purpose: LEVER_STRINGS[2].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[2].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[2].methodologySummary,
    requiredFields: LEVER_STRINGS[2].requiredFields,
    preconditions: LEVER_STRINGS[2].preconditions
  },

  {
    id: 4,
    code: 'LEV-04',
    name: LEVER_STRINGS[3].name,
    purpose: LEVER_STRINGS[3].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[3].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[3].methodologySummary,
    requiredFields: LEVER_STRINGS[3].requiredFields,
    preconditions: LEVER_STRINGS[3].preconditions
  },
  {
    id: 5,
    code: 'LEV-05',
    name: LEVER_STRINGS[4].name,
    purpose: LEVER_STRINGS[4].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[4].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[4].methodologySummary,
    requiredFields: LEVER_STRINGS[4].requiredFields,
    preconditions: LEVER_STRINGS[4].preconditions
  },
  {
    id: 6,
    code: 'LEV-06',
    name: LEVER_STRINGS[5].name,
    purpose: LEVER_STRINGS[5].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[5].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[5].methodologySummary,
    requiredFields: LEVER_STRINGS[5].requiredFields,
    preconditions: LEVER_STRINGS[5].preconditions
  },
  {
    id: 7,
    code: 'LEV-07',
    name: LEVER_STRINGS[6].name,
    purpose: LEVER_STRINGS[6].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[6].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[6].methodologySummary,
    requiredFields: LEVER_STRINGS[6].requiredFields,
    preconditions: LEVER_STRINGS[6].preconditions
  },
  {
    id: 8,
    code: 'LEV-08',
    name: LEVER_STRINGS[7].name,
    purpose: LEVER_STRINGS[7].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[7].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[7].methodologySummary,
    requiredFields: LEVER_STRINGS[7].requiredFields,
    preconditions: LEVER_STRINGS[7].preconditions
  },
  {
    id: 9,
    code: 'LEV-09',
    name: LEVER_STRINGS[8].name,
    purpose: LEVER_STRINGS[8].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[8].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[8].methodologySummary,
    requiredFields: LEVER_STRINGS[8].requiredFields,
    preconditions: LEVER_STRINGS[8].preconditions
  },
  {
    id: 10,
    code: 'LEV-10',
    name: LEVER_STRINGS[9].name,
    purpose: LEVER_STRINGS[9].purpose,
    implementationStatus: 'IMPLEMENTED',
    statusLabel: LEVER_STRINGS[9].statusLabel,
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: LEVER_STRINGS[9].methodologySummary,
    requiredFields: LEVER_STRINGS[9].requiredFields,
    preconditions: LEVER_STRINGS[9].preconditions
  }
];
