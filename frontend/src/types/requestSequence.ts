export interface LatestRequestSequence {
  beginRequest: () => number;
  isCurrentRequest: (requestId: number) => boolean;
  invalidateRequests: () => void;
}
