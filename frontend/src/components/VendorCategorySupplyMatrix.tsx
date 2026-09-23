'use client';

import React, { useState, useMemo } from 'react';
import type {
  VendorCategorySupplyMatrixProps,
  VendorSupplyRecord
} from '../types/vendorSupply';
import {
  computeVendorSupplyOverview
} from '../utils/vendorSupplyCalculator';
import { VENDOR_SUPPLY_THRESHOLDS } from '../constants/vendorSupply';
import { frontendLogger as logger } from '../utils/logger';
import { VendorSupplyAlarmBanner } from './vendorSupply/VendorSupplyAlarmBanner';
import { VendorSupplyMetricsCards } from './vendorSupply/VendorSupplyMetricsCards';
import { VendorSupplyTierDistribution } from './vendorSupply/VendorSupplyTierDistribution';
import { VendorSupplyFilterBar } from './vendorSupply/VendorSupplyFilterBar';
import { VendorSupplyTable } from './vendorSupply/VendorSupplyTable';
import { VendorSupplyItemDetailsModal } from './vendorSupply/VendorSupplyItemDetailsModal';

export const VendorCategorySupplyMatrix: React.FC<VendorCategorySupplyMatrixProps> = ({
  vendors = [],
  onSelectVendor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MULTI_CATEGORY' | 'SINGLE_CATEGORY'>('ALL');
  const [highSpendOnly, setHighSpendOnly] = useState(false);
  const [riskOnly, setRiskOnly] = useState(false);
  const [modalVendor, setModalVendor] = useState<VendorSupplyRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const overview = useMemo(() => computeVendorSupplyOverview(vendors), [vendors]);

  // Filtered vendor list
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.vendor_name.toLowerCase().includes(q);
        const matchesId = v.master_vendor_id.toLowerCase().includes(q);
        const matchesCategory = v.supplied_categories.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesId && !matchesCategory) {
          return false;
        }
      }

      // Category type filter
      if (categoryFilter !== 'ALL' && v.category_type !== categoryFilter) {
        return false;
      }

      // High spend filter (> ₹15 Cr)
      if (highSpendOnly && v.total_spend_inr_cr < VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR) {
        return false;
      }

      // Risk only filter
      if (riskOnly && v.risk_level !== 'HIGH_RISK') {
        return false;
      }

      return true;
    });
  }, [vendors, searchQuery, categoryFilter, highSpendOnly, riskOnly]);

  const handleResetFilters = (): void => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setHighSpendOnly(false);
    setRiskOnly(false);
    logger.info('Vendor supply filters reset', { service: 'consulting-frontend' });
  };

  const handleSelectVendorRow = (vendor: VendorSupplyRecord): void => {
    logger.info('Vendor supply row selected', {
      service: 'consulting-frontend',
      context: { vendorId: vendor.master_vendor_id, rank: vendor.rank }
    });
    setModalVendor(vendor);
    setIsModalOpen(true);
    onSelectVendor?.(vendor);
  };

  const handleViewItems = (vendor: VendorSupplyRecord): void => {
    logger.info('Vendor items YoY detail opened', {
      service: 'consulting-frontend',
      context: { vendorId: vendor.master_vendor_id, rank: vendor.rank }
    });
    setModalVendor(vendor);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setModalVendor(null);
  };

  return (
    <div className="space-y-6">
      {/* Executive Key Observation & Risk Alarm Banner */}
      {overview.high_spend_multi_category_alarm && (
        <VendorSupplyAlarmBanner alarmDetails={overview.alarm_details} />
      )}

      {/* Top 50 KPI Metric Summary Cards */}
      <VendorSupplyMetricsCards overview={overview} />

      {/* Spend Tier Multi vs Single Distribution Trend */}
      <VendorSupplyTierDistribution tiers={overview.tiers} />

      {/* Interactive Controls, Filters & YoY Color Legend */}
      <VendorSupplyFilterBar
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        highSpendOnly={highSpendOnly}
        riskOnly={riskOnly}
        totalCount={vendors.length}
        filteredCount={filteredVendors.length}
        onSearchChange={setSearchQuery}
        onCategoryFilterChange={setCategoryFilter}
        onHighSpendToggle={() => setHighSpendOnly(!highSpendOnly)}
        onRiskToggle={() => setRiskOnly(!riskOnly)}
        onResetFilters={handleResetFilters}
      />

      {/* Top 50 Vendors Table with Consolidated YoY Item Metrics */}
      <VendorSupplyTable
        vendors={filteredVendors}
        onSelectVendor={handleSelectVendorRow}
        onViewItems={handleViewItems}
        onResetFilters={handleResetFilters}
      />

      {/* Vendor Line Items YoY Modal */}
      <VendorSupplyItemDetailsModal
        vendor={modalVendor}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default VendorCategorySupplyMatrix;
