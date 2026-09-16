/**
 * Types & Interfaces for the Pictorial Analyzing Loader Component
 */

export type AnalyzingLoaderMode = 'overlay' | 'inline' | 'compact';

export type AnalyzingStageStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface AnalyzingPhase {
  id: string;
  title: string;
  description: string;
  status: AnalyzingStageStatus;
  progressPercent: number; // 0-100
  badgeLabel?: string;
  iconType?: 'database' | 'cpu' | 'layers' | 'pieChart' | 'shieldCheck' | 'sparkles';
}

export interface AnalyzingMetricsSummary {
  totalRecords: number;
  spendCrores: number;
  uniqueVendors: number;
  categoriesIdentified: number;
  confidenceScore: number;
}

export interface AnalyzingLoaderProps {
  isOpen?: boolean;
  mode?: AnalyzingLoaderMode;
  title?: string;
  subtitle?: string;
  phases?: AnalyzingPhase[];
  currentPhaseIndex?: number;
  progress?: number;
  metrics?: AnalyzingMetricsSummary;
  onComplete?: () => void;
  onCancel?: () => void;
  autoProgress?: boolean;
  speedMultiplier?: number;
}

export interface AnalyzingLoaderState {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  currentPhaseIndex?: number;
  progress?: number;
  mode?: AnalyzingLoaderMode;
  metrics?: AnalyzingMetricsSummary;
  onCompleteCallback?: () => void;
}
