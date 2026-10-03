import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerDataProtectionNotice } from '../../src/components/CustomerDataProtectionNotice';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('CustomerDataProtectionNotice Component', () => {
  it('renders collapsed notice with module1 contextual copy by default', () => {
    render(<CustomerDataProtectionNotice moduleContext="module1" />);

    expect(screen.getByText(UI_STRINGS.dataProtection.bannerTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.dataProtection.uploadNotice)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.dataProtection.expandLabel)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.dataProtection.corePromise)).not.toBeInTheDocument();
  });

  it('renders analysis copy when moduleContext is module2 or module3', () => {
    const { rerender } = render(<CustomerDataProtectionNotice moduleContext="module2" />);
    expect(screen.getByText(UI_STRINGS.dataProtection.analysisNotice)).toBeInTheDocument();

    rerender(<CustomerDataProtectionNotice moduleContext="module3" />);
    expect(screen.getByText(UI_STRINGS.dataProtection.analysisNotice)).toBeInTheDocument();
  });

  it('renders export copy when moduleContext is export', () => {
    render(<CustomerDataProtectionNotice moduleContext="export" />);
    expect(screen.getByText(UI_STRINGS.dataProtection.exportNotice)).toBeInTheDocument();
  });

  it('renders fallback banner copy when moduleContext is unspecified or default', () => {
    render(<CustomerDataProtectionNotice moduleContext={'unknown' as any} />);
    expect(screen.getByText(UI_STRINGS.dataProtection.bannerNotice)).toBeInTheDocument();
  });

  it('expands on button click and displays all 8 pillars and core promise', () => {
    render(<CustomerDataProtectionNotice defaultExpanded={false} />);

    const button = screen.getByRole('button', { name: UI_STRINGS.dataProtection.expandLabel });
    fireEvent.click(button);

    expect(screen.getByText(UI_STRINGS.dataProtection.collapseLabel)).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.dataProtection.retentionNotice).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(UI_STRINGS.dataProtection.exportConfidentialHeader)).toBeInTheDocument();

    for (const pillar of UI_STRINGS.dataProtection.pillars) {
      expect(screen.getByText(pillar.title)).toBeInTheDocument();
      expect(screen.getAllByText(pillar.desc).length).toBeGreaterThanOrEqual(1);
    }

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.dataProtection.collapseLabel }));
    expect(screen.queryByText(UI_STRINGS.dataProtection.corePromise)).not.toBeInTheDocument();
  });

  it('renders expanded by default when defaultExpanded is true and applies custom className', () => {
    const { container } = render(
      <CustomerDataProtectionNotice defaultExpanded={true} className="custom-test-class" />
    );

    expect(container.firstChild).toHaveClass('custom-test-class');
    expect(screen.getByText(UI_STRINGS.dataProtection.corePromise)).toBeInTheDocument();
  });
});
