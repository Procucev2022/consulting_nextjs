import { describe, it, expect } from 'vitest';
import {
  ANALYZING_DEFAULT_DURATION_MS,
  ANALYZING_TICK_INTERVAL_MS,
  DEFAULT_ANALYZING_METRICS,
  DEFAULT_ANALYZING_PHASES,
  ANALYZING_SATELLITE_NODES
} from '../../src/constants/loader';
import * as LoaderBarrel from '../../src/constants/index';

describe('Loader Constants', () => {
  it('should define correct default analyzing duration and tick intervals', () => {
    expect(ANALYZING_DEFAULT_DURATION_MS).toBe(2800);
    expect(ANALYZING_TICK_INTERVAL_MS).toBe(40);
  });

  it('should define default analyzing metrics with enterprise benchmarks', () => {
    expect(DEFAULT_ANALYZING_METRICS.totalRecords).toBe(0);
    expect(DEFAULT_ANALYZING_METRICS.spendCrores).toBe(0);
    expect(DEFAULT_ANALYZING_METRICS.uniqueVendors).toBe(0);
    expect(DEFAULT_ANALYZING_METRICS.categoriesIdentified).toBe(0);
    expect(DEFAULT_ANALYZING_METRICS.confidenceScore).toBe(100);
  });

  it('should define the 4 default analyzing pipeline phases', () => {
    expect(DEFAULT_ANALYZING_PHASES.length).toBe(4);
    expect(DEFAULT_ANALYZING_PHASES[0].id).toBe('phase_ingestion');
    expect(DEFAULT_ANALYZING_PHASES[1].id).toBe('phase_taxonomy');
    expect(DEFAULT_ANALYZING_PHASES[2].id).toBe('phase_vendor_supply');
    expect(DEFAULT_ANALYZING_PHASES[3].id).toBe('phase_anomaly_governance');

    DEFAULT_ANALYZING_PHASES.forEach((phase) => {
      expect(phase.title).toBeTruthy();
      expect(phase.description).toBeTruthy();
      expect(phase.status).toBeTruthy();
      expect(phase.progressPercent).toBeGreaterThan(0);
    });
  });

  it('should define 4 satellite orbital node configurations with colors and coordinates', () => {
    expect(ANALYZING_SATELLITE_NODES.length).toBe(4);
    expect(ANALYZING_SATELLITE_NODES[0].id).toBe('node_ingestion');
    expect(ANALYZING_SATELLITE_NODES[1].id).toBe('node_taxonomy');
    expect(ANALYZING_SATELLITE_NODES[2].id).toBe('node_vendor_supply');
    expect(ANALYZING_SATELLITE_NODES[3].id).toBe('node_governance');

    ANALYZING_SATELLITE_NODES.forEach((node) => {
      expect(node.orbitRadiusPx).toBe(140);
      expect(node.glowColor).toContain('rgba');
      expect(node.accentColor).toBeTruthy();
      expect(node.iconType).toBeTruthy();
    });
  });

  it('should re-export loader constants from the constants barrel', () => {
    expect((LoaderBarrel as any).ANALYZING_DEFAULT_DURATION_MS).toBe(2800);
    expect((LoaderBarrel as any).DEFAULT_ANALYZING_METRICS).toBeDefined();
    expect((LoaderBarrel as any).DEFAULT_ANALYZING_PHASES).toBeDefined();
    expect((LoaderBarrel as any).ANALYZING_SATELLITE_NODES).toBeDefined();
  });
});
