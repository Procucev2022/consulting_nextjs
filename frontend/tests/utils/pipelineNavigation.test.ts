import { describe, expect, it } from 'vitest';
import { DEFAULT_PIPELINE_TAB } from '../../src/constants/pipeline';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import {
  getLockedPipelineTabMessage,
  getInitialPipelineTab,
  getPipelineTabFromHash,
  resolvePipelineTabForOperatingMode
} from '../../src/utils/pipelineNavigation';

describe('pipeline URL navigation', () => {
  it.each(['module5', 'schema', 'assessment'])('accepts %s from a direct hash', (tab) => {
    expect(getInitialPipelineTab(`#${tab}`, '')).toBe(tab);
  });

  it('uses a valid query tab when the hash is unsupported', () => {
    expect(getInitialPipelineTab('#unsupported', '?tab=module5')).toBe('module5');
  });

  it('uses the default tab when both URL sources are unsupported', () => {
    expect(getInitialPipelineTab('#unsupported', '?tab=unknown')).toBe(DEFAULT_PIPELINE_TAB);
  });

  it.each([
    ['#schema', 'schema'],
    ['#module5', 'module5'],
    ['#invalid', null],
    ['', null]
  ] as const)('parses the hash %s for change events', (hash, expected) => {
    expect(getPipelineTabFromHash(hash)).toBe(expected);
  });

  it('defaults internal mode to assessment unless a workspace tab was requested', () => {
    expect(resolvePipelineTabForOperatingMode('', true)).toBe('assessment');
    expect(resolvePipelineTabForOperatingMode('assessment', true)).toBe('assessment');
    expect(resolvePipelineTabForOperatingMode('schema', true)).toBe('schema');
  });

  it('preserves public workspace navigation and ignores assessment-only navigation', () => {
    expect(resolvePipelineTabForOperatingMode('module5', false)).toBe('module5');
    expect(resolvePipelineTabForOperatingMode('assessment', false)).toBeNull();
    expect(resolvePipelineTabForOperatingMode('unknown', false)).toBeNull();
  });

  it.each([
    ['module2', UI_STRINGS.pipeline.lockedStep1Required],
    ['module3', UI_STRINGS.pipeline.lockedStep2Required],
    ['module4', UI_STRINGS.pipeline.lockedStep3Required],
    ['module5', UI_STRINGS.pipeline.lockedStep4Required],
    ['module1', UI_STRINGS.pipeline.lockedStep1Required],
    ['schema', UI_STRINGS.pipeline.lockedStep1Required],
    ['assessment', UI_STRINGS.pipeline.lockedStep1Required]
  ] as const)('provides the centralized lock guidance for %s', (tab, message) => {
    expect(getLockedPipelineTabMessage(tab)).toBe(message);
  });
});
