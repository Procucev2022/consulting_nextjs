import { describe, it, expect } from 'vitest';
import { customerWebsiteService } from '../../src/services/customerWebsiteService';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment,
  ABC_TEXTILE_PRESENTATION_CONTRACT,
  DEMO_ARCHETYPE_PRESENTATION_CONTRACT,
  isAdditiveDirectSaving,
  validateWaterfallMath,
  validateNetComposition
} from '../../src/constants/executiveBriefPresentationConstants';
import { ExecutiveOpportunityBriefExportService } from '../../src/services/executiveOpportunityBriefExportService';
import { ExecutiveBriefExportService } from '../../src/services/executiveBriefExportService';

describe('Prompt 503: Customer Website Intelligence & Customer-Specific Brief Binding', () => {
  describe('Customer Website Intelligence Service', () => {
    it('retrieves pre-seeded profile for ABC Textile Ltd with verified published metrics', () => {
      const profile = customerWebsiteService.getProfileForCustomer(
        'ABC Textile Ltd',
        'https://www.abctextile.example.com'
      );
      expect(profile).toBeDefined();
      expect(profile?.companyWebsite).toBe('https://www.abctextile.example.com');
      expect(profile?.sector).toBe('Textiles & Technical Fabrics');
      expect(profile?.revenueOrProfit).toContain('2,450 Cr Revenue');
      expect(profile?.revenueOrProfit).toContain('285 Cr Operating Profit');
      expect(profile?.reportingPeriod).toContain('FY 2022-23');
      expect(profile?.operatingFootprint).toContain('6 manufacturing facilities');
      expect(profile?.businessPriorities.length).toBeGreaterThanOrEqual(2);
      expect(profile?.sourceUrls.length).toBeGreaterThanOrEqual(1);
    });

    it('retrieves profile for UltraTech Cement demo archetype', () => {
      const profile = customerWebsiteService.getProfileForCustomer('UltraTech Cement Limited');
      expect(profile).toBeDefined();
      expect(profile?.sector).toContain('Cement');
      expect(profile?.operatingFootprint).toContain('grinding units');
    });

    it('synthesizes a non-blocking graceful profile for an unknown customer with website', () => {
      const profile = customerWebsiteService.getProfileForCustomer(
        'Acme Manufacturing Corp',
        'https://www.acme-corp.com'
      );
      expect(profile).toBeDefined();
      expect(profile?.companyWebsite).toBe('https://www.acme-corp.com');
      expect(profile?.businessPriorities.length).toBeGreaterThan(0);
      expect(profile?.sourceUrls).toContain('https://www.acme-corp.com');
    });

    it('handles invalid or empty website URL without blocking (returns undefined safely)', () => {
      const profileEmpty = customerWebsiteService.getProfileForCustomer('Test Corp', '');
      expect(profileEmpty).toBeUndefined();

      const profileInvalid = customerWebsiteService.getProfileForCustomer('Test Corp', 'invalid-url');
      expect(profileInvalid).toBeUndefined();
    });

    it('validates website URLs accurately', () => {
      expect(customerWebsiteService.isValidWebsiteUrl('https://www.google.com')).toBe(true);
      expect(customerWebsiteService.isValidWebsiteUrl('http://sub.domain.co.in/path')).toBe(true);
      expect(customerWebsiteService.isValidWebsiteUrl('ftp://invalid.com')).toBe(false);
      expect(customerWebsiteService.isValidWebsiteUrl('not a url')).toBe(false);
      expect(customerWebsiteService.isValidWebsiteUrl('')).toBe(false);
    });

    it('handles fetchPublicProfile with valid, invalid, and cached inputs', async () => {
      const invalidRes = await customerWebsiteService.fetchPublicProfile('not-valid');
      expect(invalidRes).toBeNull();

      const validNew = await customerWebsiteService.fetchPublicProfile('https://www.future-tech.com', 'Future Tech Corp');
      expect(validNew).toBeDefined();
      expect(validNew?.companyWebsite).toBe('https://www.future-tech.com');

      const cached = await customerWebsiteService.fetchPublicProfile('https://www.future-tech.com', 'Future Tech Corp');
      expect(cached).toBe(validNew);
    });
  });

  describe('Customer Assessment Presentation Contract Binding', () => {
    it('correctly identifies customer assessments versus demo archetypes', () => {
      expect(isCustomerAssessment('ABC Textile Ltd')).toBe(true);
      expect(isCustomerAssessment('abc textile')).toBe(true);
      expect(isCustomerAssessment('AIC-2026-0002')).toBe(true);
      expect(isCustomerAssessment('UltraTech Cement Limited')).toBe(false);
      expect(isCustomerAssessment('Demonstration Archetype')).toBe(false);
    });

    it('binds ABC Textile Ltd to verified Prompt 503 presentation values', () => {
      const contract = getExecutiveBriefPresentationContract('ABC Textile Ltd');
      expect(contract.totalCustomerSpendCr).toBe(613.8805);
      expect(contract.grossOpportunityCr).toBe(110.764);
      expect(contract.overlapDeductionsCr).toBe(25.123);
      expect(contract.netDefensiblePipelineCr).toBe(85.641);
      expect(contract.validatedSavingsCr).toBe(82.380);
      expect(contract.realizedSavingsCr).toBe(0.00);
      expect(contract.baselineTransactions).toBe(23570);
      expect(contract.baselineSuppliers).toBe(420);
      expect(contract.baselinePlants).toBe(6);
      expect(contract.analysisPeriodMonths).toBe(12);

      // Verify mathematical balance: Gross - Overlap = Net
      const calculatedNet = contract.grossOpportunityCr - contract.overlapDeductionsCr;
      expect(Number(calculatedNet.toFixed(3))).toBe(contract.netDefensiblePipelineCr);
    });

    it('preserves Demo Archetype presentation contract separately', () => {
      const demoContract = getExecutiveBriefPresentationContract('UltraTech Cement Limited');
      expect(demoContract.totalCustomerSpendCr).toBe(5920.35);
      expect(demoContract.netDefensiblePipelineCr).toBe(93.60);
      expect(demoContract.netDirectSavingsCr).toBe(78.72);
      expect(demoContract.strategicMarketValueCr).toBe(14.88);
      expect(demoContract.baselineTransactions).toBe(31671);
    });

    it('validates mathematical helper functions on presentation contracts', () => {
      expect(isAdditiveDirectSaving('DIRECT_SAVINGS')).toBe(true);
      expect(isAdditiveDirectSaving('STRATEGIC_VALUE')).toBe(false);

      expect(validateWaterfallMath()).toBe(true);
      expect(validateWaterfallMath(ABC_TEXTILE_PRESENTATION_CONTRACT)).toBe(true);

      expect(validateNetComposition()).toBe(true);
      expect(validateNetComposition(ABC_TEXTILE_PRESENTATION_CONTRACT)).toBe(true);
    });
  });

  describe('Dual-Format Brief Generation and Isolation', () => {
    it('generates 10-slide Management Brief for ABC Textile Ltd with zero UltraTech leakage', async () => {
      const result = await ExecutiveOpportunityBriefExportService.generateOpportunityBrief('ABC Textile Ltd');
      expect(result.pdfBuffer).toBeDefined();
      expect(result.pptxBuffer).toBeDefined();
      expect(result.pdfFilename).toBe('aiCEV_ABC_Textile_Ltd_Executive_Opportunity_Brief.pdf');
      expect(result.pptxFilename).toBe('aiCEV_ABC_Textile_Ltd_Executive_Opportunity_Brief.pptx');

      const pdfStr = result.pdfBuffer.toString('utf-8');
      expect(pdfStr).not.toContain('UltraTech');
      expect(pdfStr).not.toContain('5,920.35');
      expect(pdfStr).toContain('85.641');
      expect(pdfStr).toContain('613.8805');
    });

    it('generates 30-slide Executive Brief for ABC Textile Ltd with PCBI UNAVAILABLE and verified values', async () => {
      const exportService = ExecutiveBriefExportService.getInstance();
      const result = await exportService.generateDualFormatExport('ABC Textile Ltd');
      expect(result.pdfBuffer).toBeDefined();
      expect(result.pptxBuffer).toBeDefined();

      const pdfStr = result.pdfBuffer.toString('utf-8');
      expect(pdfStr).not.toContain('UltraTech');
      expect(pdfStr).not.toContain('5,920.35');
      expect(pdfStr).toContain('85.641');
      expect(pdfStr).toContain('613.8805');
      expect(pdfStr).toContain('UNAVAILABLE');
    });
  });
});
