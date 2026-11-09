import {
  DEFAULT_PIPELINE_TAB,
  PIPELINE_NAVIGATION_TABS,
  PIPELINE_WORKSPACE_TABS
} from '../constants/pipeline';
import { UI_STRINGS } from '../constants/uiStrings';
import type { PipelineActiveTab } from '../types/components';

const findTab = (value: string | null, allowedTabs: readonly PipelineActiveTab[]): PipelineActiveTab | null => {
  if (!value || !allowedTabs.includes(value as PipelineActiveTab)) return null;
  return value as PipelineActiveTab;
};

export const getInitialPipelineTab = (hash: string, search: string): PipelineActiveTab => {
  const hashTab = findTab(hash.replace(/^#/, ''), PIPELINE_NAVIGATION_TABS);
  if (hashTab) return hashTab;

  const queryTab = findTab(new URLSearchParams(search).get('tab'), PIPELINE_NAVIGATION_TABS);
  return queryTab ?? DEFAULT_PIPELINE_TAB;
};

export const getPipelineTabFromHash = (hash: string): PipelineActiveTab | null =>
  findTab(hash.replace(/^#/, ''), PIPELINE_NAVIGATION_TABS);

export const resolvePipelineTabForOperatingMode = (
  navigationValue: string,
  isInternalAssessment: boolean
): PipelineActiveTab | null => {
  const workspaceTab = findTab(navigationValue, PIPELINE_WORKSPACE_TABS);
  if (isInternalAssessment && workspaceTab === null) return 'assessment';
  return workspaceTab;
};

export const getLockedPipelineTabMessage = (tab: PipelineActiveTab): string => {
  if (tab === 'module2') return UI_STRINGS.pipeline.lockedStep1Required;
  if (tab === 'module3') return UI_STRINGS.pipeline.lockedStep2Required;
  if (tab === 'module4') return UI_STRINGS.pipeline.lockedStep3Required;
  if (tab === 'module5') return UI_STRINGS.pipeline.lockedStep4Required;
  return UI_STRINGS.pipeline.lockedStep1Required;
};
