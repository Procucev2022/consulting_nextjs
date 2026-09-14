/**
 * Authentication and User Management Data Types (Backend)
 */

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface UserRecord {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  company_name: string;
  company_address: string;
  password_hash: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  company_name: string;
  company_address: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSessionResponse {
  user: UserProfileResponse;
  token: string;
  expires_in_seconds: number;
}

export interface AdminUserListResponse {
  users: UserProfileResponse[];
  total: number;
  activeCount: number;
  companiesCount: number;
}
