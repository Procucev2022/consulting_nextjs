import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssessmentChecklistTab } from '../../../src/components/assessment/AssessmentChecklistTab';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { MODULE_GATES_LIST } from '../../../src/constants';
import type { AssessmentRecord, AssessmentReviewGateRecord } from '../../../src/types';

const mockAssessment: AssessmentRecord = {
  assessmentId: 'AIC-2026-0001',
  customerName: 'Demo Client',
  industry: 'Automotive',
  assessmentPeriodStart: '2023-06-01',
  assessmentPeriodEnd: '2024-03-31',
  assignedAnalyst: 'analyst@procucev.com',
  ndaStatus: 'SIGNED',
  dataStatus: 'VALIDATED',
  status: 'IN_PROGRESS',
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z'
};

const pendingGates: AssessmentReviewGateRecord[] = MODULE_GATES_LIST.map((gate) => ({
  assessmentId: mockAssessment.assessmentId,
  gateKey: gate.key,
  status: 'PENDING',
  evidenceReference: null,
  reviewNote: null,
  reviewedBy: null,
  reviewedAt: null
}));

const saveGate = vi.fn(async () => true);

describe('AssessmentChecklistTab', () => {
  it('renders all 4 modules and 26 gates in pending state before analysis run', () => {
    render(<AssessmentChecklistTab assessment={mockAssessment} gates={pendingGates} savingGateKey={null} onSaveGate={saveGate} />);

    expect(screen.getByText(UI_STRINGS.assessmentChecklist.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.assessmentChecklist.evidencePendingCount(MODULE_GATES_LIST.length))).toBeInTheDocument();
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Module 2')).toBeInTheDocument();
    expect(screen.getByText('Module 3')).toBeInTheDocument();
    expect(screen.getByText('Module 4')).toBeInTheDocument();
    expect(screen.getByText(MODULE_GATES_LIST[0].name)).toBeInTheDocument();
    expect(screen.getByText(MODULE_GATES_LIST.at(-1)?.name as string)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: UI_STRINGS.assessmentChecklist.markPassed })).toHaveLength(MODULE_GATES_LIST.length);
  });

  it('does not claim gate evidence is verified just because an assessment was approved', () => {
    const mockAssessment: AssessmentRecord = {
      assessmentId: 'AIC-2026-0001',
      customerName: 'Demo Client',
      industry: 'Automotive',
      assessmentPeriodStart: '2023-06-01',
      assessmentPeriodEnd: '2024-03-31',
      assignedAnalyst: 'analyst@procucev.com',
      ndaStatus: 'SIGNED',
      dataStatus: 'VALIDATED',
      status: 'APPROVED',
      activeAnalysisRunId: 'RUN-001',
      createdAt: '2026-10-09T10:00:00.000Z',
      updatedAt: '2026-10-09T10:00:00.000Z'
    };

    render(<AssessmentChecklistTab assessment={mockAssessment} gates={pendingGates} savingGateKey={null} onSaveGate={saveGate} />);

    expect(screen.getByText(UI_STRINGS.assessmentChecklist.evidencePendingCount(MODULE_GATES_LIST.length))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.assessmentChecklist.approvedStatus)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.assessmentChecklist.evidenceUnavailable)).toHaveLength(MODULE_GATES_LIST.length);
    expect(screen.getAllByText(UI_STRINGS.assessmentChecklist.evidenceRequired)).toHaveLength(MODULE_GATES_LIST.length);
    expect(screen.queryByText('20,241 rows')).not.toBeInTheDocument();
  });

  it('saves evidence-backed pass and blocker reviews and reports failed saves', async () => {
    const onSaveGate = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    render(<AssessmentChecklistTab assessment={mockAssessment} gates={pendingGates} savingGateKey={null} onSaveGate={onSaveGate} />);

    fireEvent.change(screen.getByLabelText(`${MODULE_GATES_LIST[0].name}: ${UI_STRINGS.assessmentChecklist.evidenceReferenceLabel}`), {
      target: { value: 'D1:AssessmentDataVersion/DV-1' }
    });
    fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.assessmentChecklist.markPassed })[0]);
    await waitFor(() => expect(onSaveGate).toHaveBeenNthCalledWith(1, expect.objectContaining({
      gateKey: MODULE_GATES_LIST[0].key, status: 'PASSED', evidenceReference: 'D1:AssessmentDataVersion/DV-1'
    })));

    fireEvent.change(screen.getByLabelText(`${MODULE_GATES_LIST[1].name}: ${UI_STRINGS.assessmentChecklist.reviewNoteLabel}`), {
      target: { value: 'Needs source correction' }
    });
    fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.assessmentChecklist.markBlocked })[1]);
    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.assessmentChecklist.saveFailed);
    expect(onSaveGate).toHaveBeenNthCalledWith(2, expect.objectContaining({
      gateKey: MODULE_GATES_LIST[1].key, status: 'BLOCKED', reviewNote: 'Needs source correction'
    }));
  });

  it('shows stored passed and blocked states and permits resetting a saved gate', async () => {
    const gates = pendingGates.map((gate, index) => index === 0
      ? { ...gate, status: 'PASSED' as const, evidenceReference: 'D1:DV-1' }
      : index === 1 ? { ...gate, status: 'BLOCKED' as const, reviewNote: 'Pending correction' } : gate);
    const onSaveGate = vi.fn().mockResolvedValue(true);
    render(<AssessmentChecklistTab assessment={mockAssessment} gates={gates} savingGateKey={MODULE_GATES_LIST[2].key} onSaveGate={onSaveGate} />);

    expect(screen.getByText(UI_STRINGS.assessmentChecklist.passedStatus)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.assessmentChecklist.blockedStatus)).toHaveLength(2);
    expect(screen.getByText('D1:DV-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.assessmentChecklist.saving })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.assessmentChecklist.resetPending })[0]);
    await waitFor(() => expect(onSaveGate).toHaveBeenCalledWith(expect.objectContaining({
      gateKey: MODULE_GATES_LIST[0].key, status: 'PENDING'
    })));
  });
});
