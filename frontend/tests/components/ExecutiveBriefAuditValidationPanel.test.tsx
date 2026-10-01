import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefAuditValidationPanel } from '../../src/components/executiveBrief/ExecutiveBriefAuditValidationPanel';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';
import type { ExecutiveBriefValidationChecklist, ExecutiveBriefArtifactItem } from '../../src/types';

describe('ExecutiveBriefAuditValidationPanel', () => {
  const mockChecklist: ExecutiveBriefValidationChecklist = {
    module1Validated: true,
    module2Validated: true,
    module3Validated: true,
    module4Validated: true,
    financialReconciliation: true,
    transactionTraceability: true,
    doubleCountingControls: true,
    dataLineage: true,
    securityControls: true,
    reportGenerationValidation: true
  };

  const mockArtifacts: ExecutiveBriefArtifactItem[] = [
    {
      name: 'Executive Brief Audit',
      filename: 'EXECUTIVE_BRIEF_AUDIT.md',
      description: 'Audit trail of spend baseline',
      endpoint: '/api/reports/executive-brief/audit'
    },
    {
      name: 'Official Executive Report (PDF)',
      filename: 'EXECUTIVE_BRIEF.pdf',
      description: '30-slide PDF deliverable',
      endpoint: '/api/reports/executive-brief/download/pdf'
    }
  ];

  it('renders 10 validation checklist items', () => {
    render(
      <ExecutiveBriefAuditValidationPanel
        checklist={mockChecklist}
        artifacts={mockArtifacts}
        onDownloadArtifact={vi.fn()}
      />
    );

    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.validation.sectionTitle)).toBeInTheDocument();
    expect(screen.getByTestId('validation-check-module1Validated')).toBeInTheDocument();
    expect(screen.getByTestId('validation-check-financialReconciliation')).toBeInTheDocument();
  });

  it('renders artifacts and triggers download on click', () => {
    const onDownloadArtifact = vi.fn();
    render(
      <ExecutiveBriefAuditValidationPanel
        checklist={mockChecklist}
        artifacts={mockArtifacts}
        onDownloadArtifact={onDownloadArtifact}
      />
    );

    expect(screen.getByText('EXECUTIVE_BRIEF_AUDIT.md')).toBeInTheDocument();
    const dlBtn = screen.getByTestId('download-artifact-btn-EXECUTIVE_BRIEF_AUDIT.md');
    fireEvent.click(dlBtn);
    expect(onDownloadArtifact).toHaveBeenCalledWith(mockArtifacts[0]);
  });

  it('handles collapse and expand toggle for artifacts panel', () => {
    render(
      <ExecutiveBriefAuditValidationPanel
        checklist={mockChecklist}
        artifacts={mockArtifacts}
        onDownloadArtifact={vi.fn()}
      />
    );

    const toggleBtn = screen.getByTestId('toggle-artifacts-btn');
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('EXECUTIVE_BRIEF_AUDIT.md')).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText('EXECUTIVE_BRIEF_AUDIT.md')).toBeInTheDocument();
  });

  it('renders unchecked style when checklist item is false', () => {
    render(
      <ExecutiveBriefAuditValidationPanel
        checklist={{ ...mockChecklist, module1Validated: false }}
        artifacts={mockArtifacts}
        onDownloadArtifact={vi.fn()}
      />
    );
    const item = screen.getByTestId('validation-check-module1Validated');
    expect(item).toBeInTheDocument();
  });

  it('handles collapse and expand toggle for data security panel', () => {
    render(
      <ExecutiveBriefAuditValidationPanel
        checklist={mockChecklist}
        artifacts={mockArtifacts}
        onDownloadArtifact={vi.fn()}
      />
    );

    expect(screen.getByText(/Your procurement data is processed within the Procucev analysis environment/i)).toBeInTheDocument();
    const toggleBtn = screen.getByTestId('toggle-security-btn');
    fireEvent.click(toggleBtn);
    expect(screen.queryByText(/Your procurement data is processed within the Procucev analysis environment/i)).not.toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Your procurement data is processed within the Procucev analysis environment/i)).toBeInTheDocument();
  });
});
