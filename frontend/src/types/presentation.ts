import type { SavingsOpportunity } from './models';

export type PresentationSlideId =
  | 'cover'
  | 'confidentiality'
  | 'about'
  | 'scorecard'
  | 'ingestion'
  | 'taxonomy'
  | 'strategicRisk'
  | 'priceCreep'
  | 'savingsLevers'
  | 'governance';

export interface PresentationSlideInfo {
  id: PresentationSlideId;
  slideNumber: number;
  title: string;
  category: string;
}

export interface PresentationSlideProps {
  tenantEnterpriseName: string;
  totalSpendInrCr: number;
  totalSavingsInrCr: number;
  slideNumber: number;
  totalSlides: number;
  opportunities?: SavingsOpportunity[];
}
