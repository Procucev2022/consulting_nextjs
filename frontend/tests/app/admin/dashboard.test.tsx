import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminDashboardPage from '../../../src/app/admin/dashboard/page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />
}));

describe('Admin Dashboard Page (/admin/dashboard)', () => {
  it('renders the central admin console successfully', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
