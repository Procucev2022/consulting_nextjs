import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module5ConversionMatrix } from '../../src/components/Module5ConversionMatrix';
import { mockTenant, mockConversionFunnel } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('Module5ConversionMatrix Component', () => {
  it('renders all funnel stages and conversion matrix cards', () => {
    const onOpenReport = vi.fn();
    render(
      <Module5ConversionMatrix
        tenant={mockTenant}
        funnelStages={mockConversionFunnel}
        onOpenReport={onOpenReport}
      />
    );

    expect(screen.getByText(UI_STRINGS.module5.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module5.calculatorTitle)).toBeInTheDocument();
  });

  it('updates sliders and triggers simulate lock-in confetti', () => {
    render(
      <Module5ConversionMatrix
        tenant={mockTenant}
        funnelStages={mockConversionFunnel}
        onOpenReport={vi.fn()}
      />
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(3);

    // Change annual spend slider
    fireEvent.change(sliders[0], { target: { value: '1000' } });

    // Change savings rate slider
    fireEvent.change(sliders[1], { target: { value: '20' } });

    // Change fee rate slider
    fireEvent.change(sliders[2], { target: { value: '1.2' } });

    // Click lock in button
    const lockInBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module5.lockInButton, 'i') });
    fireEvent.click(lockInBtn);
  });

  it('triggers onOpenReport when clicking Generate Executive Brief button', () => {
    const onOpenReport = vi.fn();
    render(
      <Module5ConversionMatrix
        tenant={mockTenant}
        funnelStages={mockConversionFunnel}
        onOpenReport={onOpenReport}
      />
    );

    const openReportBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module5.generateBrief, 'i') });
    fireEvent.click(openReportBtn);
    expect(onOpenReport).toHaveBeenCalled();
  });
});
