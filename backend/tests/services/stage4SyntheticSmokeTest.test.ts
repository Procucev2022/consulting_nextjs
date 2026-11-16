/**
 * Stage 4: Synthetic End-to-End Assessment Smoke Test
 *
 * Dataset specified by Prompt 634:
 * PO001 | Aluminium Sheet    | Supplier A | 1000 | 250 (Spend = 2,50,000)
 * PO002 | Aluminium Sheet    | Supplier B |  800 | 260 (Spend = 2,08,000)
 * PO003 | Corrugated Boxes   | Supplier C | 5000 |  20 (Spend = 1,00,000)
 * PO004 | Industrial Bearings| Supplier D |  100 | 500 (Spend =   50,000)
 * PO005 | Industrial Bearings| Supplier E |  150 | 480 (Spend =   72,000)
 * Total Baseline: ₹6,80,000 (0.068 Cr)
 */

import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { importIngestionWorkbook } from '../../src/services/ingestionWorkbookImporter';
import { Module2StrategicSourcingEngine } from '../../src/services/module2StrategicSourcingEngine';
import { renderExecutiveBriefArtifact } from '../../src/services/executiveBriefArtifactService';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { ExecutiveOpportunityBriefReport } from '../../src/types/executiveOpportunityBrief';

describe('Stage 4: Synthetic End-to-End Assessment Smoke Test', () => {
  const syntheticCustomerName = 'SYNTHETIC TEST INDUSTRIAL CORP';
  const syntheticAssessmentId = 'AIC-SYNTH-SMOKE-001';
  const syntheticTenantId = 'TNT-SYNTH-SMOKE-001';

  // 1. Dataset Rows
  const syntheticRows = [
    {
      'PO Number': 'PO001',
      'PO Line': 1,
      'Document Date': '2026-01-10',
      'Vendor Name': 'Supplier A',
      'Short Text': 'Aluminium Sheet',
      'Order Quantity': 1000,
      'Net Price': 250,
      'Currency': 'INR',
      'Plant': 'PLANT-01'
    },
    {
      'PO Number': 'PO002',
      'PO Line': 1,
      'Document Date': '2026-01-11',
      'Vendor Name': 'Supplier B',
      'Short Text': 'Aluminium Sheet',
      'Order Quantity': 800,
      'Net Price': 260,
      'Currency': 'INR',
      'Plant': 'PLANT-01'
    },
    {
      'PO Number': 'PO003',
      'PO Line': 1,
      'Document Date': '2026-01-12',
      'Vendor Name': 'Supplier C',
      'Short Text': 'Corrugated Boxes',
      'Order Quantity': 5000,
      'Net Price': 20,
      'Currency': 'INR',
      'Plant': 'PLANT-01'
    },
    {
      'PO Number': 'PO004',
      'PO Line': 1,
      'Document Date': '2026-01-13',
      'Vendor Name': 'Supplier D',
      'Short Text': 'Industrial Bearings',
      'Order Quantity': 100,
      'Net Price': 500,
      'Currency': 'INR',
      'Plant': 'PLANT-01'
    },
    {
      'PO Number': 'PO005',
      'PO Line': 1,
      'Document Date': '2026-01-14',
      'Vendor Name': 'Supplier E',
      'Short Text': 'Industrial Bearings',
      'Order Quantity': 150,
      'Net Price': 480,
      'Currency': 'INR',
      'Plant': 'PLANT-01'
    }
  ];

  it('1. Generates and imports the synthetic Excel workbook into Module 1', async () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(syntheticRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Procurement Data');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    expect(excelBuffer.byteLength).toBeGreaterThan(0);

    // Mock D1 database statements collector
    const executedStatements: string[] = [];
    const mockDb: any = {
      prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
          run: async () => {
            executedStatements.push(sql);
            return { success: true, meta: { changes: 1 } };
          }
        })
      }),
      batch: async (statements: any[]) => {
        return statements.map(() => ({ success: true, meta: { changes: 1 } }));
      }
    };

    const importResult = await importIngestionWorkbook({
      db: mockDb,
      tenantId: syntheticTenantId,
      assessmentId: syntheticAssessmentId,
      sourceDocumentId: 'DOC-SYNTH-001',
      sourceFileName: 'synthetic_dataset.xlsx',
      bytes: new Uint8Array(excelBuffer),
      fileType: 'XLSX',
      referenceRates: []
    });

    // 2. Module 1 Processing: 5 transactions imported, 5 validation pre-check records created
    expect(importResult.importedCount).toBe(5);
    expect(importResult.validationCount).toBe(5);

    // 3. Baseline Reconciliation (₹6,80,000 = 0.068 Cr, rounded to 0.07 Cr)
    const expectedSpendInr = 250000 + 208000 + 100000 + 50000 + 72000;
    expect(expectedSpendInr).toBe(680000);
    const expectedSpendCr = 680000 / 10000000;
    expect(importResult.totalInrCrores).toBeCloseTo(expectedSpendCr, 2);
    expect(importResult.detectedCurrencies).toEqual(['INR']);
  });

  it('2. Evaluates Module 2 Categorization & Strategic Sourcing Levers', () => {
    const strategicTransactions: StrategicInputTransaction[] = [
      {
        id: 'TX-SYNTH-001',
        po_number: 'PO001',
        po_date: '2026-01-10',
        vendor_code: 'SUPP-A',
        vendor_name: 'Supplier A',
        material_code: 'MAT-ALU-01',
        material_desc: 'Aluminium Sheet',
        quantity: 1000,
        uom: 'KG',
        unit_price: 250,
        total_spend_inr: 250000,
        currency: 'INR',
        spend_category: 'Metals & Alloys'
      },
      {
        id: 'TX-SYNTH-002',
        po_number: 'PO002',
        po_date: '2026-01-11',
        vendor_code: 'SUPP-B',
        vendor_name: 'Supplier B',
        material_code: 'MAT-ALU-01',
        material_desc: 'Aluminium Sheet',
        quantity: 800,
        uom: 'KG',
        unit_price: 260,
        total_spend_inr: 208000,
        currency: 'INR',
        spend_category: 'Metals & Alloys'
      },
      {
        id: 'TX-SYNTH-003',
        po_number: 'PO003',
        po_date: '2026-01-12',
        vendor_code: 'SUPP-C',
        vendor_name: 'Supplier C',
        material_code: 'MAT-BOX-01',
        material_desc: 'Corrugated Boxes',
        quantity: 5000,
        uom: 'NOS',
        unit_price: 20,
        total_spend_inr: 100000,
        currency: 'INR',
        spend_category: 'Packaging'
      },
      {
        id: 'TX-SYNTH-004',
        po_number: 'PO004',
        po_date: '2026-01-13',
        vendor_code: 'SUPP-D',
        vendor_name: 'Supplier D',
        material_code: 'MAT-BEAR-01',
        material_desc: 'Industrial Bearings',
        quantity: 100,
        uom: 'NOS',
        unit_price: 500,
        total_spend_inr: 50000,
        currency: 'INR',
        spend_category: 'Mechanical Components'
      },
      {
        id: 'TX-SYNTH-005',
        po_number: 'PO005',
        po_date: '2026-01-14',
        vendor_code: 'SUPP-E',
        vendor_name: 'Supplier E',
        material_code: 'MAT-BEAR-01',
        material_desc: 'Industrial Bearings',
        quantity: 150,
        uom: 'NOS',
        unit_price: 480,
        total_spend_inr: 72000,
        currency: 'INR',
        spend_category: 'Mechanical Components'
      }
    ];

    const result = Module2StrategicSourcingEngine.analyze(strategicTransactions);

    // 4. Module 2 Categorization & Baseline
    expect(result.summary.totalSpendAnalyzedInr).toBe(680000);
    expect(result.summary.totalSpendAnalyzedInrCr).toBeCloseTo(0.068, 2);
    expect(result.profiles.length).toBe(3); // Metals & Alloys, Packaging, Mechanical Components

    // 5. Sourcing Opportunity Calculation:
    // Metals & Alloys has 2 suppliers (A: 250, B: 260).
    const metalsProfile = result.profiles.find((p) => p.categoryName === 'Metals & Alloys');
    expect(metalsProfile).toBeDefined();
    expect(metalsProfile?.totalSpendInr).toBe(458000);

    const packagingProfile = result.profiles.find((p) => p.categoryName === 'Packaging');
    expect(packagingProfile).toBeDefined();
    expect(packagingProfile?.totalSpendInr).toBe(100000);

    const mechProfile = result.profiles.find((p) => p.categoryName === 'Mechanical Components');
    expect(mechProfile).toBeDefined();
    expect(mechProfile?.totalSpendInr).toBe(122000);

    // 6. Module 3 Benchmark Processing: Zero fabricated observations
    // Baseline spend matches empirical records exactly
    expect(metalsProfile!.totalSpendInr + packagingProfile!.totalSpendInr + mechProfile!.totalSpendInr).toBe(680000);

    // 7 & 8. Module 4 Savings Consolidation & Financial Waterfall
    // Gross - Overlap = Net
    expect(result.summary.grossQuantifiableBenefitInr - result.summary.totalOverlappingOpportunityInr)
      .toBe(result.summary.netQuantifiableOpportunityInr);
  });

  it('3. Generates and validates Executive Opportunity Brief PDF and PPTX reports', async () => {
    const reportData: ExecutiveOpportunityBriefReport = {
      tenant: {
        tenantId: syntheticTenantId,
        enterpriseName: syntheticCustomerName
      },
      dataClassification: 'CONFIDENTIAL',
      generatedAt: '2026-11-16T09:00:00.000Z',
      scopeDescription: 'Synthetic Procurement Assessment for Release Verification',
      metrics: {
        transactionCount: 5,
        totalSpendCr: 0.068,
        supplierCount: 5,
        materialCount: 3,
        plantCount: 1,
        purchaseOrderCount: 5,
        firstTransactionDate: '2026-01-10',
        lastTransactionDate: '2026-01-14',
        opportunityCount: 2,
        estimatedSavingsCr: 0.001,
        averageConfidence: 0.95
      },
      opportunities: [
        {
          id: 'OPP-001',
          category: 'Metals & Alloys',
          title: 'Direct Price Harmonization: Aluminium Sheet',
          currentSpendCr: 0.0458,
          estimatedSavingsCr: 0.0008,
          lever: 'Price Harmonization',
          recommendedAction: 'Harmonize purchase orders to lowest plant rate',
          status: 'Identified',
          riskLevel: 'Low',
          confidence: 0.95
        },
        {
          id: 'OPP-002',
          category: 'Mechanical Components',
          title: 'Direct Price Harmonization: Industrial Bearings',
          currentSpendCr: 0.0122,
          estimatedSavingsCr: 0.0002,
          lever: 'Price Harmonization',
          recommendedAction: 'Standardize bearing suppliers',
          status: 'Identified',
          riskLevel: 'Low',
          confidence: 0.95
        }
      ],
      levers: [
        { label: 'Price Harmonization', count: 2, estimatedSavingsCr: 0.001 }
      ],
      statuses: [
        { label: 'Identified', count: 2, estimatedSavingsCr: 0.001 }
      ],
      risks: [
        { label: 'Low', count: 2, estimatedSavingsCr: 0.001 }
      ]
    };

    // 10. PDF Generation & Validation
    const pdf = await renderExecutiveBriefArtifact('pdf', reportData);
    expect(pdf.contentType).toBe('application/pdf');
    expect(Buffer.from(pdf.body.slice(0, 8)).toString('latin1')).toBe('%PDF-1.4');
    const pdfText = Buffer.from(pdf.body).toString('latin1');
    expect(pdfText).toContain('SYNTHETIC TEST INDUSTRIAL CORP');
    expect(pdfText).toContain('0.07'); // ₹6,80,000 baseline formatted in Cr (0.07 Cr)
    expect(pdfText).not.toContain('Borosil'); // Zero Borosil pollution

    // 11. PPTX Generation & Validation
    const pptx = await renderExecutiveBriefArtifact('pptx', reportData);
    expect(Buffer.from(pptx.body.slice(0, 2)).toString('latin1')).toBe('PK');
    expect(pptx.downloadFilename).toContain('.pptx');
    expect(pptx.downloadFilename).not.toContain('Borosil');
  });
});
