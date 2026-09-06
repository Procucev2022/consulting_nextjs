import { describe, it, expect } from 'vitest';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('UI_STRINGS Constants & Parameterized Formatters', () => {
  it('should provide static strings for common and header modules', () => {
    expect(UI_STRINGS.common.brand).toBe('PROCUCEV');
    expect(UI_STRINGS.common.engineVersion).toBe('ENGINE 2.0');
    expect(UI_STRINGS.common.save).toBe('Save Changes');
    expect(UI_STRINGS.common.cancel).toBe('Cancel');
    expect(UI_STRINGS.header.brand).toBe('PROCUCEV');
    expect(UI_STRINGS.header.themeToggleDark).toBe('Switch to Dark Mode');
    expect(UI_STRINGS.header.themeToggleLight).toBe('Switch to Light Mode');
  });

  it('should correctly format parameterized header templates', () => {
    expect(UI_STRINGS.header.docRef('TEST-REF-123')).toBe('DOC REF: TEST-REF-123');
    expect(UI_STRINGS.header.authorFormatted('Alice', 'Lead Partner')).toBe('Author: Alice (Lead Partner)');
    expect(UI_STRINGS.header.slaQuery(500)).toBe('SLA: <500ms Query');
    expect(UI_STRINGS.header.currencyTitle('USD')).toBe('USD Base');
  });

  it('should correctly format pipeline and schema templates', () => {
    expect(UI_STRINGS.pipeline.currentStage(2, 'Taxonomy')).toBe('Current Active Stage: [Stage 2: Taxonomy]');
    expect(UI_STRINGS.pipeline.stages[1].title).toBe('Data Ingestion');
    expect(UI_STRINGS.schema.attributesCount(12)).toBe('12 Attributes');
  });

  it('should correctly format module1 summary cards', () => {
    expect(UI_STRINGS.module1.summaryCards.totalRecords(100)).toBe('100 Total Ingested');
    expect(UI_STRINGS.module1.summaryCards.validRecords(80)).toBe('80 Clean Records');
    expect(UI_STRINGS.module1.summaryCards.flaggedRecords(20)).toBe('20 Anomalies Detected');
    expect(UI_STRINGS.module1.summaryCards.remediatedPct(95)).toBe('95% Remediation Rate');
  });

  it('should correctly format module2 confidence scores', () => {
    expect(UI_STRINGS.module2.confidenceScore(92)).toBe('92% Confidence');
  });

  it('should correctly format module3 volatility and creep templates', () => {
    expect(UI_STRINGS.module3.volatilityIndex(4)).toBe('Volatility Index: 4');
    expect(UI_STRINGS.module3.priceCreepPct(12.5)).toBe('+12.5% Creep');
    expect(UI_STRINGS.module3.leakageAmount('₹4.2 Cr')).toBe('₹4.2 Cr Leakage');
  });

  it('should correctly format module4 opportunity templates', () => {
    expect(UI_STRINGS.module4.opportunitiesCount(7)).toBe('7 Actionable Savings Levers Identified');
  });

  it('should correctly format modals templates', () => {
    expect(UI_STRINGS.modals.topItems.categoryTitle('Packaging')).toBe('Packaging — Top 10 Line Items & 3-Year Price Trends');
    expect(UI_STRINGS.modals.topItems.vendorTitle('Amcor')).toBe('Amcor — Top Line Items & 3-Year Price Trends');
    expect(UI_STRINGS.modals.dpsNXT.qualifiedBiddersCount(6)).toBe('6 Qualified Bidders Invited');
  });
});
