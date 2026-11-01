import * as fs from 'fs';
import * as path from 'path';
import {
  BOROSIL_COMMERCIAL_SCENARIOS
} from '../constants/borosilCommercialScenarios';
import {
  BOROSIL_ALTERNATIVE_SUPPLIERS,
  BOROSIL_TRANSFORMATION_LEVERS
} from '../constants/borosilAlternativeSuppliers';
import type { BorosilCommercialScenarioRegister } from '../types/borosilCommercialScenarios';

export function buildCommercialScenarioRegister(): BorosilCommercialScenarioRegister {
  return {
    metadata: {
      assessmentId: 'AIC-2026-0002',
      customerName: 'Borosil Ltd',
      generatedAt: new Date().toISOString(),
      canonicalBaselineSpendInr: 5565346426.19,
      canonicalBaselineSpendCr: 556.535,
      evaluatedDiagnosticSpendInr: 1686578923,
      evaluatedDiagnosticSpendCr: 168.658,
      qualifiedExecutionSpendInr: 1610158352,
      qualifiedExecutionSpendCr: 161.016,
      modelledOpportunityExcludingLever2Inr: 751213739,
      modelledOpportunityExcludingLever2Cr: 75.121,
      disclaimer: 'Illustrative Commercial Scenario — Subject to Supplier Quotes and Client Validation. These calculations are commercial sensitivity scenarios and are NOT added to the existing Module 2 authoritative opportunity totals.',
      totalScenariosCount: BOROSIL_COMMERCIAL_SCENARIOS.length
    },
    scenarios: BOROSIL_COMMERCIAL_SCENARIOS,
    alternativeSuppliers: BOROSIL_ALTERNATIVE_SUPPLIERS,
    transformationLevers: BOROSIL_TRANSFORMATION_LEVERS
  };
}

export function saveCommercialScenarioRegister(): { rootPath: string; reportPath: string } {
  const backendDir = path.resolve(__dirname, '../..');
  const projectRootDir = path.resolve(backendDir, '..');
  const register = buildCommercialScenarioRegister();
  const jsonContent = JSON.stringify(register, null, 2);

  const rootPath = path.resolve(projectRootDir, 'BOROSIL_COMMERCIAL_SCENARIO_REGISTER.json');
  fs.writeFileSync(rootPath, jsonContent, 'utf-8');

  // Also write to backend root for local resolution
  const backendRootPath = path.resolve(backendDir, 'BOROSIL_COMMERCIAL_SCENARIO_REGISTER.json');
  fs.writeFileSync(backendRootPath, jsonContent, 'utf-8');

  const reportDir = path.resolve(projectRootDir, 'data/dev/assessments/AIC-2026-0002/reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.resolve(reportDir, 'BOROSIL_COMMERCIAL_SCENARIO_REGISTER.json');
  fs.writeFileSync(reportPath, jsonContent, 'utf-8');

  return { rootPath, reportPath };
}
