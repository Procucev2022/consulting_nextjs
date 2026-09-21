import { describe, expect, it } from 'vitest';
import {
  CLOUDFLARE_API_PREFIX,
  CLOUDFLARE_HEALTH_PATH,
  CLOUDFLARE_ALLOWED_METHODS,
  CLOUDFLARE_ALLOWED_HEADERS,
  CLOUDFLARE_MAX_AGE_SECONDS,
  CLOUDFLARE_SERVICE_NAME
} from '../../src/constants/cloudflare';

describe('Cloudflare Constants', () => {
  it('should export all cloudflare configuration constants correctly', () => {
    expect(CLOUDFLARE_API_PREFIX).toBe('/api');
    expect(CLOUDFLARE_HEALTH_PATH).toBe('/health');
    expect(CLOUDFLARE_ALLOWED_METHODS).toBe('GET,POST,PUT,PATCH,DELETE,OPTIONS');
    expect(CLOUDFLARE_ALLOWED_HEADERS).toBe('Content-Type,Authorization,X-Request-Id');
    expect(CLOUDFLARE_MAX_AGE_SECONDS).toBe('86400');
    expect(CLOUDFLARE_SERVICE_NAME).toBe('consulting-backend-edge');
  });
});
