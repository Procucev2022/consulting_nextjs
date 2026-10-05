import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { execSync } from 'child_process';

describe('generate-ci-summary script execution', () => {
  it('executes successfully and outputs markdown to stdout', () => {
    const scriptPath = path.resolve(__dirname, '../../../scripts/generate-ci-summary.js');
    const output = execSync(`node "${scriptPath}"`, { encoding: 'utf8' });
    expect(output).toBeDefined();
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
});
