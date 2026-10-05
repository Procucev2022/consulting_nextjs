/**
 * Admin Gateway & Authentication Types (Frontend)
 */

import type { UserProfile } from './auth';

export type AdminGatewayTab = 'LOGIN' | 'CREATE_ADMIN';

export interface AdminLoginFormProps {
  readonly onSuccess: (user: UserProfile) => void;
  readonly onSwitchToCreate?: () => void;
}

export interface CreateAdminDetailsFormProps {
  readonly onSuccess: (user: UserProfile) => void;
  readonly onSwitchToLogin?: () => void;
}

export interface AdminActiveSessionCardProps {
  readonly user: UserProfile;
  readonly onSignOut: () => void;
  readonly onOpenDashboard: () => void;
  readonly onOpenCreateAdmin?: () => void;
}

export interface AdminGatewayHeaderProps {
  readonly activeTab: AdminGatewayTab;
  readonly onTabChange: (tab: AdminGatewayTab) => void;
  readonly hasActiveSession: boolean;
}
