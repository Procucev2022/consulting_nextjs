/**
 * PCBI Module 3 — Commodity Coverage Master Excel Workbook Generator
 *
 * Generates PCBI_COMMODITY_COVERAGE_MASTER.xlsx with 8 mandatory sheets:
 * 1. Commodity_Master
 * 2. PCBI_Series
 * 3. Source_Register
 * 4. Data_Gaps
 * 5. Research_Queue
 * 6. Methodology_Register
 * 7. Coverage_Dashboard
 * 8. Version_History
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import { logger } from '../utils/logger';
import {
  INITIAL_COMMODITY_GAP_QUEUE,
  PCBI_MULTI_SOURCES_REGISTRY
} from '../constants/pcbiCommodityCoverage';
import type { PCBICommodityCoverageDashboard } from '../types/pcbiCommodityCoverage';

export class PCBICommodityCoverageExcelWriter {
  public static generateMasterWorkbook(
    dashboard: PCBICommodityCoverageDashboard,
    targetFilePath?: string
  ): string {
    logger.info('Generating PCBI_COMMODITY_COVERAGE_MASTER.xlsx with all 8 sheets');

    const wb = XLSX.utils.book_new();

    // Sheet 1: Commodity_Master
    const commodityMasterRows = [
      ['COMMODITY_ID', 'COMMODITY_NAME', 'MODULE2_CLASSIFICATION', 'UNSPSC', 'STATUS', 'CUSTOMER_SPEND', 'TXN_COUNT'],
      ['COM-IND-STL-HRC', 'Hot Rolled Steel Coils', 'METALS_AND_ALLOYS', '30101800', 'PRODUCTION_READY', 14250000, 120],
      ['COM-IND-PPR-KFT', 'Kraft Paper Packaging', 'PACKAGING_MATERIALS', '14111500', 'PRODUCTION_READY', 5420000, 85],
      ['COM-IND-STL-TMT', 'TMT Rebars Fe 500D', 'METALS_AND_ALLOYS', '30101800', 'PRODUCTION_READY', 4150000, 92],
      ['COM-IND-STL-SSP', 'Stainless Steel Pipes 304', 'METALS_AND_ALLOYS', '40171500', 'PRODUCTION_READY', 3280000, 76],
      ['COM-IND-COP-ROD', 'Copper Continuous Cast Rods', 'METALS_AND_ALLOYS', '30102000', 'PRODUCTION_READY', 2750000, 94],
      ['COM-IND-CHM-CSD', 'Caustic Soda Flakes Rayon', 'CHEMICALS', '12352100', 'PRODUCTION_READY', 2270405, 78],
      ['COM-MET-FMO', 'Ferro Molybdenum 65%', 'METALS_AND_ALLOYS', '30102900', 'NO_HISTORY', 12500000, 65],
      ['COM-EQP-SLP', 'Heavy Duty Slurry Pumps', 'INDUSTRIAL_MACHINERY', '40151500', 'NO_HISTORY', 10320000, 28],
      ['COM-MET-TCI', 'Tungsten Carbide Inserts', 'TOOLS_AND_MACHINERY', '23241600', 'PARTIAL_HISTORY', 7680000, 142],
      ['COM-PLM-HDP', 'HDPE Injection Molding Granules', 'POLYMERS_AND_PLASTICS', '13111000', 'PARTIAL_HISTORY', 3040000, 115],
      ['COM-STL-SCR', 'Stainless Steel 304 Scrap', 'METALS_AND_ALLOYS', '30103000', 'SOURCE_UNVERIFIED', 2980000, 84],
      ['COM-LUB-HYD', 'Industrial Hydraulic Oil ISO 68', 'FUELS_AND_LUBRICANTS', '15121500', 'SPECIFICATION_MISMATCH', 1939325, 50],
      ['COM-SRV-ENG', 'Plant Engineering Advisory', 'ENGINEERING_SERVICES', '81101500', 'NOT_BENCHMARKABLE', 15737325, 15]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(commodityMasterRows), 'Commodity_Master');

    // Sheet 2: PCBI_Series
    const pcbiSeriesRows = [
      ['SERIES_ID', 'PCBI_ID', 'COMMODITY', 'BASE_PERIOD', 'BASE_INDEX', 'FREQUENCY', 'UNIT', 'CURRENCY', 'STATUS'],
      ['PCBI-IND-STL-HRC-001-M', 'PCBI-IND-STL-HRC-001', 'Hot Rolled Steel Coils', '2020-04', 100.0, 'MONTHLY', 'INR/MT', 'INR', 'ACTIVE'],
      ['PCBI-IND-PPR-KFT-001-M', 'PCBI-IND-PPR-KFT-001', 'Kraft Paper Packaging', '2020-04', 100.0, 'MONTHLY', 'INR/MT', 'INR', 'ACTIVE'],
      ['PCBI-IND-STL-TMT-001-M', 'PCBI-IND-STL-TMT-001', 'TMT Rebars Fe 500D', '2020-04', 100.0, 'MONTHLY', 'INR/MT', 'INR', 'ACTIVE'],
      ['PCBI-IND-STL-SSP-001-M', 'PCBI-IND-STL-SSP-001', 'Stainless Steel Pipes 304', '2020-04', 100.0, 'MONTHLY', 'INR/MT', 'INR', 'ACTIVE'],
      ['PCBI-IND-COP-ROD-001-M', 'PCBI-IND-COP-ROD-001', 'Copper Wire Rods', '2020-04', 100.0, 'MONTHLY', 'INR/MT', 'INR', 'ACTIVE'],
      ['PCBI-IND-CHM-CSD-001-M', 'PCBI-IND-CHM-CSD-001', 'Caustic Soda Flakes', '2020-04', 100.0, 'MONTHLY', 'INR/MT', 'INR', 'ACTIVE'],
      ['PCBI-IND-MET-FMO-001-W', 'PCBI-IND-MET-FMO-001', 'Ferro Molybdenum 65%', '2020-04', 100.0, 'WEEKLY', 'INR/MT', 'INR', 'PENDING_HISTORY'],
      ['PCBI-IND-EQP-SLP-001-M', 'PCBI-IND-EQP-SLP-001', 'Heavy Duty Slurry Pumps', '2020-04', 100.0, 'MONTHLY', 'INR/UNIT', 'INR', 'PENDING_HISTORY']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pcbiSeriesRows), 'PCBI_Series');

    // Sheet 3: Source_Register
    const sourceRegisterRows = [
      ['SOURCE_ID', 'COMMODITY_ID', 'SOURCE_NAME', 'SOURCE_TYPE', 'PUBLISHER', 'FREQUENCY', 'STATUS', 'URL'],
      ...((PCBI_MULTI_SOURCES_REGISTRY['COM-MET-FMO'] || []).map((s) => [
        s.sourceId,
        'COM-MET-FMO',
        s.sourceName,
        s.sourceType,
        s.publisher,
        s.frequency,
        s.sourceStatus,
        s.url
      ])),
      ['SRC-STL-HRC-01', 'COM-IND-STL-HRC', 'Joint Plant Committee (JPC)', 'GOVERNMENT', 'Ministry of Steel', 'MONTHLY', 'VALIDATED', 'https://jpc.gov.in'],
      ['SRC-COP-ROD-01', 'COM-IND-COP-ROD', 'London Metal Exchange (LME)', 'EXCHANGE', 'LME Holdings', 'DAILY', 'VALIDATED', 'https://lme.com']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sourceRegisterRows), 'Source_Register');

    // Sheet 4: Data_Gaps
    const dataGapsRows = [
      ['COMMODITY_ID', 'COMMODITY_NAME', 'GAP_TYPE', 'CUSTOMER_SPEND_CR', 'REQUIRED_HISTORY', 'AVAILABLE_HISTORY', 'REMEDY'],
      ['COM-MET-FMO', 'Ferro Molybdenum 65%', 'NO_HISTORY', '₹1.25 Cr', '75 months', '0 months', 'Source research and incremental upload'],
      ['COM-EQP-SLP', 'Heavy Duty Slurry Pumps', 'NO_HISTORY', '₹1.03 Cr', '75 months', '0 months', 'Engineering index / producer quotes'],
      ['COM-MET-TCI', 'Tungsten Carbide Inserts', 'PARTIAL_HISTORY', '₹0.77 Cr', '75 months', '42 months', 'Append 2020-04 to 2022-12 history'],
      ['COM-PLM-HDP', 'HDPE Injection Molding Granules', 'PARTIAL_HISTORY', '₹0.30 Cr', '75 months', '42 months', 'Append 2020-04 to 2022-12 history'],
      ['COM-STL-SCR', 'Stainless Steel 304 Scrap', 'SOURCE_UNVERIFIED', '₹0.30 Cr', '75 months', '75 months', 'Verify commercial source license'],
      ['COM-LUB-HYD', 'Industrial Hydraulic Oil ISO 68', 'SPEC_MISMATCH', '₹0.19 Cr', '75 months', '75 months', 'Approve ISO 46 to ISO 68 mapping']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dataGapsRows), 'Data_Gaps');

    // Sheet 5: Research_Queue
    const researchQueueRows = [
      [
        'COMMODITY_ID',
        'COMMODITY_NAME',
        'UNSPSC',
        'SPEND_CR',
        'TXN_COUNT',
        'PCBI_ID',
        'PRIORITY',
        'RESEARCH_STATUS',
        'ACTION'
      ],
      ...INITIAL_COMMODITY_GAP_QUEUE.map((g) => [
        g.commodityId,
        g.commodityName,
        g.unspsc,
        g.customerSpendCr,
        g.transactionCount,
        g.pcbiId,
        g.priority,
        g.researchStatus,
        g.adminAction
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(researchQueueRows), 'Research_Queue');

    // Sheet 6: Methodology_Register
    const methodologyRows = [
      ['METHODOLOGY_ID', 'NAME', 'SOURCE_FREQUENCY', 'TARGET_FREQUENCY', 'TRANSFORMATION_RULE', 'GOVERNANCE_STATUS'],
      ['METH-AVG-ARITH', 'Arithmetic Mean Aggregation', 'WEEKLY', 'MONTHLY', 'SUM(Week_Vals)/Count(Weeks)', 'APPROVED'],
      ['METH-FX-RBI-REF', 'RBI Reference Rate FX Conversion', 'DAILY', 'MONTHLY', 'Average RBI Reference USD/INR', 'APPROVED'],
      ['METH-UNIT-MT-KG', 'Metric Ton to KG Factor', 'N/A', 'N/A', 'Value_MT / 1000', 'APPROVED'],
      ['METH-INTERP-CUBIC', 'Cubic Spline Synthesis', 'MONTHLY', 'WEEKLY', 'Synthetic interpolation', 'REJECTED_STRICTLY_PROHIBITED']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(methodologyRows), 'Methodology_Register');

    // Sheet 7: Coverage_Dashboard
    const coverageDashboardRows = [
      ['METRIC', 'VALUE', 'COMMENT'],
      ['TOTAL_CUSTOMER_SPEND', dashboard.totalCustomerSpendCr, 'Certified Module 1 ledger total'],
      ['PCBI_COVERED_SPEND', dashboard.pcbiCoveredSpendCr, 'Spend with production-ready benchmarks'],
      ['PCBI_UNCOVERED_SPEND', dashboard.pcbiUncoveredSpendCr, 'Uncovered spend gap (strictly NOT savings)'],
      ['COVERAGE_PERCENTAGE', `${dashboard.coveragePct.toFixed(2)}%`, 'Current production-ready coverage'],
      ['PRODUCTION_READY_COMMODITIES', dashboard.commodityCounts.PRODUCTION_READY, 'Fully calculated with 75m history'],
      ['PARTIAL_HISTORY_COMMODITIES', dashboard.commodityCounts.PARTIAL_HISTORY, 'Held pending historical append'],
      ['NO_HISTORY_COMMODITIES', dashboard.commodityCounts.NO_HISTORY, 'Held pending source research'],
      ['SOURCE_UNVERIFIED_COMMODITIES', dashboard.commodityCounts.SOURCE_UNVERIFIED, 'Held pending commercial verification'],
      ['SPEC_MISMATCH_COMMODITIES', dashboard.commodityCounts.SPECIFICATION_MISMATCH, 'Held pending admin mapping approval'],
      ['NOT_BENCHMARKABLE_SERVICES', dashboard.commodityCounts.NOT_BENCHMARKABLE, 'Services excluded from commodity PCBI']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(coverageDashboardRows), 'Coverage_Dashboard');

    // Sheet 8: Version_History
    const versionHistoryRows = [
      ['VERSION_ID', 'PCBI_ID', 'VERSION', 'CHANGE_REASON', 'APPROVED_BY', 'APPROVED_AT', 'CHECKSUM'],
      [
        'VER-STL-HRC-V10',
        'PCBI-IND-STL-HRC-001',
        '1.0.0',
        'Certified Production Release',
        'CHIEF_COMMODITY_OFFICER',
        '2026-09-02T10:00:00.000Z',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      ],
      [
        'VER-FMO-QUEUED-V01',
        'PCBI-IND-MET-FMO-001',
        '0.1.0',
        'Initial Gap Definition Registered',
        'ADMIN_SUPERVISOR_01',
        '2026-09-28T16:00:00.000Z',
        '4b3d8816a3f9e4e2d31215a782bcf291a1829e92d4b8f521b44ecb958c89a01f'
      ]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(versionHistoryRows), 'Version_History');

    const outputPath = targetFilePath || path.resolve(process.cwd(), 'PCBI_COMMODITY_COVERAGE_MASTER.xlsx');
    XLSX.writeFile(wb, outputPath);
    logger.info('PCBI_COMMODITY_COVERAGE_MASTER.xlsx generated successfully', { outputPath });
    return outputPath;
  }
}
