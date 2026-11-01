/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import {
  BOROSIL_COMMODITY_MAPPINGS,
  resolveBorosilCommodity
} from '../../../src/constants/module3CommodityResolver';
import { SelectedBenchmarkDetailCard } from '../../../src/components/pcbi/SelectedBenchmarkDetailCard';
import { Module3TrendAnalytics } from '../../../src/components/Module3TrendAnalytics';

describe('Module 3 — Borosil PCBI Benchmark Resolver & Integrity Suite', () => {
  const c = UI_STRINGS.module3.commodities;

  describe('1. Dropdown Option Canonical Resolution & Provenance', () => {
    it('resolves Soda Ash Dense exclusively to AMAI series and SAP 100SA02G', () => {
      const res = resolveBorosilCommodity(c.sodaAshDense);
      expect(res.pcbiSeriesId).toBe('PCBI-IND-CHM-SDA-001');
      expect(res.linkedSapCodes).toEqual(['100SA02G']);
      expect(res.canonicalTransactionCount).toBe(6);
      expect(res.canonicalSpendInrCr).toBe(58.1170);
      expect(res.publisherSource).toContain('AMAI');
      expect(res.priceBasis).toBe('Ex-Works Gujarat');
      expect(res.operationalStatus).toBe('AWAITING_VERIFIED_BENCHMARKS');
      expect(res.availableObservationsCount).toBe(0);
    });

    it('resolves Soda Ash Local Spot to Chemical Weekly series and SAP 100SA01T', () => {
      const res = resolveBorosilCommodity(c.sodaAshLocal);
      expect(res.pcbiSeriesId).toBe('PCBI-IND-CHM-SDA-002');
      expect(res.linkedSapCodes).toEqual(['100SA01T']);
      expect(res.canonicalTransactionCount).toBe(5);
      expect(res.canonicalSpendInrCr).toBe(15.9000);
      expect(res.publisherSource).toContain('Chemical Weekly');
      expect(res.operationalStatus).toBe('AWAITING_VERIFIED_BENCHMARKS');
    });

    it('keeps laboratory sodium carbonate strictly separate from industrial soda ash', () => {
      const res = resolveBorosilCommodity(c.labSodiumCarbonate);
      expect(res.pcbiSeriesId).toBeNull();
      expect(res.linkedSapCodes).toEqual(['KPMAINT07134']);
      expect(res.canonicalTransactionCount).toBe(1);
      expect(res.canonicalSpendInrCr).toBeCloseTo(0.0000349, 6);
      expect(res.operationalStatus).toBe('MATERIAL_MAPPING_REQUIRED');
      expect(res.displayStatusMessage).toContain('Material Mapping Required');
    });

    it('resolves Solar Silica Sand to IBM low-iron series and SAP 100SSW13FG-L / 12FG', () => {
      const res = resolveBorosilCommodity(c.silicaSandSolar);
      expect(res.pcbiSeriesId).toBe('PCBI-IND-MIN-SLS-001');
      expect(res.linkedSapCodes).toEqual(['100SSW13FG-L', '100SSW12FG']);
      expect(res.canonicalTransactionCount).toBe(25);
      expect(res.canonicalSpendInrCr).toBe(38.5180);
      expect(res.operationalStatus).toBe('OBSERVATIONS_PENDING_VALIDATION');
    });

    it('keeps quartz sand separate from generic silica sand', () => {
      const res = resolveBorosilCommodity(c.quartzSand);
      expect(res.pcbiSeriesId).toBe('PCBI-IND-MIN-QRTZ-001');
      expect(res.linkedSapCodes).toEqual(['100QS01PR']);
      expect(res.canonicalTransactionCount).toBe(3);
      expect(res.canonicalSpendInrCr).toBe(0.5040);
      expect(res.operationalStatus).toBe('OBSERVATIONS_PENDING_VALIDATION');
    });

    it('resolves LSHS Fuel Oil with quarantined observation status', () => {
      const res = resolveBorosilCommodity(c.lshsFuel);
      expect(res.pcbiSeriesId).toBe('PCBI-IND-NRG-LSHS-001');
      expect(res.linkedSapCodes).toEqual(['400LSH01I']);
      expect(res.canonicalTransactionCount).toBe(4);
      expect(res.canonicalSpendInrCr).toBe(15.3722);
      expect(res.availableObservationsCount).toBe(14);
      expect(res.observationValidationStatus).toBe('QUARANTINED CANDIDATE OBSERVATIONS');
      expect(res.operationalStatus).toBe('OBSERVATIONS_PENDING_VALIDATION');
    });

    it('keeps bulk depot diesel separate from equipment refueling diesel', () => {
      const bulkRes = resolveBorosilCommodity(c.dieselBulk);
      expect(bulkRes.pcbiSeriesId).toBe('PCBI-IND-NRG-HSD-001');
      expect(bulkRes.linkedSapCodes).toEqual(['KPRMDIESEL']);
      expect(bulkRes.canonicalTransactionCount).toBe(17);
      expect(bulkRes.canonicalSpendInrCr).toBe(0.9918);
      expect(bulkRes.priceBasis).toBe('Wholesale Ex-Depot');

      const equipRes = resolveBorosilCommodity(c.dieselEquip);
      expect(equipRes.pcbiSeriesId).toBe('PCBI-IND-NRG-HSD-002');
      expect(equipRes.linkedSapCodes).toEqual(['400HD001']);
      expect(equipRes.canonicalTransactionCount).toBe(9);
      expect(equipRes.canonicalSpendInrCr).toBe(0.6648);
      expect(equipRes.priceBasis).toBe('Retail Ex-Pump');
    });

    it('keeps bulk industrial LPG separate from bottled cylinder LPG', () => {
      const bulkLpg = resolveBorosilCommodity(c.bulkLpgGas);
      expect(bulkLpg.pcbiSeriesId).toBe('PCBI-IND-NRG-LPG-001');
      expect(bulkLpg.linkedSapCodes).toEqual(['KPRMLPG']);
      expect(bulkLpg.canonicalTransactionCount).toBe(28);
      expect(bulkLpg.canonicalSpendInrCr).toBe(3.2629);

      const cylinderLpg = resolveBorosilCommodity(c.bottledLpg);
      expect(cylinderLpg.pcbiSeriesId).toBe('PCBI-IND-NRG-LPG-002');
      expect(cylinderLpg.linkedSapCodes).toEqual(['400LP01A']);
      expect(cylinderLpg.canonicalTransactionCount).toBe(1);
      expect(cylinderLpg.canonicalSpendInrCr).toBe(0.2448);
    });

    it('treats LNG satellite storage facility SAP 600LNG01 as one-off non-benchmarkable CAPEX', () => {
      const res = resolveBorosilCommodity(c.lngSystem);
      expect(res.pcbiSeriesId).toBeNull();
      expect(res.linkedSapCodes).toEqual(['600LNG01']);
      expect(res.canonicalTransactionCount).toBe(1);
      expect(res.canonicalSpendInrCr).toBe(7.5100);
      expect(res.operationalStatus).toBe('NON_BENCHMARKABLE');
      expect(res.displayStatusMessage).toContain('Non-Benchmarkable (CAPEX)');
    });

    it('treats refractory feeder ceramics as non-benchmarkable proprietary specs', () => {
      const res = resolveBorosilCommodity(c.refractories);
      expect(res.pcbiSeriesId).toBeNull();
      expect(res.linkedSapCodes).toEqual(['STTV2062', 'STE00598', 'STE00599', 'STMV0334']);
      expect(res.canonicalTransactionCount).toBe(5);
      expect(res.canonicalSpendInrCr).toBe(0.0471);
      expect(res.operationalStatus).toBe('NON_BENCHMARKABLE');
    });
  });

  describe('2. Spend Reconciliation & Non-Double-Counting', () => {
    it('verifies non-overlapping SAP material codes across all benchmark entries', () => {
      const codeSet = new Set<string>();
      const granularKeys = [
        c.sodaAshDense,
        c.sodaAshLocal,
        c.silicaSandSolar,
        c.quartzSand,
        c.lshsFuel,
        c.kraftPaper,
        c.bulkLpgGas,
        c.bottledLpg,
        c.dieselBulk,
        c.dieselEquip,
        c.packagingPolymers,
        c.labSodiumCarbonate,
        c.refractories,
        c.lngSystem
      ];

      for (const key of granularKeys) {
        const item = BOROSIL_COMMODITY_MAPPINGS[key];
        for (const sapCode of item.linkedSapCodes) {
          expect(codeSet.has(sapCode)).toBe(false);
          codeSet.add(sapCode);
        }
      }
      expect(codeSet.size).toBe(21); // 21 unique commodity & CAPEX materials
    });
  });

  describe('3. SelectedBenchmarkDetailCard Rendering & Actions', () => {
    it('renders detail card with mapped spend, transactions, and explicit awaiting state', () => {
      const resolution = resolveBorosilCommodity(c.sodaAshDense);
      const onViewGap = vi.fn();
      render(<SelectedBenchmarkDetailCard resolution={resolution} onViewGapRegister={onViewGap} />);

      expect(screen.getByText('PCBI-IND-CHM-SDA-001')).toBeInTheDocument();
      expect(screen.getByText('AMAI Domestic Dense Soda Ash Index (Ex-Gujarat)')).toBeInTheDocument();
      expect(screen.getByText('₹58.1170 Cr')).toBeInTheDocument();
      expect(screen.getByText('6 Txs')).toBeInTheDocument();
      expect(screen.getByText('0 Approved')).toBeInTheDocument();
      expect(screen.getByText('0.00% Operational Coverage')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: UI_STRINGS.module3.benchmarkDetail.viewGapBtn });
      fireEvent.click(btn);
      expect(onViewGap).toHaveBeenCalled();
    });

    it('renders Observations Pending Validation banner for LSHS oil', () => {
      const resolution = resolveBorosilCommodity(c.lshsFuel);
      render(<SelectedBenchmarkDetailCard resolution={resolution} />);

      expect(screen.getByText('PCBI-IND-NRG-LSHS-001')).toBeInTheDocument();
      expect(screen.getByText('14 Approved')).toBeInTheDocument();
      expect(screen.getByText(/Observations Pending Validation: 14 observations held in quarantine/i)).toBeInTheDocument();
    });
  });

  describe('4. Module3TrendAnalytics UI Empty-State Binding', () => {
    it('renders SelectedBenchmarkDetailCard and switches resolution on dropdown change', () => {
      render(
        <Module3TrendAnalytics
          vendorRankings={[]}
          onProceedToSavings={vi.fn()}
          assessmentId="AIC-2026-0002"
        />
      );

      // Default is soda ash
      expect(screen.getByText(/Secondary Spot Soda Ash/i)).toBeInTheDocument();
      expect(screen.getByText('₹74.0170 Cr')).toBeInTheDocument();
      expect(screen.getByText('11 Txs')).toBeInTheDocument();

      // Change dropdown to LSHS fuel oil
      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: c.lshsFuel } });

      expect(screen.getByText('PCBI-IND-NRG-LSHS-001')).toBeInTheDocument();
      expect(screen.getByText('₹15.3722 Cr')).toBeInTheDocument();
      expect(screen.getByText('4 Txs')).toBeInTheDocument();
      expect(screen.getAllByText(/14 observations held in quarantine/i).length).toBeGreaterThan(0);
    });

    it('displays Awaiting Verified Benchmarks instead of false 0.0% creep finding', () => {
      render(
        <Module3TrendAnalytics
          vendorRankings={[]}
          onProceedToSavings={vi.fn()}
          assessmentId="AIC-2026-0002"
        />
      );

      // Average markup and high creep vendors must show "Awaiting Verified Benchmarks"
      const awaitingElements = screen.getAllByText(UI_STRINGS.module3.awaitingVerifiedBenchmarks);
      expect(awaitingElements.length).toBeGreaterThan(0);
      expect(screen.getAllByText(UI_STRINGS.module3.leakageNotQuantifiable).length).toBeGreaterThan(0);
      expect(screen.getByText(UI_STRINGS.module3.leakageAwaitingNote)).toBeInTheDocument();
    });
  });
});

