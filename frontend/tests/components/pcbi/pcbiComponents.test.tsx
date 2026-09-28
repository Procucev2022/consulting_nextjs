import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutiveBenchmarkSummary } from '../../../src/components/pcbi/ExecutiveBenchmarkSummary';
import { BenchmarkQualityDashboard } from '../../../src/components/pcbi/BenchmarkQualityDashboard';
import { BenchmarkCoverageWaterfall } from '../../../src/components/pcbi/BenchmarkCoverageWaterfall';
import { SpendCategoryView } from '../../../src/components/pcbi/SpendCategoryView';
import { CalculationTransparencyCard } from '../../../src/components/pcbi/CalculationTransparencyCard';
import { VendorPriceDispersionTable } from '../../../src/components/pcbi/VendorPriceDispersionTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { PCBIExecutiveSummary } from '../../../src/types/pcbi';

const mockSummary: PCBIExecutiveSummary = {
  total_spend_inr: 1000000000,
  total_spend_inr_cr: 100.0,
  material_spend_inr_cr: 92.0,
  service_spend_inr_cr: 8.0,
  unspsc_mapped_spend_inr_cr: 88.0,
  unspsc_mapping_percent: 95.7,
  pcbi_mapped_spend_inr_cr: 80.0,
  pcbi_coverage_percent: 87.0,
  mapped_spend_inr: 880000000,
  mapped_spend_inr_cr: 88.0,
  mapped_spend_percent: 88.0,
  benchmarkable_spend_inr: 700000000,
  benchmarkable_spend_inr_cr: 70.0,
  benchmarkable_spend_percent: 70.0,
  benchmarkability_percent: 76.1,
  a_quality_spend_inr_cr: 35.0,
  b_quality_spend_inr_cr: 25.0,
  c_quality_spend_inr_cr: 10.0,
  not_benchmarkable_spend_inr_cr: 22.0,
  total_opportunity_inr: 82000000,
  total_opportunity_inr_cr: 8.2,
  opportunity_percent: 8.2,
  total_favourable_variance_inr: 0,
  total_favourable_variance_inr_cr: 0,
  total_transactions: 1000,
  benchmarkable_transactions: 700,
  mapping_required_transactions: 100,
  data_quality_score: 95,
  category_aggregations: [],
  vendor_aggregations: [],
  material_aggregations: [],
  monthly_trend: []
};

