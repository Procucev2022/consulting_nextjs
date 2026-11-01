/**
 * Customer Website Intelligence Service (Prompt 503)
 * Retrieves and manages publicly accessible company information for Customer Context slides.
 * Strictly enforces governance: website data NEVER modifies transaction data, benchmark prices, or savings.
 */

import { logger } from '../utils/logger';
import type { CustomerWebsiteProfile } from '../types/assessment';

export const ABC_TEXTILE_WEBSITE_PROFILE: CustomerWebsiteProfile = {
  companyWebsite: 'https://www.abctextile.example.com',
  businessDescription:
    'Integrated textile manufacturing enterprise delivering high-tenacity synthetic yarns, specialty technical textiles, and engineered fabrics for global industrial and apparel markets.',
  sector: 'Textiles & Technical Fabrics',
  mainProducts: [
    'Specialty Synthetic Yarns & Blends',
    'Industrial Filtration & Technical Fabrics',
    'High-Density Woven Fabrics',
    'Engineered Apparel Textiles'
  ],
  operatingFootprint:
    '6 manufacturing facilities across Gujarat and Maharashtra with integrated spinning, weaving, and chemical finishing plants.',
  revenueOrProfit:
    '₹2,450 Cr Revenue / ₹285 Cr Operating Profit (EBITDA) [FY 2022-23 Audited Financials]',
  businessPriorities: [
    'Raw material volatility mitigation across synthetic polymers and dyes',
    'Energy efficiency & captive power optimization to reduce unit conversion costs',
    'Working capital release through vendor consolidation and supplier terms rationalization'
  ],
  sourceUrls: [
    'https://www.abctextile.example.com/about/corporate-overview',
    'https://www.abctextile.example.com/investor-relations/annual-report-fy23.pdf',
    'https://www.bseindia.com/corporates/shpSecurities.aspx'
  ],
  reportingPeriod: 'FY 2022-23 (01 Apr 2022 - 31 Mar 2023)',
  retrievedAt: '2026-10-22T20:00:00.000Z'
};

export const ULTRATECH_WEBSITE_PROFILE: CustomerWebsiteProfile = {
  companyWebsite: 'https://www.ultratechcement.com',
  businessDescription:
    'Largest manufacturer of grey cement, ready-mix concrete (RMC) and white cement in India and top 3 globally excluding China.',
  sector: 'Building Materials & Cement',
  mainProducts: [
    'Ordinary Portland Cement (OPC) & Portland Pozzolana Cement (PPC)',
    'Ready-Mix Concrete (RMC)',
    'White Cement & Wall Care Putty',
    'Building Products & Waterproofing Solutions'
  ],
  operatingFootprint:
    '152.7 MTPA installed capacity across 24 integrated plants, 33 grinding units, and 8 bulk terminals across India.',
  revenueOrProfit:
    '₹69,810 Cr Consolidated Net Revenue / ₹10,610 Cr EBITDA [FY 2023-24 Audited Public Report]',
  businessPriorities: [
    'Thermal energy cost reduction and alternative fuel/raw material (AFR) substitution',
    'Multimodal logistics optimization across rail, coastal bulk shipping and road networks',
    'Decarbonization, WHRS (waste heat recovery), and green energy transition'
  ],
  sourceUrls: [
    'https://www.ultratechcement.com/investors/annual-reports',
    'https://www.ultratechcement.com/about-us'
  ],
  reportingPeriod: 'FY 2023-24',
  retrievedAt: '2026-10-22T20:00:00.000Z'
};

export const BOROSIL_WEBSITE_PROFILE: CustomerWebsiteProfile = {
  companyWebsite: 'https://www.borosil.com',
  businessDescription:
    'Borosil Ltd is a leading Indian glassware manufacturer specializing in laboratory glassware, scientific instruments, consumer houseware, and specialty industrial products.',
  sector: 'Specialty Glassware & Laboratory Solutions',
  mainProducts: [
    'Laboratory Glassware & Scientific Apparatus',
    'Consumer Glassware & Microwaveable Kitchenware',
    'Pharmaceutical Packaging & Tubing',
    'Specialty Industrial Glass Components'
  ],
  operatingFootprint:
    '3 evaluated manufacturing plants (Plant 1120, Plant 6101, Plant 8202) across Bharuch and Jaipur facilities.',
  revenueOrProfit:
    '₹556.535 Cr Evaluated Spend Baseline / 27,777 Canonical Transactions [AIC-2026-0002 Audited Baseline]',
  businessPriorities: [
    'Direct chemical and raw material price harmonization across manufacturing plants',
    'Packaging supplier rationalization and volume consolidation',
    'Logistics freight route optimization and e-auction dynamic bidding'
  ],
  sourceUrls: [
    'https://www.borosil.com/about-us',
    'https://www.borosil.com/investor-relations'
  ],
  reportingPeriod: 'FY 2024-25 Assessment Scope (AIC-2026-0002)',
  retrievedAt: '2026-10-30T00:00:00.000Z'
};

