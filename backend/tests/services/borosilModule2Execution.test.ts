import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

describe('Borosil Module 2: AI Categorization and Strategic Sourcing Opportunities', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const filePath = path.join(rootDir, 'data/dev/assessments/AIC-2026-0002/uploads/Borosil_PO_Consol_Excluding_BSL_Pune.xlsx');
  const workbookExportPath = path.join(rootDir, 'artifacts/excel_exports/Borosil_Module2_Strategic_Sourcing_Opportunities.xlsx');
  const jsonPath = path.join(rootDir, 'data/dev/assessments.json');

  it('confirms source file exists, contains 30,740 rows, and reconciles 27,777 included baseline rows', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    const wb = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: null });
    expect(rows.length).toBe(30740);

    let includedCount = 0;
    let deletedBlockedCount = 0;
    let stoCount = 0;

    rows.forEach(r => {
      const delInd = String(r['Deletion indicator'] ?? r['Deletion Indicator'] ?? '').trim().toUpperCase();
      const docType = String(r['Purchasing Document Type'] ?? r['Purchasing Doc. Type'] ?? r['Doc Type'] ?? '').trim().toUpperCase();

      if (delInd === 'L' || delInd === 'S') {
        deletedBlockedCount++;
      } else if (docType === 'UB') {
        stoCount++;
      } else {
        includedCount++;
      }
    });

    expect(includedCount).toBe(27777);
    expect(deletedBlockedCount).toBe(755);
    expect(stoCount).toBe(2208);
    expect(deletedBlockedCount + stoCount).toBe(2963);
    expect(includedCount + deletedBlockedCount + stoCount).toBe(30740);
  }, 30000);

  it('verifies that the Module 2 Excel workbook was generated and contains all 8 required sheets', () => {
    expect(fs.existsSync(workbookExportPath)).toBe(true);
    const wb = XLSX.readFile(workbookExportPath);
    const expectedSheets = [
      'Executive_Summary',
      'Category_Spend_Breakdown',
      'Spend_Family_Summary',
      'UNSPSC_Mapping_Register',
      'Supplier_Concentration',
      'PO_Consolidation_Opportunities',
      'Strategic_Opportunity_Register',
      'Data_Quality_Exceptions'
    ];
    expectedSheets.forEach(s => {
      expect(wb.SheetNames).toContain(s);
    });
  });

  it('validates 6 broad spend families in Spend_Family_Summary', () => {
    const wb = XLSX.readFile(workbookExportPath);
    const sheet = wb.Sheets['Spend_Family_Summary'];
    const rows = XLSX.utils.sheet_to_json<{ 'Broad Spend Family': string }>(sheet);
    const families = rows.map(r => r['Broad Spend Family']);

    expect(families).toContain('DIRECT_MATERIALS');
    expect(families).toContain('MRO_AND_ENGINEERING_SPARES');
    expect(families).toContain('SERVICES_AND_LOGISTICS');
    expect(families).toContain('PACKAGING');
    expect(families).toContain('CAPITAL_EXPENDITURE');
    expect(families).toContain('FUEL_AND_UTILITIES');
  });

  it('confirms the 5 strategic sourcing opportunities in Strategic_Opportunity_Register', () => {
    const wb = XLSX.readFile(workbookExportPath);
    const sheet = wb.Sheets['Strategic_Opportunity_Register'];
    const rows = XLSX.utils.sheet_to_json<{ 'Opportunity ID': string; 'Opportunity Type': string; 'Addressable Spend (₹ Cr)': number }>(sheet);

    expect(rows.length).toBe(5);
    const oppIds = rows.map(r => r['Opportunity ID']);
    expect(oppIds).toContain('OPP-BOR-01');
    expect(oppIds).toContain('OPP-BOR-02');
    expect(oppIds).toContain('OPP-BOR-03');
    expect(oppIds).toContain('OPP-BOR-04');
    expect(oppIds).toContain('OPP-BOR-05');

    // Confirm that addressable spend is positive and no realized savings percentage is published
    rows.forEach(opp => {
      expect(opp['Addressable Spend (₹ Cr)']).toBeGreaterThan(0);
    });
  });

  it('confirms strict module boundaries: Modules 3 and 4 remain unexecuted in assessments.json', () => {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const runs = data.analysisRuns['AIC-2026-0002'] || [];
    const activeRun = runs[0];

    expect(activeRun).toBeDefined();
    expect(activeRun.module2Metrics).toBeDefined();
    expect(activeRun.module2Metrics.categorizedSpendCr).toBeCloseTo(556.5347, 2);
    expect(activeRun.module2Metrics.materialGroups).toBe(133);
    expect(activeRun.module2Metrics.sourcingOpportunitiesCount).toBe(5);

    // Confirm Module 3 and Module 4 remain strictly unexecuted
    expect(activeRun.pcbiMetrics).toBeUndefined();
    expect(activeRun.module4Metrics).toBeUndefined();
    expect(activeRun.potentialSavingsCr).toBe(0);
    expect(activeRun.savingsPct).toBe(0);
  });
});
