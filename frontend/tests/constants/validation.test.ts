import { describe, it, expect } from 'vitest';
import {
  apiRequestIdSchema,
  assessmentIdQuerySchema,
  paymentTermsResponseSchema,
  headerTenantSchema,
  headerCurrencySchema,
  d1CurrencyRatesResponseSchema,
  d1CurrencyConversionResponseSchema,
  clientIngestionSetupFormSchema,
  fixCurrencyFormSchema,
  mergeVendorFormSchema,
  reassignTaxonomyFormSchema,
  proCPXFormSchema,
  dpsnxtFormSchema,
  executiveReportFormSchema,
  conversionInputsSchema,
  apiUpdateTenantPayloadSchema,
  apiAddIngestionFilePayloadSchema,
  apiUpdateValidationRecordPayloadSchema,
  apiMergeVendorPayloadSchema,
  apiDeployOpportunityPayloadSchema,
  apiCalculateConversionPayloadSchema,
  registerFormSchema,
  loginFormSchema,
  adminUserQuerySchema,
  adminUpdateUserTierSchema,
  changePasswordFormSchema,
  pcbiBenchmarkResponseSchema,
  pcbiWeeklyIndexResponseSchema,
  pcbiHistoricalObservationsQuerySchema,
  pcbiHistoricalObservationsResponseSchema,
  procurementCategoryMappingsResponseSchema,
  executiveOpportunityBriefResponseSchema,
  executiveBriefEmailRequestSchema,
  provisionSubscriptionDetailsSchema,
  provisionSubscriptionOtpSchema,
  provisionSubscriptionOtpRequestSchema,
  provisionSubscriptionRequestSchema,
  provisionSubscriptionOtpResponseSchema,
  provisionSubscriptionResponseSchema,
  INGESTION_UPLOAD_MAX_FILE_BYTES
} from '../../src/constants/validation';
import { pcbiGapResolutionRequestSchema } from '../../src/constants/orchestrationValidation';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('Frontend Validation Schemas (constants/validation.ts)', () => {
  it('accepts only bounded request IDs safe for forwarding and response headers', () => {
    expect(apiRequestIdSchema.safeParse('client_123.request-1').success).toBe(true);
    expect(apiRequestIdSchema.safeParse('invalid request id').success).toBe(false);
    expect(apiRequestIdSchema.safeParse('x'.repeat(129)).success).toBe(false);
  });

  it('trims and bounds assessment IDs before Module 2 API requests', () => {
    expect(assessmentIdQuerySchema.parse({ assessmentId: ' AIC-2026-0001 ' })).toEqual({
      assessmentId: 'AIC-2026-0001'
    });
    expect(assessmentIdQuerySchema.safeParse({ assessmentId: ' ' }).success).toBe(false);
    expect(assessmentIdQuerySchema.safeParse({ assessmentId: 'A'.repeat(121) }).success).toBe(false);
  });

  it('validates the payment-terms response envelope and required coverage metrics', () => {
    const coverageSummary = {
      assessmentId: 'AIC-2026-0002', totalSpendAnalysedInr: 100, totalSpendAnalysedCr: 1,
      verifiedSpendInr: 50, verifiedSpendCr: 0.5, missingSpendInr: 50, missingSpendCr: 0.5,
      verifiedSpendPct: 50, missingSpendPct: 50, totalRecordsCount: 2, completeRecordsCount: 1,
      partialRecordsCount: 0, missingRecordsCount: 1, recordsRequiringValidationCount: 0,
      gapReasonCounts: { FIELD_NOT_IN_SOURCE_ERP: 1 }, overallDataAvailabilityStatus: 'DATA_PARTIALLY_AVAILABLE',
      overallStatusDisplayText: 'Data partially available', reconciliationDeltaInr: 0,
      procucevModellingRatePctPer30Days: 1.5, totalWorkingCapitalReleasedCr: 0.1,
      totalFinancingBenefitCr: 0.01, totalEarlyPaymentDiscountsCr: 0
    };
    const response = {
      success: true,
      data: {
        assessmentId: 'AIC-2026-0002', coverageSummary, opportunities: [], supplierProfiles: [],
        coverageRecords: [], methodologyDisclosures: ['Verified from source records']
      }
    };
    expect(paymentTermsResponseSchema.safeParse(response).success).toBe(true);
    expect(paymentTermsResponseSchema.safeParse({ ...response, success: false }).success).toBe(false);
    expect(paymentTermsResponseSchema.safeParse({
      ...response,
      data: { ...response.data, coverageSummary: { ...coverageSummary, totalRecordsCount: -1 } }
    }).success).toBe(false);
    expect(paymentTermsResponseSchema.safeParse({
      ...response,
      data: { ...response.data, coverageRecords: [null] }
    }).success).toBe(false);
  });

  it('keeps the browser ingestion limit aligned with the Worker upload cap', () => {
    expect(INGESTION_UPLOAD_MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('validates tenant-assigned subscription provisioning details and requests', () => {
    const details = {
      tenantId: 'TNT-CUSTOMER-1', customerId: 'usr-customer-1', customerEmail: 'buyer@example.com',
      customerName: 'Buyer', companyName: 'Example Company', tier: 'GOLD', paymentReference: 'INV-100'
    };
    expect(provisionSubscriptionDetailsSchema.safeParse(details).success).toBe(true);
    const invalidEmail = provisionSubscriptionDetailsSchema.safeParse({ ...details, customerEmail: 'invalid' });
    expect(invalidEmail.success).toBe(false);
    if (!invalidEmail.success) expect(invalidEmail.error.issues[0].message).toBe(UI_STRINGS.subscription.provisionModal.inputValidation.emailInvalid);

    const otpRequest = { customer_id: details.customerId, action: 'PROVISION' };
    expect(provisionSubscriptionOtpRequestSchema.safeParse(otpRequest).success).toBe(true);
    expect(provisionSubscriptionOtpRequestSchema.safeParse({ ...otpRequest, unrecognized: true }).success).toBe(false);

    const request = {
      tenant_id: details.tenantId, customer_id: details.customerId, customer_email: details.customerEmail,
      customer_name: details.customerName, company_name: details.companyName, tier: details.tier,
      commercial_status: 'PAYMENT_RECEIVED', payment_reference: details.paymentReference,
      payment_confirmed: true, otp_session_id: 'otp-session-1', otp_code: '123456'
    };
    expect(provisionSubscriptionRequestSchema.safeParse(request).success).toBe(true);
    const invalidRequest = provisionSubscriptionRequestSchema.safeParse({ ...request, otp_code: '12x456' });
    expect(invalidRequest.success).toBe(false);
    if (!invalidRequest.success) expect(invalidRequest.error.issues[0].message).toBe(UI_STRINGS.subscription.provisionModal.inputValidation.otpInvalid);
  });

  it('validates provisioning OTP sessions and subscription response shape', () => {
    expect(provisionSubscriptionOtpSchema.safeParse({ otpSessionId: 'otp-session-1', otpCode: '123456' }).success).toBe(true);
    const invalidOtp = provisionSubscriptionOtpSchema.safeParse({ otpSessionId: '', otpCode: '12' });
    expect(invalidOtp.success).toBe(false);

    expect(provisionSubscriptionOtpResponseSchema.safeParse({ success: true, session_id: 'otp-session-1' }).success).toBe(true);
    expect(provisionSubscriptionOtpResponseSchema.safeParse({ success: false, session_id: '' }).success).toBe(false);

    const subscription = {
      id: 'sub-1', tenant_id: 'TNT-CUSTOMER-1', customer_id: 'usr-customer-1', customer_email: 'buyer@example.com',
      customer_name: 'Buyer', company_name: 'Example Company', tier: 'GOLD', status: 'ACTIVE',
      commercial_status: 'COMPLETED', payment_confirmed: true, start_date: '2026-11-04T00:00:00.000Z',
      end_date: '2027-11-04T00:00:00.000Z', created_at: '2026-11-04T00:00:00.000Z', updated_at: '2026-11-04T00:00:00.000Z'
    };
    expect(provisionSubscriptionResponseSchema.safeParse({ success: true, subscription }).success).toBe(true);
    expect(provisionSubscriptionResponseSchema.safeParse({ success: true, subscription: { ...subscription, tenant_id: '' } }).success).toBe(false);
  });

  it('validates D1 FX catalogs and historical conversion responses', () => {
    const rates = {
      success: true,
      data: { JPY: { currencyCode: 'JPY', name: 'Japanese Yen', currentRate: 0.58, lastUpdated: '2026-10-30' } }
    };
    const conversion = {
      success: true,
      data: { amount: 500, fromCurrency: 'JPY', amountINR: 290, exchangeRate: 0.58, rateDate: '2026-10-30' }
    };
    expect(d1CurrencyRatesResponseSchema.safeParse(rates).success).toBe(true);
    expect(d1CurrencyRatesResponseSchema.safeParse({ ...rates, data: { JPY: { ...rates.data.JPY, currentRate: '0.58' } } }).success).toBe(false);
    expect(d1CurrencyConversionResponseSchema.safeParse(conversion).success).toBe(true);
    expect(d1CurrencyConversionResponseSchema.safeParse({ ...conversion, data: { ...conversion.data, exchangeRate: 0 } }).success).toBe(false);
  });
  it('validates D1-backed executive opportunity brief report payloads', () => {
    const valid = {
      success: true,
      data: {
        tenant: { tenantId: 'T1', enterpriseName: 'D1 Enterprise' },
        dataClassification: 'CUSTOMER_DATA',
        generatedAt: '2026-10-30T00:00:00.000Z',
        scopeDescription: 'D1 report scope',
        metrics: {
          transactionCount: 1, totalSpendCr: 2, supplierCount: 1, materialCount: 1, plantCount: 1,
          purchaseOrderCount: 1, firstTransactionDate: null, lastTransactionDate: null,
          opportunityCount: 0, estimatedSavingsCr: 0, averageConfidence: 0
        },
        opportunities: [], levers: [], statuses: [], risks: []
      }
    };
    expect(executiveOpportunityBriefResponseSchema.safeParse(valid).success).toBe(true);
    expect(executiveOpportunityBriefResponseSchema.safeParse({ ...valid, success: false }).success).toBe(false);
    expect(executiveOpportunityBriefResponseSchema.safeParse({
      ...valid,
      data: { ...valid.data, dataClassification: 'UNREVIEWED' }
    }).success).toBe(false);
    expect(executiveOpportunityBriefResponseSchema.safeParse({
      ...valid,
      data: { ...valid.data, metrics: { ...valid.data.metrics, totalSpendCr: '2' } }
    }).success).toBe(false);
  });

  it('validates mapped, excluded, research, and classification-only PCBI resolutions', () => {
    const validRequests = [
      { action: 'MAP_EXISTING', targetPcbiSeries: 'PCBI-1' },
      { action: 'ADD_MAP_PCBI', targetPcbiSeries: 'PCBI-1' },
      { action: 'EXCLUDE', exclusionReason: 'OTHER', exclusionNotes: 'No reliable benchmark data' },
      { action: 'MARK_NOT_BENCHMARKABLE' },
      { action: 'MARK_SERVICE' },
      { action: 'REQUEST_RESEARCH', researchNotes: 'Confirm local benchmark series' }
    ];
    for (const request of validRequests) expect(pcbiGapResolutionRequestSchema.safeParse(request).success).toBe(true);
  });

  it('rejects incomplete PCBI mapping or exclusions, unsupported actions, and oversized notes', () => {
    const invalidRequests = [
      { action: 'MAP_EXISTING' },
      { action: 'EXCLUDE' },
      { action: 'EXCLUDE', exclusionReason: 'OTHER' },
      { action: 'REQUEST_RESEARCH', researchNotes: 'x'.repeat(2001) },
      { action: 'UNKNOWN' }
    ];
    for (const request of invalidRequests) expect(pcbiGapResolutionRequestSchema.safeParse(request).success).toBe(false);
  });

  it('validates persisted PCBI benchmark and weekly index API records', () => {
    expect(pcbiBenchmarkResponseSchema.safeParse([{
      pcbi_id: 'PCBI-TEST', benchmark_name: 'Benchmark', benchmark_unit: 'MT', currency: 'INR'
    }]).success).toBe(true);
    expect(pcbiBenchmarkResponseSchema.safeParse([{ pcbi_id: '', benchmark_name: '', benchmark_unit: '', currency: '' }]).success).toBe(false);
    expect(pcbiWeeklyIndexResponseSchema.safeParse([{
      pcbi_id: 'PCBI-TEST', week_start: '2026-01-05', index_value: 100, unit: 'MT', currency: 'INR'
    }]).success).toBe(true);
    expect(pcbiWeeklyIndexResponseSchema.safeParse([{
      pcbi_id: 'PCBI-TEST', week_start: '', index_value: Number.NaN
    }]).success).toBe(false);
  });

  it('validates archived PCBI query filters and keeps monthly observations explicitly archive-only', () => {
    expect(pcbiHistoricalObservationsQuerySchema.parse({})).toEqual({ limit: 100 });
    expect(pcbiHistoricalObservationsQuerySchema.safeParse({
      pcbiId: ' PCBI-TEST ', startDate: '2021-01-01', endDate: '2021-12-31', limit: 500
    }).success).toBe(true);
    expect(pcbiHistoricalObservationsQuerySchema.safeParse({ startDate: '2022-01-01', endDate: '2021-01-01' }).success).toBe(false);
    expect(pcbiHistoricalObservationsQuerySchema.safeParse({ startDate: 'bad-date' }).success).toBe(false);
    expect(pcbiHistoricalObservationsQuerySchema.safeParse({ limit: 501 }).success).toBe(false);
    expect(pcbiHistoricalObservationsQuerySchema.safeParse({ limit: 0 }).success).toBe(false);

    const valid = {
      success: true,
      data: {
        archiveOnly: true,
        frequency: 'MONTHLY',
        count: 1,
        observations: [{
          pcbi_id: 'PCBI-TEST', observation_date: '2021-04-01', value_inr: 695420,
          original_value: 9320, original_currency: 'USD', fx_rate: 74.6159,
          unit: 'INR/MT', source: 'LME/JPC', status: 'VALIDATED', observation_frequency: 'MONTHLY'
        }]
      }
    };
    expect(pcbiHistoricalObservationsResponseSchema.safeParse(valid).success).toBe(true);
    expect(pcbiHistoricalObservationsResponseSchema.safeParse({
      ...valid, data: { ...valid.data, archiveOnly: false }
    }).success).toBe(false);
    expect(pcbiHistoricalObservationsResponseSchema.safeParse({
      ...valid, data: { ...valid.data, observations: [{ ...valid.data.observations[0], fx_rate: 0 }] }
    }).success).toBe(false);
    expect(pcbiHistoricalObservationsResponseSchema.safeParse({
      ...valid, data: { ...valid.data, count: 0 }
    }).success).toBe(false);
  });

  it('validates procurement category mapping data from D1', () => {
    expect(procurementCategoryMappingsResponseSchema.parse({
      success: true,
      data: { mappings: { P11: 'Packing' }, categories: ['Packing'] }
    }).data.mappings).toEqual({ P11: 'Packing' });
    expect(procurementCategoryMappingsResponseSchema.safeParse({
      success: true,
      data: { mappings: { P11: 12 }, categories: ['Packing'] }
    }).success).toBe(false);
    expect(procurementCategoryMappingsResponseSchema.safeParse({
      success: true,
      data: { mappings: {}, categories: [''] }
    }).success).toBe(false);
  });

  describe('headerTenantSchema', () => {
    it('should validate non-empty tenant ID', () => {
      expect(headerTenantSchema.safeParse({ tenantId: 'TENANT-1' }).success).toBe(true);
    });

    it('should reject empty or missing tenantId', () => {
      expect(headerTenantSchema.safeParse({ tenantId: '' }).success).toBe(false);
      expect(headerTenantSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('headerCurrencySchema', () => {
    it('should validate supported currencies', () => {
      expect(headerCurrencySchema.safeParse({ currency: 'INR' }).success).toBe(true);
      expect(headerCurrencySchema.safeParse({ currency: 'USD' }).success).toBe(true);
      expect(headerCurrencySchema.safeParse({ currency: 'EUR' }).success).toBe(true);
      expect(headerCurrencySchema.safeParse({ currency: 'GBP' }).success).toBe(true);
    });

    it('should reject unsupported currencies', () => {
      expect(headerCurrencySchema.safeParse({ currency: 'XYZ' }).success).toBe(false);
    });
  });

  describe('clientIngestionSetupFormSchema', () => {
    it('should validate valid client setup form with or without sector overrides', () => {
      const valid = {
        clientName: 'Apex Enterprise',
        datasetType: 'Purchase History',
        spendPeriod: '36 Months Historical (FY23 - FY26)',
        currency: 'INR',
        region: 'GLOBAL',
        estimatedSpend: 1000000,
        majorSector: 'Chemical & Petrochemicals',
        minorSector: 'Specialty Chemicals'
      };
      const parsed = clientIngestionSetupFormSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.majorSector).toBe('Chemical & Petrochemicals');
        expect(parsed.data.minorSector).toBe('Specialty Chemicals');
      }

      // Default fallback
      const withoutSector = {
        clientName: 'Apex Enterprise',
        datasetType: 'Purchase History',
        spendPeriod: '36 Months Historical (FY23 - FY26)',
        currency: 'INR',
        region: 'GLOBAL',
        estimatedSpend: 1000000
      };
      const parsedDefault = clientIngestionSetupFormSchema.safeParse(withoutSector);
      expect(parsedDefault.success).toBe(true);
      if (parsedDefault.success) {
        expect(parsedDefault.data.majorSector).toBe('Chemical & Petrochemicals');
        expect(parsedDefault.data.minorSector).toBe('Specialty Chemicals');
      }
    });

    it('should reject missing or negative fields', () => {
      expect(clientIngestionSetupFormSchema.safeParse({ clientName: '' }).success).toBe(false);
      expect(clientIngestionSetupFormSchema.safeParse({
        clientName: 'Test',
        datasetType: 'Purchase History',
        spendPeriod: 'FY24',
        currency: 'INR',
        region: 'GLOBAL',
        estimatedSpend: -500
      }).success).toBe(false);
    });
  });

  describe('fixCurrencyFormSchema', () => {
    it('should validate valid currency fix input', () => {
      const valid = {
        recordId: 'REC-123',
        selectedCurrency: 'USD',
        convertedAmountINR: 838000
      };
      expect(fixCurrencyFormSchema.safeParse(valid).success).toBe(true);
      expect(fixCurrencyFormSchema.safeParse({ ...valid, selectedCurrency: 'JPY' }).success).toBe(true);
    });

    it('should reject empty recordId or non-positive amount', () => {
      expect(fixCurrencyFormSchema.safeParse({ recordId: '', selectedCurrency: 'USD', convertedAmountINR: 100 }).success).toBe(false);
      expect(fixCurrencyFormSchema.safeParse({ recordId: 'REC-1', selectedCurrency: 'USD', convertedAmountINR: 0 }).success).toBe(false);
      expect(fixCurrencyFormSchema.safeParse({ recordId: 'REC-1', selectedCurrency: 'EURO', convertedAmountINR: 100 }).success).toBe(false);
    });
  });

  describe('mergeVendorFormSchema', () => {
    it('should validate valid vendor merge input', () => {
      const valid = {
        recordId: 'REC-123',
        masterVendorId: 'VEND-001',
        masterVendorName: 'Tata Steel Global'
      };
      expect(mergeVendorFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject missing master fields', () => {
      expect(mergeVendorFormSchema.safeParse({ recordId: 'REC-1', masterVendorId: '', masterVendorName: '' }).success).toBe(false);
    });
  });

  describe('reassignTaxonomyFormSchema', () => {
    it('should validate valid taxonomy reassignment', () => {
      const valid = {
        mappingId: 'MAP-101',
        newCode: '41112400',
        newName: 'Direct Materials (Industrial Bearings)',
        bucket: 'Direct Materials'
      };
      expect(reassignTaxonomyFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty code or title', () => {
      expect(reassignTaxonomyFormSchema.safeParse({ mappingId: 'M1', newCode: '', newName: '', bucket: '' }).success).toBe(false);
    });
  });

  describe('proCPXFormSchema', () => {
    it('should validate valid ProCPX parameters', () => {
      const valid = {
        oppId: 'OPP-001',
        eventType: 'Reverse Auction',
        baselineSpendCr: 12.5,
        targetSavingsPct: 15.0,
        invitedSuppliers: ['Supplier A', 'Supplier B'],
        auctionEndDate: '2026-10-01'
      };
      expect(proCPXFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty suppliers list or invalid eventType', () => {
      expect(proCPXFormSchema.safeParse({
        oppId: 'OPP-1',
        eventType: 'InvalidType',
        baselineSpendCr: 10,
        targetSavingsPct: 10,
        invitedSuppliers: [],
        auctionEndDate: '2026-10-01'
      }).success).toBe(false);
    });
  });

  describe('dpsnxtFormSchema', () => {
    it('should validate valid DPS NXT configuration', () => {
      const valid = {
        oppId: 'OPP-002',
        indexPegging: 'WPI Metal Index (Monthly)',
        contractTermMonths: 36,
        maxPriceCreepCapPct: 3.5,
        rateCardCurrency: 'INR'
      };
      expect(dpsnxtFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject non-positive contractTermMonths or invalid percentage', () => {
      expect(dpsnxtFormSchema.safeParse({
        oppId: 'OPP-1',
        indexPegging: 'Index',
        contractTermMonths: -12,
        maxPriceCreepCapPct: 150,
        rateCardCurrency: 'INR'
      }).success).toBe(false);
    });
  });

  describe('executiveReportFormSchema', () => {
    it('should validate valid report configuration', () => {
      const valid = {
        reportTitle: 'Executive Procurement Audit',
        audience: 'C-Suite & Board',
        dateRange: 'FY23-FY26',
        format: 'pdf'
      };
      expect(executiveReportFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject unsupported format', () => {
      expect(executiveReportFormSchema.safeParse({
        reportTitle: 'Report',
        audience: 'Team',
        dateRange: 'FY24',
        format: 'txt'
      }).success).toBe(false);
    });
  });

  describe('conversionInputsSchema', () => {
    it('should validate positive annual spend and valid rates', () => {
      const valid = {
        annualSpendCr: 732.41,
        savingsRate: 16.4,
        saasFeeRate: 0.85
      };
      expect(conversionInputsSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject negative rates', () => {
      expect(conversionInputsSchema.safeParse({
        annualSpendCr: 100,
        savingsRate: -5,
        saasFeeRate: 0.85
      }).success).toBe(false);
    });
  });

  it('validates the email-only request contract so business figures stay on the D1 Worker', () => {
    expect(executiveBriefEmailRequestSchema.safeParse({ buyerEmail: 'buyer@example.test' }).success).toBe(true);
    expect(executiveBriefEmailRequestSchema.safeParse({ buyerEmail: 'invalid' }).success).toBe(false);
    expect(executiveBriefEmailRequestSchema.safeParse({
      buyerEmail: 'buyer@example.test',
      totalSpendInrCr: 123
    }).success).toBe(false);
  });

  describe('API Outgoing Schemas', () => {
    it('should validate updateTenant payload', () => {
      expect(apiUpdateTenantPayloadSchema.safeParse({ enterprise_name: 'Corp' }).success).toBe(true);
      expect(apiUpdateTenantPayloadSchema.safeParse({ financial_year: 'FY25-26' }).success).toBe(false);
      expect(apiUpdateTenantPayloadSchema.safeParse({ base_currency: 'INVALID' }).success).toBe(false);
      expect(apiUpdateTenantPayloadSchema.safeParse({}).success).toBe(false);
    });

    it('should validate addIngestionFile payload', () => {
      expect(apiAddIngestionFilePayloadSchema.safeParse({
        file_name: 'spend.xlsx',
        file_type: 'Excel',
        file_size_mb: 2.5
      }).success).toBe(true);
    });

    it('should validate updateValidationRecord payload', () => {
      expect(apiUpdateValidationRecordPayloadSchema.safeParse({
        record_id: 'REC-1',
        resolved: true
      }).success).toBe(true);
    });

    it('should validate mergeVendor payload', () => {
      expect(apiMergeVendorPayloadSchema.safeParse({
        targetName: 'Old Corp',
        masterId: 'M-1',
        canonicalName: 'New Corp'
      }).success).toBe(true);
    });

    it('should validate deployOpportunity payload', () => {
      expect(apiDeployOpportunityPayloadSchema.safeParse({
        opp_id: 'OPP-1',
        targetModule: 'proCPX'
      }).success).toBe(true);
    });

    it('should validate calculateConversion payload', () => {
      expect(apiCalculateConversionPayloadSchema.safeParse({
        annualSpendCr: 100,
        savingsRate: 10,
        saasFeeRate: 1
      }).success).toBe(true);
    });
  });

  describe('Auth & Subscription Tier Schemas', () => {
    it('should validate registerFormSchema', () => {
      const valid = {
        name: 'John Enterprise',
        mobile_number: '+91 99999 12345',
        email: 'john@enterprise.com',
        company_name: 'Enterprise Inc',
        company_address: '100 Main St, Bangalore',
        password: 'SecurePassword123'
      };
      expect(registerFormSchema.safeParse(valid).success).toBe(true);
      expect(registerFormSchema.safeParse({ ...valid, email: 'invalid-email' }).success).toBe(false);
      expect(registerFormSchema.safeParse({ ...valid, password: '123' }).success).toBe(false);
    });

    it('should validate loginFormSchema', () => {
      expect(loginFormSchema.safeParse({ email: 'john@enterprise.com', password: 'password123' }).success).toBe(true);
      expect(loginFormSchema.safeParse({ email: 'notanemail', password: 'pass' }).success).toBe(false);
      expect(loginFormSchema.safeParse({ email: 'john@enterprise.com', password: '' }).success).toBe(false);
    });

    it('should validate adminUserQuerySchema with and without tier', () => {
      expect(adminUserQuerySchema.safeParse({ search: 'john', role: 'USER', status: 'ACTIVE', tier: 'SILVER' }).success).toBe(true);
      expect(adminUserQuerySchema.safeParse({ tier: 'ALL' }).success).toBe(true);
      expect(adminUserQuerySchema.safeParse({ tier: 'GOLD' }).success).toBe(true);
      expect(adminUserQuerySchema.safeParse({ tier: 'BRONZE' }).success).toBe(true);
      expect(adminUserQuerySchema.safeParse({ tier: 'INVALID' }).success).toBe(false);
    });

    it('should validate adminUpdateUserTierSchema', () => {
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'BRONZE' }).success).toBe(true);
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'SILVER' }).success).toBe(true);
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'GOLD' }).success).toBe(true);
      expect(adminUpdateUserTierSchema.safeParse({ tier: 'DIAMOND' }).success).toBe(false);
      expect(adminUpdateUserTierSchema.safeParse({}).success).toBe(false);
    });

    it('should validate changePasswordFormSchema when passwords match', () => {
      const valid = {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
        confirmPassword: 'NewPass@456'
      };
      expect(changePasswordFormSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject changePasswordFormSchema when passwords do not match (refine function)', () => {
      const mismatch = {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
        confirmPassword: 'DifferentPass@789'
      };
      const result = changePasswordFormSchema.safeParse(mismatch);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.confirmPassword).toBeDefined();
        expect(errors.fieldErrors.confirmPassword?.[0]).toBe('New passwords do not match');
      }
    });
  });
});
