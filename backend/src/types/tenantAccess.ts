import type { CloudflareEnvironment } from './cloudflare';

export interface TenantAccessDecision {
  request?: Request;
  environment?: CloudflareEnvironment;
  status?: number;
  message?: string;
}
