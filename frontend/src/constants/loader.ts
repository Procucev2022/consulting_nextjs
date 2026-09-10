/**
 * Constants for the Pictorial Analyzing Loader Component
 */

import type { AnalyzingPhase, AnalyzingMetricsSummary } from '../types';
import { UI_STRINGS } from './uiStrings';

export const ANALYZING_DEFAULT_DURATION_MS = 2800;
export const ANALYZING_TICK_INTERVAL_MS = 40;

export const DEFAULT_ANALYZING_METRICS: AnalyzingMetricsSummary = {
  totalRecords: 7357,
  spendCrores: 8066.86,
  uniqueVendors: 1073,
  categoriesIdentified: 48,
  confidenceScore: 99.4
};

export const DEFAULT_ANALYZING_PHASES: AnalyzingPhase[] = [
  {
    id: 'phase_ingestion',
    title: UI_STRINGS.analyzingLoader.phases.ingestionTitle,
    description: UI_STRINGS.analyzingLoader.phases.ingestionDesc,
    status: 'in_progress',
    progressPercent: 25,
    badgeLabel: 'Phase 1: Ingestion & FX',
    iconType: 'database'
  },
  {
    id: 'phase_taxonomy',
    title: UI_STRINGS.analyzingLoader.phases.taxonomyTitle,
    description: UI_STRINGS.analyzingLoader.phases.taxonomyDesc,
    status: 'pending',
    progressPercent: 50,
    badgeLabel: 'Phase 2: UNSPSC Col L',
    iconType: 'layers'
  },
  {
    id: 'phase_vendor_supply',
    title: UI_STRINGS.analyzingLoader.phases.vendorSupplyTitle,
    description: UI_STRINGS.analyzingLoader.phases.vendorSupplyDesc,
    status: 'pending',
    progressPercent: 75,
    badgeLabel: 'Phase 3: Multi-Category Trend',
    iconType: 'pieChart'
  },
  {
    id: 'phase_anomaly_governance',
    title: UI_STRINGS.analyzingLoader.phases.anomalyTitle,
    description: UI_STRINGS.analyzingLoader.phases.anomalyDesc,
    status: 'pending',
    progressPercent: 100,
    badgeLabel: 'Phase 4: Savings Engine',
    iconType: 'shieldCheck'
  }
];

export interface SatelliteNodeConfig {
  id: string;
  name: string;
  shortLabel: string;
  orbitAngleDeg: number;
  orbitRadiusPx: number;
  glowColor: string;
  accentColor: string;
  iconType: 'database' | 'layers' | 'pieChart' | 'shieldCheck';
}

export const ANALYZING_SATELLITE_NODES: SatelliteNodeConfig[] = [
  {
    id: 'node_ingestion',
    name: 'ERP Ingestion & Multi-FX Parity',
    shortLabel: 'Ingestion & FX',
    orbitAngleDeg: 225,
    orbitRadiusPx: 140,
    glowColor: 'rgba(14, 165, 233, 0.4)',
    accentColor: '#0ea5e9',
    iconType: 'database'
  },
  {
    id: 'node_taxonomy',
    name: 'UNSPSC Col L AI Commodity Matching',
    shortLabel: 'Taxonomy Match',
    orbitAngleDeg: 315,
    orbitRadiusPx: 140,
    glowColor: 'rgba(99, 102, 241, 0.4)',
    accentColor: '#6366f1',
    iconType: 'layers'
  },
  {
    id: 'node_vendor_supply',
    name: 'Spend Analytics & Multi-Category Proliferation',
    shortLabel: 'Spend Analytics',
    orbitAngleDeg: 45,
    orbitRadiusPx: 140,
    glowColor: 'rgba(168, 85, 247, 0.4)',
    accentColor: '#a855f7',
    iconType: 'pieChart'
  },
  {
    id: 'node_governance',
    name: 'Savings Levers & DPS NXT / ProCPX Unlock',
    shortLabel: 'Savings Matrix',
    orbitAngleDeg: 135,
    orbitRadiusPx: 140,
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10b981',
    iconType: 'shieldCheck'
  }
];
