import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLatestRequestSequence } from '../../src/utils/useLatestRequestSequence';

describe('useLatestRequestSequence', () => {
  it('identifies the current request and invalidates older requests', () => {
    const { result } = renderHook(() => useLatestRequestSequence());
    let firstRequestId = 0;
    let secondRequestId = 0;

    act(() => {
      firstRequestId = result.current.beginRequest();
    });
    expect(result.current.isCurrentRequest(firstRequestId)).toBe(true);

    act(() => {
      secondRequestId = result.current.beginRequest();
    });
    expect(result.current.isCurrentRequest(firstRequestId)).toBe(false);
    expect(result.current.isCurrentRequest(secondRequestId)).toBe(true);

    act(() => result.current.invalidateRequests());
    expect(result.current.isCurrentRequest(secondRequestId)).toBe(false);
  });
});
