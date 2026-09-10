import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AnalyzingLoader } from '../../src/components/AnalyzingLoader';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { AnalyzingPhase } from '../../src/types';

describe('AnalyzingLoader Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<AnalyzingLoader isOpen={false} autoProgress={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders default overlay loader with titles, AI core, and default metrics', () => {
    render(<AnalyzingLoader isOpen={true} autoProgress={false} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.analyzingLoader.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.analyzingLoader.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.analyzingLoader.orbitHubLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.analyzingLoader.metrics.recordsAnalyzed)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.analyzingLoader.metrics.spendEvaluated)).toBeInTheDocument();
  });

  it('renders with custom title, subtitle, and inline mode', () => {
    render(
      <AnalyzingLoader
        isOpen={true}
        mode="inline"
        title="Custom Spend Audit"
        subtitle="Auditing high risk suppliers"
        autoProgress={false}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Custom Spend Audit')).toBeInTheDocument();
    expect(screen.getByText('Auditing high risk suppliers')).toBeInTheDocument();
  });

  it('handles cancel button click when onCancel is provided', () => {
    const onCancel = vi.fn();
    render(<AnalyzingLoader isOpen={true} onCancel={onCancel} autoProgress={false} />);

    const cancelBtn = screen.getByRole('button', { name: UI_STRINGS.analyzingLoader.cancelButton });
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('displays controlled progress and phase index when autoProgress is false', () => {
    const customPhases: AnalyzingPhase[] = [
      {
        id: 'p1',
        title: 'Phase Alpha',
        description: 'First test phase',
        status: 'completed',
        progressPercent: 100,
        iconType: 'database'
      },
      {
        id: 'p2',
        title: 'Phase Beta',
        description: 'Second test phase',
        status: 'in_progress',
        progressPercent: 50,
        iconType: 'layers'
      },
      {
        id: 'p3',
        title: 'Phase Gamma',
        description: 'Third test phase',
        status: 'pending',
        progressPercent: 0,
        iconType: 'pieChart'
      },
      {
        id: 'p4',
        title: 'Phase Delta',
        description: 'Fourth test phase',
        status: 'pending',
        progressPercent: 0,
        iconType: 'shieldCheck'
      }
    ];

    const { rerender } = render(
      <AnalyzingLoader
        isOpen={true}
        phases={customPhases}
        progress={35}
        currentPhaseIndex={1}
        autoProgress={false}
      />
    );

    expect(screen.getAllByText('35%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Phase Alpha')).toBeInTheDocument();
    expect(screen.getByText('Phase Beta')).toBeInTheDocument();

    // Rerender with updated controlled props
    rerender(
      <AnalyzingLoader
        isOpen={true}
        phases={customPhases}
        progress={70}
        currentPhaseIndex={2}
        autoProgress={false}
      />
    );

    expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);
  });

  it('simulates autoProgress until 100% and triggers onComplete', () => {
    const onComplete = vi.fn();
    render(
      <AnalyzingLoader
        isOpen={true}
        autoProgress={true}
        speedMultiplier={10}
        onComplete={onComplete}
      />
    );

    // Fast-forward fake timers across the full duration
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('renders completion button when progress reaches 100% and triggers action on click', () => {
    const onComplete = vi.fn();
    render(
      <AnalyzingLoader
        isOpen={true}
        progress={100}
        autoProgress={false}
        onComplete={onComplete}
      />
    );

    const viewResultsBtn = screen.getByRole('button', {
      name: new RegExp(UI_STRINGS.analyzingLoader.viewResultsButton, 'i')
    });
    expect(viewResultsBtn).toBeInTheDocument();

    fireEvent.click(viewResultsBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon types including sparkles fallback', () => {
    const customPhases: AnalyzingPhase[] = [
      {
        id: 'p_sparkle',
        title: 'Neural Sparkles',
        description: 'Testing default icon',
        status: 'in_progress',
        progressPercent: 50,
        iconType: 'sparkles'
      }
    ];

    render(
      <AnalyzingLoader
        isOpen={true}
        phases={customPhases}
        autoProgress={false}
      />
    );

    expect(screen.getByText('Neural Sparkles')).toBeInTheDocument();
  });
});
