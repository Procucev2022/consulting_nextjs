import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AssessmentDeliveryTab } from '../../../src/components/assessment/AssessmentDeliveryTab';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { DeliveryPackageResult } from '../../../src/types';

describe('AssessmentDeliveryTab', () => {
  it('renders not approved alert when deliveryPackage is null', () => {
    render(<AssessmentDeliveryTab deliveryPackage={null} />);
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.delivery.notApprovedAlert)).toBeInTheDocument();
  });

  it('renders all 10 approved deliverables and checksums when deliveryPackage is provided', () => {
    const mockPackage: DeliveryPackageResult = {
      assessmentId: 'AIC-2026-0001',
      analysisRunId: 'RUN-001',
      dataVersionId: 'DV-001',
      customerName: 'Varroc Polymers (VGT)',
      packageTitle: 'Delivery Package — Varroc Polymers (VGT)',
      assessmentPeriod: 'FY2023-24 (10 Months: Jun 2023 – Mar 2024)',
      releaseVersion: '1.0.0',
      generatedAt: '2026-10-09T12:00:00.000Z',
      approvedBy: 'lead.analyst@procucev.com',
      approvedAt: '2026-10-09T12:00:00.000Z',
      checksums: {
        sourceDataset: '59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def',
        fxMaster: '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f'
      },
      items: [
        { id: 'EXECUTIVE_OPPORTUNITY_BRIEF', title: 'Executive Opportunity Brief', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Executive_Opportunity_Brief.pdf' },
        { id: 'BOARDROOM_EVIDENCE_EDITION', title: 'Boardroom & Evidence Edition', format: 'PPTX', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Boardroom_Evidence_Edition.pptx' },
        { id: 'MODULE_1_REPORT', title: 'Module 1 report', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Module_1_Spend_Intelligence_Report.pdf' },
        { id: 'MODULE_2_REPORT', title: 'Module 2 report', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Module_2_Strategic_Sourcing_Report.pdf' },
        { id: 'PCBI_REPORT', title: 'PCBI report', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Module_3_PCBI_Benchmark_Report.pdf' },
        { id: 'MODULE_4_REPORT', title: 'Module 4 report', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Module_4_Savings_Engine_Report.pdf' },
        { id: 'EVIDENCE_WORKBOOK', title: 'Evidence workbook', format: 'XLSX', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Consolidated_Evidence_Workbook.xlsx' },
        { id: 'METHODOLOGY_ASSUMPTIONS', title: 'Methodology / assumptions', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Methodology_and_Assumptions.pdf' },
        { id: 'DATA_QUALITY_OBSERVATIONS', title: 'Data quality observations', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Data_Quality_Observations.pdf' },
        { id: 'RECOMMENDED_WAVE_1_ACTIONS', title: 'Recommended Wave 1 actions', format: 'PDF', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'AIC-2026-0001_Recommended_Wave_1_Actions.pdf' }
      ]
    };

    render(<AssessmentDeliveryTab deliveryPackage={mockPackage} />);

    expect(screen.getByText('FY2023-24 (10 Months: Jun 2023 – Mar 2024)')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.delivery.manifestEntryCount(0, 10))).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.ASSESSMENT.delivery.notGenerated)).toHaveLength(10);
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.delivery.filesPending)).toBeInTheDocument();
    expect(screen.getByText('lead.analyst@procucev.com')).toBeInTheDocument();
    expect(screen.getByText('Executive Opportunity Brief')).toBeInTheDocument();
    expect(screen.getByText('Boardroom & Evidence Edition')).toBeInTheDocument();
    expect(screen.getByText('Recommended Wave 1 actions')).toBeInTheDocument();
  });

  it('shows a download link only for generated deliverables', () => {
    const generatedItem = {
      id: 'EXECUTIVE_OPPORTUNITY_BRIEF', title: 'Executive Opportunity Brief', format: 'PDF' as const,
      artifactStatus: 'GENERATED' as const, analysisRunId: 'RUN-001', dataVersionId: 'DV-001',
      generatedAt: '2026-10-09T12:00:00.000Z', fileName: 'report.pdf'
    };
    const deliveryPackage: DeliveryPackageResult = {
      assessmentId: 'A-1', analysisRunId: 'RUN-001', dataVersionId: 'DV-001', customerName: 'Demo Client',
      assessmentPeriod: '', packageTitle: 'Delivery Package', generatedAt: '2026-10-09T12:00:00.000Z',
      approvedBy: 'analyst@example.test', approvedAt: '2026-10-09T12:00:00.000Z', releaseVersion: '1.0.0',
      checksums: {}, items: [generatedItem]
    };
    render(<AssessmentDeliveryTab deliveryPackage={deliveryPackage} />);
    expect(screen.getByTestId('download-assessment-artifact-EXECUTIVE_OPPORTUNITY_BRIEF'))
      .toHaveAttribute('href', '/api/assessment/A-1/delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF');
    expect(screen.queryByTestId('download-assessment-artifact-MODULE_1_REPORT')).not.toBeInTheDocument();
  });
});
