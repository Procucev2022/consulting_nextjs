import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBIBreadcrumb } from '../../../src/components/admin/pcbi/PCBIBreadcrumb';
import { UI_STRINGS } from '../../../src/constants';

describe('PCBIBreadcrumb Component (Part P)', () => {
  it('renders home icon and breadcrumb items', () => {
    render(
      <PCBIBreadcrumb
        items={[
          { label: UI_STRINGS.pcbiAdmin.breadcrumbAdmin, href: '/admin/pcbi' },
          { label: UI_STRINGS.pcbiAdmin.breadcrumbDataLibrary, href: '/admin/pcbi?tab=data-lab' },
          { label: UI_STRINGS.pcbiAdmin.breadcrumbMaster, isCurrent: true }
        ]}
      />
    );

    expect(screen.getByRole('navigation', { name: UI_STRINGS.common.breadcrumbNavigation })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: UI_STRINGS.common.home })).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.breadcrumbAdmin)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.breadcrumbDataLibrary)).toBeInTheDocument();
    const current = screen.getByText(UI_STRINGS.pcbiAdmin.breadcrumbMaster);
    expect(current).toBeInTheDocument();
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('handles item with onClick callback', () => {
    const handleClick = vi.fn();
    render(
      <PCBIBreadcrumb
        items={[
          { label: UI_STRINGS.common.retry, onClick: handleClick },
          { label: UI_STRINGS.common.close, isCurrent: true }
        ]}
      />
    );

    const button = screen.getByRole('button', { name: UI_STRINGS.common.retry });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders plain text item when neither href nor onClick is provided', () => {
    render(
      <PCBIBreadcrumb
        items={[
          { label: UI_STRINGS.common.status },
          { label: UI_STRINGS.common.action, isCurrent: true }
        ]}
      />
    );

    expect(screen.getByText(UI_STRINGS.common.status)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: UI_STRINGS.common.status })).toBeNull();
  });
});
