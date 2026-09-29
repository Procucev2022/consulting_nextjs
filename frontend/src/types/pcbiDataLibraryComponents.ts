/**
 * PCBI Data Library & Enterprise UI Hardening Component Prop Types
 */

import type {
  CommodityResearchQueueRow,
  CommoditySourceEvidenceObject,
  PCBIDataLibrarySubTab,
  PCBIEnterpriseStatus
} from './pcbiCommodityDataLab';

export interface PCBIStatusBadgeProps {
  status: PCBIEnterpriseStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export interface PCBIBreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface PCBIBreadcrumbProps {
  items: PCBIBreadcrumbItem[];
  className?: string;
}

export interface PCBIModuleWarningBannerProps {
  moduleContext: 'PCBI_MASTER' | 'PCBI_DATA_LIBRARY' | 'MODULE_1';
  onNavigateAction?: () => void;
  className?: string;
}

export interface CommodityPCBIUploadWorkflowModalProps {
  isOpen: boolean;
  initialCommodity?: CommodityResearchQueueRow | null;
  onClose: () => void;
  onComplete?: (result: { commodityId: string; pcbiId: string; versionId: string }) => void;
}

export interface PCBISourceComparisonViewProps {
  commodity: CommodityResearchQueueRow;
  sources: CommoditySourceEvidenceObject[];
  onSelectPrimarySource?: (sourceId: string) => void;
  onClose?: () => void;
}

export interface PCBISourceLibraryViewProps {
  sources: CommoditySourceEvidenceObject[];
  queue: CommodityResearchQueueRow[];
  onOpenWorkspace: (pcbiId: string) => void;
  onSelectCommodityUpload?: (commodityId: string) => void;
}

export interface PCBIDataLibraryViewProps {
  initialSubTab?: PCBIDataLibrarySubTab;
  onOpenWorkspaceModal?: (pcbiId: string) => void;
  onNavigateToMaster?: () => void;
}
