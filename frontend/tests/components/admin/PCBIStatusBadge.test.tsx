import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PCBIStatusBadge } from '../../../src/components/admin/pcbi/PCBIStatusBadge';

describe('PCBIStatusBadge Component (Part L)', () => {
  it('renders standard status badge with label and dot', () => {
    render(<PCBIStatusBadge status="PRODUCTION_READY" />);
    const badge = screen.getByText('Production Ready');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveAttribute('title', expect.stringContaining('validated time-series'));
  });

  it('renders without dot when showDot is false', () => {
    const { container } = render(<PCBIStatusBadge status="PARTIAL_HISTORY" showDot={false} />);
    expect(screen.getByText('Partial History')).toBeInTheDocument();
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(0);
  });

  it('supports different sizes sm, md, lg and custom className', () => {
    const { rerender } = render(<PCBIStatusBadge status="NO_HISTORY" size="sm" className="custom-test-class" />);
    expect(screen.getByText('No History').parentElement).toHaveClass('text-[10px]');
    expect(screen.getByText('No History').parentElement).toHaveClass('custom-test-class');

    rerender(<PCBIStatusBadge status="NO_HISTORY" size="lg" />);
    expect(screen.getByText('No History').parentElement).toHaveClass('text-sm');
  });

  it('renders fallback for custom status', () => {
    render(<PCBIStatusBadge status="CUSTOM_STATUS" />);
    expect(screen.getByText('CUSTOM STATUS')).toBeInTheDocument();
  });
});
