/**
 * Types for authenticated evidence file downloads.
 */

import type { RefObject } from 'react';
import type { DeclarativeDownloadPayload } from './components';

export interface EvidenceDownloadFailureDetail {
  message: string;
  requestId: string | null;
}

export type EvidenceDownloadOutcome =
  | { ok: true; blob: Blob }
  | { ok: false; statusCode: number; requestId: string | null; message: string };

export interface UseEvidenceFileDownloadResult {
  downloadPayload: DeclarativeDownloadPayload | null;
  downloadLinkRef: RefObject<HTMLAnchorElement | null>;
  downloadError: string | null;
  pendingKey: string | null;
  requestDownload: (key: string, url: string, filename: string) => Promise<void>;
}