describe('PCBI Components Suite', () => {
  describe('ExecutiveBenchmarkSummary', () => {
    it('renders all 14 KPIs with provided summary prop', () => {
      render(<ExecutiveBenchmarkSummary summary={mockSummary} />);

      expect(screen.getByText(UI_STRINGS.module3.executiveBenchmarkSummary.title)).toBeInTheDocument();
      expect(screen.getByText('₹100.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹92.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹8.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹88.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('95.7% Mapped')).toBeInTheDocument();
      expect(screen.getByText('₹80.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('87.0% Coverage')).toBeInTheDocument();
      expect(screen.getByText('₹70.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('76.1% Benchmarkable')).toBeInTheDocument();
      expect(screen.getByText('₹35.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹25.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹10.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹22.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹8.20 Cr')).toBeInTheDocument();
    });

    it('renders fallback defaults when summary is not provided', () => {
      render(<ExecutiveBenchmarkSummary summary={undefined as unknown as PCBIExecutiveSummary} />);
      expect(screen.getByText('₹100.00 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹8.20 Cr')).toBeInTheDocument();
    });
  });

  describe('BenchmarkQualityDashboard', () => {
    it('renders quality tiers A, B, C, and Not Benchmarkable with provided data', () => {
      render(<BenchmarkQualityDashboard summary={mockSummary} />);

      expect(screen.getByText(UI_STRINGS.module3.benchmarkQuality.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.benchmarkQuality.aBadge)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.benchmarkQuality.bBadge)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.benchmarkQuality.cBadge)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.benchmarkQuality.notBenchmarkableBadge)).toBeInTheDocument();
      expect(screen.getByText(/₹35\.00 Cr/)).toBeInTheDocument();
    });

    it('renders defaults when summary is omitted', () => {
      render(<BenchmarkQualityDashboard summary={undefined as unknown as PCBIExecutiveSummary} />);
      expect(screen.getByText(UI_STRINGS.module3.benchmarkQuality.aBadge)).toBeInTheDocument();
    });
  });

  describe('BenchmarkCoverageWaterfall', () => {
    it('renders all 7 waterfall cascade stages', () => {
      render(<BenchmarkCoverageWaterfall summary={mockSummary} />);

      expect(screen.getByText(UI_STRINGS.module3.waterfall.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step1)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step2)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step3)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step4)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step5)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step6)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step7)).toBeInTheDocument();
    });

    it('renders defaults when summary is not passed', () => {
      render(<BenchmarkCoverageWaterfall summary={undefined as unknown as PCBIExecutiveSummary} />);
      expect(screen.getByText(UI_STRINGS.module3.waterfall.step1)).toBeInTheDocument();
    });
  });

  describe('SpendCategoryView', () => {
    it('renders all 6 standard enterprise categories with metrics', () => {
      render(<SpendCategoryView summary={mockSummary} />);

      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.directMaterials)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.packingMaterials)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.mro)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.indirectMaterials)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.services)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.unmapped)).toBeInTheDocument();
      expect(screen.getByText(/Rule 6: Excluded from Material PCBI/)).toBeInTheDocument();
    });

    it('renders defaults when summary is omitted', () => {
      render(<SpendCategoryView summary={undefined as unknown as PCBIExecutiveSummary} />);
      expect(screen.getByText(UI_STRINGS.module3.spendCategoryView.directMaterials)).toBeInTheDocument();
    });
  });

  describe('CalculationTransparencyCard', () => {
    it('renders dynamic formula verification matching Prompt 100 test case', () => {
      render(<CalculationTransparencyCard />);

      expect(screen.getByText(UI_STRINGS.module3.calculationTransparency.title)).toBeInTheDocument();
      expect(screen.getByText(/Baseline Price × \(Current Index \/ Baseline Index\)/)).toBeInTheDocument();
      expect(screen.getAllByText(/₹157\.14/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/₹22\.86/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/₹2,28,600/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/₹1,60,020/)[0]).toBeInTheDocument();
    });

    it('handles changing numeric input values and recalculates in real-time', () => {
      render(<CalculationTransparencyCard />);

      const sliders = screen.getAllByRole('slider');
      const baselinePriceSlider = sliders[0];

      fireEvent.change(baselinePriceSlider, { target: { value: '200' } });
      expect(baselinePriceSlider).toHaveValue('200');

      const baseIndexSlider = sliders[1];
      fireEvent.change(baseIndexSlider, { target: { value: '100' } });

      const currentIndexSlider = sliders[2];
      fireEvent.change(currentIndexSlider, { target: { value: '120' } });

      const actualPriceSlider = sliders[3];
      fireEvent.change(actualPriceSlider, { target: { value: '260' } });

      const benchmarkabilitySlider = sliders[4];
      fireEvent.change(benchmarkabilitySlider, { target: { value: '80' } });

      // Reset to Prompt 100 test case
      const resetBtn = screen.getByRole('button', { name: 'Reset Prompt Test Case' });
      fireEvent.click(resetBtn);
      expect(screen.getByText(/₹1,60,020/)).toBeInTheDocument();
    });
  });

  describe('VendorPriceDispersionTable', () => {
    it('renders vendor price dispersion rows and triggers why-this-benchmark', () => {
      const handleWhyThisBenchmark = vi.fn();
      render(
        <VendorPriceDispersionTable
          onWhyThisBenchmark={handleWhyThisBenchmark}
        />
      );

      expect(screen.getByText(UI_STRINGS.module3.vendorDispersion.title)).toBeInTheDocument();
      expect(screen.getByText('Vendor C (Supreme Polymers)')).toBeInTheDocument();
      expect(screen.getByText('₹180.00')).toBeInTheDocument();
      expect(screen.getByText('₹157.14')).toBeInTheDocument();
      expect(screen.getByText(/\+₹22\.86/)).toBeInTheDocument();

      const whyBtns = screen.getAllByRole('button', { name: new RegExp(UI_STRINGS.module3.explainability.btnLabel, 'i') });
      expect(whyBtns.length).toBeGreaterThan(0);
      fireEvent.click(whyBtns[0]);
      expect(handleWhyThisBenchmark).toHaveBeenCalled();
    });

    it('renders calculations when provided in props', () => {
      const customCalcs = [
        {
          id: 'CALC-999',
          vendor: 'Global Lubricants Corp',
          short_text: 'Synthetic Compressor Oil',
          material_code: 'MAT-SYN-99',
          actual_price: 190.0,
          expected_price: 160.0,
          price_gap_per_unit: 30.0,
          price_gap_pct: 18.75,
          quantity: 2000,
          benchmarkability_percent: 75.0,
          opportunity_value: 45000
        }
      ];

      render(
        <VendorPriceDispersionTable
          calculations={customCalcs as unknown as import('../../../src/types/pcbi').PCBITransactionCalculation[]}
          onWhyThisBenchmark={vi.fn()}
        />
      );

      expect(screen.getByText('Global Lubricants Corp')).toBeInTheDocument();
      expect(screen.getByText('₹190.00')).toBeInTheDocument();
    });
  });
});
