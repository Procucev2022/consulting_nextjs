import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PCBIDashboardTab } from '../../../../src/components/admin/pcbi/PCBIDashboardTab';
import { UI_STRINGS } from '../../../../src/constants';
import type { PCBIVersionRecord } from '../../../../src/types/pcbiAdmin';

const emptyVersion: PCBIVersionRecord = {
  id: 'version-empty', version: 'V7.0', upload_id: 'upload-empty', file_name: 'empty-reference.xlsx',
  file_size_mb: 0, upload_date: '2026-10-29T00:00:00.000Z', uploaded_by: 'database-admin',
  effective_date: '2026-10-29', status: 'VALIDATED', metrics: {
    benchmark_count: 0, weekly_records_count: 0, constituent_count: 0, unspsc_mappings_count: 0,
    a_quality_count: 0, b_quality_count: 0, c_quality_count: 0, total_benchmarkable_pct: 0,
    date_start: null, date_end: null, warnings_count: 0, errors_count: 0
  }
};

describe('PCBI dashboard database values', () => {
  it('shows unavailable values without inventing a published reference or governance counts', () => {
    render(<PCBIDashboardTab activeVersion={null} onNavigateToUpload={vi.fn()} onNavigateToVersions={vi.fn()} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.noPublishedBaseline)).toBeInTheDocument();
    expect(screen.getByText(`(${UI_STRINGS.pcbiAdmin.noReferenceDataFile})`)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(UI_STRINGS.pcbiAdmin.governanceDataUnavailable);
    expect(screen.getAllByText(UI_STRINGS.common.notAvailable).length).toBeGreaterThan(10);
    for (const fabricated of ['290', '95,700', '73', '75.8%', '240', '45', '5', '13', '7', 'V1.0']) {
      expect(screen.queryByText(fabricated)).not.toBeInTheDocument();
    }
  });

  it('preserves zero database metrics and identifies an unpublished selected version accurately', () => {
    render(<PCBIDashboardTab activeVersion={emptyVersion} onNavigateToUpload={vi.fn()} onNavigateToVersions={vi.fn()} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.selectedReferenceVersion)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.pcbiAdmin.activePublishedBaseline)).not.toBeInTheDocument();
    expect(screen.getByText(emptyVersion.version)).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(7);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.queryByText('95,700')).not.toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.governanceHistoryScopeUnknown)).toBeInTheDocument();
  });
});
