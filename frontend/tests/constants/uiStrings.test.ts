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

  it('should correctly format descriptive error strings and templates', () => {
    expect(UI_STRINGS.errors.titles.validation).toBe('Input Validation Failed');
    expect(UI_STRINGS.errors.titles.network).toBe('Network Connection Interrupted');
    expect(UI_STRINGS.errors.titles.auth).toBe('Authentication Required');
    expect(UI_STRINGS.errors.titles.notFound).toBe('Resource Not Found');
    expect(UI_STRINGS.errors.titles.conflict).toBe('Data Conflict Detected');
    expect(UI_STRINGS.errors.titles.server).toBe('Internal System Failure');
    expect(UI_STRINGS.errors.titles.rateLimit).toBe('Request Limit Exceeded');
    expect(UI_STRINGS.errors.titles.generic).toBe('Operation Could Not Be Completed');

    expect(UI_STRINGS.errors.validation.requiredField('email')).toBe('Field "email" is required and cannot be left blank.');
    expect(UI_STRINGS.errors.validation.invalidFormat('phone', '+1-xxx-xxx-xxxx')).toBe('Field "phone" has an invalid format. Expected format: +1-xxx-xxx-xxxx.');
    expect(UI_STRINGS.errors.validation.outOfRange('age', 18, 65)).toBe('Field "age" must be between 18 and 65.');
    expect(UI_STRINGS.errors.validation.actionableAdvice).toContain('Please review highlighted input fields');

    expect(UI_STRINGS.errors.network.offline).toContain('You appear to be offline');
    expect(UI_STRINGS.errors.network.timeout('Upload', 5000)).toBe('The request for "Upload" timed out after 5000ms due to poor latency.');
    expect(UI_STRINGS.errors.network.unreachable('FX API')).toBe('Unable to establish connection to FX API. The service may be temporarily down or undergoing maintenance.');

    expect(UI_STRINGS.errors.auth.sessionExpired).toContain('session has expired');
    expect(UI_STRINGS.errors.auth.insufficientPermissions('Viewer', 'Admin')).toBe('Current role "Viewer" lacks permission. Required privilege: "Admin".');
    expect(UI_STRINGS.errors.auth.tenantAccessDenied('tenant-99')).toBe('Access denied to tenant workspace "tenant-99". Please verify your organization credentials.');

    expect(UI_STRINGS.errors.notFound.entityNotFound('Supplier', 'SUP-999')).toBe('The requested Supplier with identifier "SUP-999" could not be found in the database.');

    expect(UI_STRINGS.errors.conflict.duplicateEntity('Vendor', 'DHL')).toBe('A Vendor with "DHL" already exists in the system.');
    expect(UI_STRINGS.errors.conflict.concurrencyConflict).toContain('simultaneously');

    expect(UI_STRINGS.errors.server.internalError(500, 'req-abc-123')).toBe('Server returned HTTP 500. Diagnostic tracking reference: req-abc-123.');
    expect(UI_STRINGS.errors.server.databaseUnavailable).toContain('database service failed to respond');

    expect(UI_STRINGS.errors.rateLimit.throttled(30)).toBe('API rate limit exceeded. Too many requests in a short interval. Please wait 30s before retrying.');
  });
});

