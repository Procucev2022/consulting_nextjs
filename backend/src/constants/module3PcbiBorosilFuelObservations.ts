/**
 * Module 3 PCBI Phase 3 — Fuel & Energy Benchmark Observations Barrel
 * Assessment ID: AIC-2026-0002 (Borosil Ltd)
 * Conforms to Rule 8 (constants isolation), Rule 9 (strongly typed), and file length <= 300 lines.
 */

import type { ObservationProvenanceRecord } from '../types/module3PcbiObservationProvenance';
import { BOROSIL_LSHS_BENCHMARK_OBSERVATIONS } from './module3PcbiBorosilLshsObservations';
import { BOROSIL_HSD_BENCHMARK_OBSERVATIONS } from './module3PcbiBorosilHsdObservations';

export const BOROSIL_ACQUIRED_BENCHMARK_OBSERVATIONS: ObservationProvenanceRecord[] = [
  ...BOROSIL_LSHS_BENCHMARK_OBSERVATIONS,
  ...BOROSIL_HSD_BENCHMARK_OBSERVATIONS
];
