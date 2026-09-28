/**
 * Strategic Sourcing Opportunity Engine (Module 2B - Master Product Spec Prompt 100)
 * 
 * Implements the 8 mandatory Strategic Sourcing Opportunity Engines:
 * 1. Vendor Consolidation
 * 2. PO Consolidation
 * 3. E-Auction / Competitive Sourcing
 * 4. Rate Contract
 * 5. Specification Rationalization
 * 6. Demand Consolidation
 * 7. New Vendor Development
 * 8. Alternate Material / Make-Buy (marked as OPPORTUNITY REQUIRING VALIDATION)
 */

import type {
  StrategicInputTransaction,
  StrategicSourcingResult,
  VendorConsolidationOpportunityDetails,
  PoConsolidationOpportunityDetails,
  EAuctionOpportunityDetails,
  RateContractOpportunityDetails,
  SpecificationRationalizationDetails,
  DemandConsolidationDetails,
  NewVendorDevelopmentDetails,
  AlternateMaterialDetails
} from '../types/strategicSourcing';
import type { SavingsOpportunityItem } from '../types/savings';
import { logger } from '../utils/logger';
import {
  runVendorConsolidation,
  runPoConsolidation
} from './strategicSourcingEnginesA';
import {
  runEAuction,
  runRateContracts
} from './strategicSourcingContracts';
import {
  runSpecRationalization,
  runDemandConsolidation,
  runNewVendorDevelopment,
  runAlternateMaterials
} from './strategicSourcingEnginesB';

export class StrategicSourcingEngine {
  /**
   * Run all 8 Strategic Sourcing engines across customer purchase transactions
   */
  public analyzeAll(transactions: StrategicInputTransaction[] = []): StrategicSourcingResult {
    const startTime = Date.now();
    logger.info('Starting Strategic Sourcing Analysis across transactions', {
      transactionCount: transactions.length
    });

    if (!transactions || transactions.length === 0) {
      return {
        opportunities: [],
        vendorConsolidationDetails: [],
        poConsolidationDetails: [],
        eauctionDetails: [],
        rateContractDetails: [],
        specificationRationalizationDetails: [],
        demandConsolidationDetails: [],
        newVendorDevelopmentDetails: [],
        alternateMaterialDetails: [],
        summary: {
          total_strategic_opportunities_count: 0,
          total_potential_savings_inr: 0,
          total_potential_savings_inr_cr: 0,
          spend_analyzed_inr: 0,
          spend_analyzed_inr_cr: 0
        }
      };
    }

    const totalSpend = transactions.reduce((acc, t) => acc + (t.total_spend_inr || 0), 0);

    const vendorConsol = this.analyzeVendorConsolidation(transactions);
    const poConsol = this.analyzePoConsolidation(transactions);
    const eauction = this.analyzeEAuction(transactions);
    const rateContract = this.analyzeRateContracts(transactions);
    const specRationalization = this.analyzeSpecRationalization(transactions);
    const demandConsol = this.analyzeDemandConsolidation(transactions);
    const newVendorDev = this.analyzeNewVendorDevelopment(transactions);
    const alternateMat = this.analyzeAlternateMaterials(transactions);

    const allOpportunities: SavingsOpportunityItem[] = [
      ...vendorConsol.opportunities,
      ...poConsol.opportunities,
      ...eauction.opportunities,
      ...rateContract.opportunities,
      ...specRationalization.opportunities,
      ...demandConsol.opportunities,
      ...newVendorDev.opportunities,
      ...alternateMat.opportunities
    ];

    const totalSavings = allOpportunities.reduce((acc, o) => acc + o.potential_savings_inr, 0);

    logger.info('Completed Strategic Sourcing Analysis', {
      durationMs: Date.now() - startTime,
      opportunitiesCount: allOpportunities.length,
      totalSavingsInr: totalSavings
    });

    return {
      opportunities: allOpportunities,
      vendorConsolidationDetails: vendorConsol.details,
      poConsolidationDetails: poConsol.details,
      eauctionDetails: eauction.details,
      rateContractDetails: rateContract.details,
      specificationRationalizationDetails: specRationalization.details,
      demandConsolidationDetails: demandConsol.details,
      newVendorDevelopmentDetails: newVendorDev.details,
      alternateMaterialDetails: alternateMat.details,
      summary: {
        total_strategic_opportunities_count: allOpportunities.length,
        total_potential_savings_inr: totalSavings,
        total_potential_savings_inr_cr: Math.round((totalSavings / 10000000) * 1000) / 1000,
        spend_analyzed_inr: totalSpend,
        spend_analyzed_inr_cr: Math.round((totalSpend / 10000000) * 1000) / 1000
      }
    };
  }

  public analyzeVendorConsolidation(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: VendorConsolidationOpportunityDetails[];
  } {
    return runVendorConsolidation(transactions);
  }

  public analyzePoConsolidation(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: PoConsolidationOpportunityDetails[];
  } {
    return runPoConsolidation(transactions);
  }

  public analyzeEAuction(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: EAuctionOpportunityDetails[];
  } {
    return runEAuction(transactions);
  }

  public analyzeRateContracts(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: RateContractOpportunityDetails[];
  } {
    return runRateContracts(transactions);
  }

  public analyzeSpecRationalization(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: SpecificationRationalizationDetails[];
  } {
    return runSpecRationalization(transactions);
  }

  public analyzeDemandConsolidation(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: DemandConsolidationDetails[];
  } {
    return runDemandConsolidation(transactions);
  }

  public analyzeNewVendorDevelopment(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: NewVendorDevelopmentDetails[];
  } {
    return runNewVendorDevelopment(transactions);
  }

  public analyzeAlternateMaterials(transactions: StrategicInputTransaction[]): {
    opportunities: SavingsOpportunityItem[];
    details: AlternateMaterialDetails[];
  } {
    return runAlternateMaterials(transactions);
  }
}
