import {
  DEFAULT_PIPELINE_TAB,
  PIPELINE_NAVIGATION_TABS,
  PIPELINE_WORKSPACE_TABS
} from '../constants/pipeline';
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
