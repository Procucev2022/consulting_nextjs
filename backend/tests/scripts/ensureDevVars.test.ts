import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ensureDevVars, DEFAULT_DEV_VARS } = require('../../scripts/ensure-dev-vars');

describe('ensure-dev-vars script', () => {
  it('defines valid local development defaults with 32-byte encryption key and auth secret', () => {
    expect(DEFAULT_DEV_VARS).toContain('APP_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef');
    expect(DEFAULT_DEV_VARS).toContain('AUTH_SECRET=a1b2c3d4e5f60718293a4b5c6d7e8f90_procucev_secret_key_2026');
    expect(DEFAULT_DEV_VARS).toContain('D1_DATABASE_NAME=consulting_dev');
  });

  it('creates .dev.vars if missing and skips when existing', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);

    ensureDevVars();

    expect(existsSpy).toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();

    existsSpy.mockReturnValue(false);
    ensureDevVars();
    expect(writeSpy).toHaveBeenCalled();

    existsSpy.mockRestore();
    writeSpy.mockRestore();
  });
});
