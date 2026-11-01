import type { AssessmentAnalysisRun, DeliveryPackageItem } from './assessment';
import type { D1Record } from './d1';

export interface AssessmentArtifactEncryption {
  algorithm: string;
  iv: string;
  bytes: Uint8Array;
}

export type AssessmentCryptoKey = Awaited<ReturnType<typeof crypto.subtle.importKey>>;

export interface AssessmentDeliveryArtifactInput {
  item: DeliveryPackageItem;
  assessment: D1Record;
  run: AssessmentAnalysisRun;
  sourceRows: D1Record[];
  validationRows: D1Record[];
  reviewGates: D1Record[];
}

export interface RenderedAssessmentArtifact {
  bytes: Uint8Array;
  contentType: string;
}

export type AssessmentStoredDeliveryArtifact = DeliveryPackageItem & Required<
  Pick<DeliveryPackageItem, 'storageKey' | 'contentType' | 'encryptionIv'>
>;
