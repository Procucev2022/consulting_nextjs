import { useCallback, useRef } from 'react';
import type { LatestRequestSequence } from '../types/requestSequence';

export const useLatestRequestSequence = (): LatestRequestSequence => {
  const currentRequestRef = useRef(0);

  const beginRequest = useCallback((): number => {
    currentRequestRef.current += 1;
    return currentRequestRef.current;
  }, []);

  const isCurrentRequest = useCallback(
    (requestId: number): boolean => requestId === currentRequestRef.current,
    []
  );

  const invalidateRequests = useCallback((): void => {
    currentRequestRef.current += 1;
  }, []);

  return { beginRequest, isCurrentRequest, invalidateRequests };
};
