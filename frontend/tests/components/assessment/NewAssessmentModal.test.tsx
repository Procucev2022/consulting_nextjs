import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewAssessmentModal } from '../../../src/components/assessment/NewAssessmentModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    createAssessment: vi.fn()
  },
  assessmentApi: {
    createAssessment: vi.fn()
  }
}));

describe('NewAssessmentModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<NewAssessmentModal isOpen={false} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal form when isOpen is true', () => {
    render(<NewAssessmentModal isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.modalNew.title)).toBeInTheDocument();
  });

  it('submits form with entered values', async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();
    (assessmentApiClient.createAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      assessmentId: 'AIC-2026-0002',
      customerName: 'Tata Motors',
      industry: 'Automotive'
    });

    render(<NewAssessmentModal isOpen={true} onClose={onClose} onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText(UI_STRINGS.ASSESSMENT.modalNew.fieldCustomerPlaceholder), {
      target: { value: 'Tata Motors' }
    });
    fireEvent.change(screen.getByPlaceholderText(UI_STRINGS.ASSESSMENT.modalNew.fieldIndustryPlaceholder), {
      target: { value: 'Automotive' }
    });
    fireEvent.change(screen.getByPlaceholderText(UI_STRINGS.ASSESSMENT.modalNew.fieldPeriodStartPlaceholder), {
      target: { value: '2024-01-01' }
    });
    fireEvent.change(screen.getByPlaceholderText(UI_STRINGS.ASSESSMENT.modalNew.fieldPeriodEndPlaceholder), {
      target: { value: '2024-12-31' }
    });

    fireEvent.click(screen.getByText(UI_STRINGS.ASSESSMENT.modalNew.btnSubmit));

    await waitFor(() => {
      expect(assessmentApiClient.createAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Tata Motors',
          industry: 'Automotive'
        })
      );
      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
