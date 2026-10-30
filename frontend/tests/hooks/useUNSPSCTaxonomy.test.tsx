import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaxonomyLoadState } from '../../src/types';
import { useUNSPSCTaxonomy } from '../../src/hooks/useUNSPSCTaxonomy';

const mocked = vi.hoisted(() => ({
  load: vi.fn(),
  listeners: new Set<() => void>(),
  state: { isLoading: false, error: null } as TaxonomyLoadState
}));
vi.mock('../../src/data/unspscTaxonomy', () => ({
  loadUNSPSCTaxonomy: mocked.load,
  getTaxonomyLoadState: () => mocked.state,
  subscribeTaxonomy: (listener: () => void) => { mocked.listeners.add(listener); return () => { mocked.listeners.delete(listener); }; }
}));

describe('useUNSPSCTaxonomy', () => {
  beforeEach(() => {
    mocked.load.mockReset().mockResolvedValue(undefined);
    mocked.listeners.clear();
    mocked.state = { isLoading: false, error: null };
  });

  it('loads on demand, reflects database status changes and unsubscribes after unmount', () => {
    const { result, rerender, unmount } = renderHook(({ enabled }) => useUNSPSCTaxonomy(enabled), { initialProps: { enabled: false } });
    expect(mocked.load).not.toHaveBeenCalled();
    rerender({ enabled: true });
    expect(mocked.load).toHaveBeenCalledOnce();
    act(() => {
      mocked.state = { isLoading: true, error: null };
      mocked.listeners.forEach((listener) => listener());
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
    expect(mocked.listeners.size).toBe(0);
  });

  it('handles a rejected database load without an unhandled rejection', async () => {
    mocked.load.mockRejectedValue(new Error('offline'));
    renderHook(() => useUNSPSCTaxonomy());
    await waitFor(() => { expect(mocked.load).toHaveBeenCalledOnce(); });
  });
});
