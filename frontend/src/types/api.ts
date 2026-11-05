import type { TenantMaster } from './models';

export interface TenantApiResponse {
  success?: boolean;
  data?: TenantMaster;
  message?: string;
}
