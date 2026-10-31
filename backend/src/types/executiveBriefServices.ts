/** Types for D1-backed Executive Brief artifacts stored or downloaded at runtime. */

export type ExecutiveBriefFormat = 'pdf' | 'pptx' | 'json' | 'markdown';

export interface ExecutiveBriefRenderedArtifact {
  format: ExecutiveBriefFormat;
  filename: string;
  downloadFilename: string;
  contentType: string;
  body: Uint8Array;
}

export interface ExecutiveBriefStoredArtifact {
  key: string;
  filename: string;
  contentType: string;
  bytes: number;
}