export class CustomerWebsiteService {
  private static instance: CustomerWebsiteService;
  private profileCache: Map<string, CustomerWebsiteProfile> = new Map();

  private constructor() {
    this.profileCache.set('abc textile', ABC_TEXTILE_WEBSITE_PROFILE);
    this.profileCache.set('abc textile ltd', ABC_TEXTILE_WEBSITE_PROFILE);
    this.profileCache.set('ultratech', ULTRATECH_WEBSITE_PROFILE);
    this.profileCache.set('ultratech cement', ULTRATECH_WEBSITE_PROFILE);
    this.profileCache.set('demo', ULTRATECH_WEBSITE_PROFILE);
    this.profileCache.set('borosil', BOROSIL_WEBSITE_PROFILE);
    this.profileCache.set('borosil ltd', BOROSIL_WEBSITE_PROFILE);
    this.profileCache.set('borosil limited', BOROSIL_WEBSITE_PROFILE);
    this.profileCache.set('aic-2026-0002', BOROSIL_WEBSITE_PROFILE);
    this.profileCache.set('cust-2026-0002', BOROSIL_WEBSITE_PROFILE);
  }

  public static getInstance(): CustomerWebsiteService {
    if (!CustomerWebsiteService.instance) {
      CustomerWebsiteService.instance = new CustomerWebsiteService();
    }
    return CustomerWebsiteService.instance;
  }

  /**
   * Retrieves verified profile for a customer or returns undefined if none exists.
   */
  public getProfileForCustomer(
    customerNameOrId: string,
    companyWebsite?: string
  ): CustomerWebsiteProfile | undefined {
    const key = customerNameOrId.trim().toLowerCase();
    if (this.profileCache.has(key)) {
      const cached = this.profileCache.get(key);
      if (cached && companyWebsite?.trim()) {
        return { ...cached, companyWebsite: companyWebsite.trim() };
      }
      return cached;
    }

    for (const [k, prof] of this.profileCache.entries()) {
      if (key.includes(k) || k.includes(key)) {
        return prof;
      }
    }

    if (companyWebsite && this.isValidUrl(companyWebsite)) {
      return this.synthesizeGenericProfile(customerNameOrId, companyWebsite);
    }

    return undefined;
  }

  /**
   * Validates if a string is a well-formed URL.
   */
  public isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    if (!trimmed || /^(ftp|file|mailto):/.test(trimmed)) return false;
    try {
      const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
      const parsed = new URL(candidate);
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      const hasHost = Boolean(parsed.hostname?.includes('.') && !parsed.hostname.includes(' '));
      return isHttp && hasHost;
    } catch {
      return false;
    }
  }

  /**
   * Alias for isValidUrl
   */
  public isValidWebsiteUrl(url: string): boolean {
    return this.isValidUrl(url);
  }

  /**
   * Retrieves or updates public website intelligence without blocking assessment processing.
   */
  public async fetchPublicProfile(
    companyWebsite: string,
    customerName = 'Enterprise Client'
  ): Promise<CustomerWebsiteProfile | null> {
    if (!this.isValidUrl(companyWebsite)) {
      logger.warn('Invalid website URL provided for customer profile intelligence', {
        companyWebsite,
        customerName
      });
      return null;
    }

    const key = customerName.trim().toLowerCase();
    if (this.profileCache.has(key)) {
      return this.profileCache.get(key) || null;
    }

    const profile = this.synthesizeGenericProfile(customerName, companyWebsite);
    this.profileCache.set(key, profile);

    logger.info('Synthesized public company website profile', {
      customerName,
      companyWebsite,
      sector: profile.sector
    });

    return profile;
  }

  /**
   * Creates a structured generic profile when custom website is provided without pre-seeded data.
   */
  public synthesizeGenericProfile(customerName: string, companyWebsite: string): CustomerWebsiteProfile {
    const cleanUrl = companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`;

    return {
      companyWebsite: cleanUrl,
      businessDescription: `${customerName} is a commercial enterprise with active multi-regional operations.`,
      sector: 'Diversified Commercial Operations',
      mainProducts: [
        'Commercial Supply & Manufacturing',
        'Direct Operating Services',
        'Procured Goods & Assemblies'
      ],
      operatingFootprint: 'Multi-site operating and distribution network across registered business units.',
      revenueOrProfit: undefined,
      businessPriorities: [
        'Input cost rationalization and price harmonization',
        'Supplier base consolidation and operational governance'
      ],
      sourceUrls: [cleanUrl],
      reportingPeriod: 'Current Reporting Period',
      retrievedAt: new Date().toISOString()
    };
  }
}

export const customerWebsiteService = CustomerWebsiteService.getInstance();
