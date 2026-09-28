import { describe, it, expect } from 'vitest';
import { PCBIModule4SimulationService } from '../../src/services/pcbiModule4SimulationService';

describe('PCBIModule4SimulationService (backend/src/services/pcbiModule4SimulationService.ts)', () => {
  const service = PCBIModule4SimulationService.getInstance();

  it('should return singleton instance', () => {
    const s2 = PCBIModule4SimulationService.getInstance();
    expect(service).toBe(s2);
  });

  it('should run PCBI version change test (Section 6) with targeted reprocessing', () => {
    const res = service.runVersionChangeSimulation();
    expect(res.commodityId).toBe('COM-MET-COP');
    expect(res.previousVersion).toBe('1.0');
    expect(res.newVersion).toBe('1.1');
    expect(res.recalculatedTransactionsCount).toBe(72);
    expect(res.unaffectedTransactionsCount).toBe(396);
    expect(res.previousCalculationAuditable).toBe(true);
    expect(res.oldVersionImmutable).toBe(true);
    expect(res.varianceInr).toBe(-1404000);
  });

  it('should simulate gap to opportunity lifecycle without code deployment (Section 7)', () => {
    const res = service.runGapToOpportunitySimulation();
    expect(res.commodityId).toBe('COM-MET-FMO');
    expect(res.initialState).toBe('NO_HISTORY');
    expect(res.finalState).toBe('MODULE_4_ELIGIBLE');
    expect(res.initialOpportunityInr).toBe(0);
    expect(res.finalOpportunityInr).toBe(680000);
    expect(res.codeDeploymentRequired).toBe(false);
    expect(res.stepsCompleted.length).toBe(10);
    expect(res.auditTrailReference).toBe('PROV-SIM-FMO-2026-06');
  });
});
