/**
 * Authentication and User Management Data Types (Frontend)
 */

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type SubscriptionTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface UserProfile {
  id: string;
  name?: string;
  full_name?: string;
  mobile_number?: string;
  phone?: string;
  email: string;
  company_name?: string;
  company_address?: string;
  role: UserRole | string;
  status: UserStatus | string;
  subscription_tier?: SubscriptionTier | string;
  tier?: SubscriptionTier | string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSessionResponse {
  success: boolean;
  message: string;
  user: UserProfile;
  token: string;
  expires_in_seconds?: number;
}

export interface RegisterFormData {
  name: string;
  mobile_number: string;
  email: string;
  company_name: string;
  company_address: string;
  password: string;
  confirm_password?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AdminUserQuery {
  search?: string;
  role?: 'ALL' | UserRole;
  status?: 'ALL' | UserStatus;
  tier?: 'ALL' | SubscriptionTier;
}

export interface AdminUsersResponse {
  success: boolean;
  users: UserProfile[];
  total: number;
  activeCount: number;
  suspendedCount: number;
  adminCount: number;
  companiesCount: number;
  tierCounts?: Record<SubscriptionTier, number>;
}

export interface AdminUpdateStatusPayload {
  status: UserStatus;
}

export interface AdminUpdateTierPayload {
  tier: SubscriptionTier;
}
