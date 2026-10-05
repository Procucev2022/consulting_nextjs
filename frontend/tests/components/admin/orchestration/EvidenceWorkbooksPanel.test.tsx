/**
 * Unit Tests for EvidenceWorkbooksPanel Component (Prompt 305)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EvidenceWorkbooksPanel } from '../../../../src/components/admin/orchestration/EvidenceWorkbooksPanel';
import { UI_STRINGS } from '../../../../src/constants';

vi.mock('../../../../src/utils/evidenceApi', () => ({
  evidenceApi: {
    getInventory: vi.fn().mockResolvedValue({
      success: true,
      jobId: 'job-test-001',
      tenantId: 'TNT-001',
      items: [
        {
          type: 'MODULE_1_EVIDENCE',
          filename: '01_Module_1_Evidence.xlsx',
          title: 'Module 1 — Spend Ingestion & Baseline Evidence',
          description: 'Detailed proof of spend concentration and supplier rankings.',
          sheetCount: 8,
          isAvailable: true,
          requiredRole: 'ADMIN'
        },
        {
          type: 'FINANCIAL_VALIDATION',
          filename: '05_Financial_Validation.xlsx',
          title: 'Financial Validation & Integrity Workbook',
          description: 'Automated 9-point CFO/CEO mathematical audit.',
          sheetCount: 6,
          isAvailable: true,
          requiredRole: 'ADMIN'
        }
      ]
    }),
    getParityValidation: vi.fn().mockResolvedValue({
      success: true,
      parity: {
        jobId: 'job-test-001',
        dataVersionId: 'v1',
        totalChecks: 13,
        passedChecks: 13,
        failedChecks: 0,
        overallStatus: 'PASS',
        evaluatedAt: '2026-10-04T12:00:00Z',
        discrepancies: [],
        checks: []
      }
    }),
    getWorkbookDownloadUrl: vi.fn((jobId, type) => `/api/evidence/jobs/${jobId}/workbooks/${type}/download`),
    getPackageDownloadUrl: vi.fn((jobId) => `/api/evidence/jobs/${jobId}/package/download`)
  }
}));

describe('EvidenceWorkbooksPanel Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders evidence workbooks panel with title, package download button, and parity badge', async () => {
    render(
      <EvidenceWorkbooksPanel
        jobId="job-test-001"
        customerName="UltraTech Cement Limited"
        totalSpendCr={5920.35}
      />
    );

    expect(screen.getByTestId('evidence-workbooks-panel')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.evidence.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.evidence.btnDownloadPackage)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.evidence.parityVerified)).toBeInTheDocument();
    });
  });

  it('renders declarative download links for individual workbooks', async () => {
    render(
      <EvidenceWorkbooksPanel
        jobId="job-test-001"
        customerName="UltraTech Cement Limited"
        totalSpendCr={5920.35}
      />
    );

    await waitFor(() => {
      const downloadLinks = screen.getAllByRole('link', { name: /Download/i });
      expect(downloadLinks.length).toBeGreaterThan(0);
      // First link is package download
      expect(downloadLinks[0]).toHaveAttribute('href', expect.stringContaining('/package/download'));
    });
  });
});
