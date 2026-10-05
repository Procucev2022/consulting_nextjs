/**
 * Savings Evidence Component & Modal Prop Types (Prompt 306)
 */

import type { CanonicalSavingsType, SavingsTypeEvidenceInventoryItem } from './evidenceWorkbook';

export interface SavingsTypeEvidenceSectionProps {
  jobId?: string;
  className?: string;
  onViewDetails?: (savingsType: CanonicalSavingsType) => void;
}

export interface SavingsTypeEvidenceCardProps {
  item: SavingsTypeEvidenceInventoryItem;
  jobId: string;
  onViewDetails: (item: SavingsTypeEvidenceInventoryItem) => void;
  onDownload: (savingsType: CanonicalSavingsType) => void;
}

export interface SavingsTypeDetailModalProps {
  isOpen: boolean;
  item: SavingsTypeEvidenceInventoryItem | null;
  jobId: string;
  onClose: () => void;
  onDownload: (savingsType: CanonicalSavingsType) => void;
}
