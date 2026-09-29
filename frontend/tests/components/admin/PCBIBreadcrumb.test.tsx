import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBIBreadcrumb } from '../../../src/components/admin/pcbi/PCBIBreadcrumb';

describe('PCBIBreadcrumb Component (Part P)', () => {
  it('renders home icon and breadcrumb items', () => {
    render(
      <PCBIBreadcrumb
        items={[
          { label: 'Admin', href: '/admin/pcbi' },
          { label: 'PCBI Data Library', href: '/admin/pcbi?tab=data-lab' },
          { label: 'Ferro Molybdenum 65%', isCurrent: true }
        ]}
      />
    );

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('PCBI Data Library')).toBeInTheDocument();
    const current = screen.getByText('Ferro Molybdenum 65%');
    expect(current).toBeInTheDocument();
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('handles item with onClick callback', () => {
    const handleClick = vi.fn();
    render(
      <PCBIBreadcrumb
        items={[
          { label: 'Research Queue', onClick: handleClick },
          { label: 'Details', isCurrent: true }
        ]}
      />
    );

    const button = screen.getByRole('button', { name: 'Research Queue' });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders plain text item when neither href nor onClick is provided', () => {
    render(
      <PCBIBreadcrumb
        items={[
          { label: 'Static Parent' },
          { label: 'Child Item', isCurrent: true }
        ]}
      />
    );

    expect(screen.getByText('Static Parent')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Static Parent' })).toBeNull();
  });
});
