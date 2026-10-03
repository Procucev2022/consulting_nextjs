/**
 * Module 2 Strategic Sourcing Component Prop Interfaces
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  OpportunityWaterfallStage,
  SourcingLeverRecommendation,
  StrategicSourcingScorecard
} from './module2StrategicSourcing';

export interface StrategicSourcingDashboardCardsProps {
  summary: Module2StrategicSourcingDashboardSummary;
  onFilterCardClick?: (cardKey: string) => void;
  activeFilter?: string;
  onOpenHowCalculated?: () => void;
}

export interface StrategicSourcingCategoryTableProps {
  profiles: CategoryStrategicSourcingProfile[];
  onSelectCategory: (profile: CategoryStrategicSourcingProfile) => void;
  onExportAudit?: () => void;
  selectedCategoryName?: string;
  onOpenHowCalculated?: (profile: CategoryStrategicSourcingProfile) => void;
}

export interface StrategicSourcingOpportunityWaterfallProps {
  stages: OpportunityWaterfallStage[];
  categoryName?: string;
}

export interface StrategicSourcingLeverMatrixViewProps {
  levers: SourcingLeverRecommendation[];
}

export interface StrategicSourcingScorecardViewProps {
  scorecard: StrategicSourcingScorecard;
}

export interface StrategicSourcingDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CategoryStrategicSourcingProfile | null;
  onHandoffToModule4?: (profile: CategoryStrategicSourcingProfile) => void;
  onOpenHowCalculated?: (profile: CategoryStrategicSourcingProfile) => void;
}

export interface StrategicSupplierDeepDiveViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Module2StrategicSourcingWorkspaceProps {
  initialProfiles?: CategoryStrategicSourcingProfile[];
}
