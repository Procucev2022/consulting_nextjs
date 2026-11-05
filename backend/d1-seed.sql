-- Cloudflare D1 Baseline Seed SQL
-- Enterprise Procurement Intelligence Data (Borosil Baseline Reconciliation: 556.5347 Cr Net)

-- 1. Tenant Master
INSERT OR IGNORE INTO TenantMaster (
  tenant_id, enterprise_name, region, base_currency, status, total_spend_evaluated, total_spend_evaluated_inr, major_sector, minor_sector
) VALUES (
  'TNT-GLOBAL-8902', 'Global Enterprise Procurement', 'GLOBAL', 'INR', 'ACTIVE', 66412255, 556.5347, 'Chemical & Petrochemicals', 'Specialty Chemicals'
);

-- 2. Seed Users
INSERT INTO User (
  id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
) VALUES 
('usr-admin-001', 'System Administrator', '+91 98765 43210', 'admin@procucev.com', 'aiCEV Procucev Enterprise Inc.', 'Floor 14, Brigade Gateway, Bengaluru, Karnataka 560055, India', 'HeejL8HZRGPzqKpuYXOlUA:5h1jS0LkE1GbrA46SRDuDf5W2RwFvNRZAR5dvV-wWg1kigb_bPFZH1c2lz6KhRxKQNFTaSoYLnUTcSCM8Fx6rA', 'ADMIN', 'ACTIVE', 'GOLD', 'TNT-GLOBAL-8902'),
('usr-sriman-001', 'Sriman Executive', '+91 98800 11223', 'sriman@procucev.com', 'Procucev Enterprise Solutions Pvt Ltd', 'Floor 14, Brigade Gateway, Malleshwaram, Bengaluru 560055, Karnataka, India', '_qpmGCEqvBhJf-GfqwBIDQ:gm06c4DRas2m7iRGVQEO4PekgOlkQYm6hwdtfUtT4Z6s8GSaU5Ap4d2nbHA42ioE76zLxeG1gxQOx2DGLPL-1A;cNJbOnG3oArTRf5qMnNy1Q:dMgyA2eJJhP9ziKSNvtFWZPMNb6VpWKa9qDls_6Dt4y4lEbjcIQHd-jhqcMDdboEzVMKUFajiJzyYyVW9934Zw', 'ADMIN', 'ACTIVE', 'GOLD', 'TNT-GLOBAL-8902'),
('usr-simran-001', 'Simran Executive', '+91 98800 11223', 'simran@procucev.com', 'Procucev Enterprise Solutions Pvt Ltd', 'Floor 14, Brigade Gateway, Malleshwaram, Bengaluru 560055, Karnataka, India', '_qpmGCEqvBhJf-GfqwBIDQ:gm06c4DRas2m7iRGVQEO4PekgOlkQYm6hwdtfUtT4Z6s8GSaU5Ap4d2nbHA42ioE76zLxeG1gxQOx2DGLPL-1A;cNJbOnG3oArTRf5qMnNy1Q:dMgyA2eJJhP9ziKSNvtFWZPMNb6VpWKa9qDls_6Dt4y4lEbjcIQHd-jhqcMDdboEzVMKUFajiJzyYyVW9934Zw', 'ADMIN', 'ACTIVE', 'GOLD', 'TNT-GLOBAL-8902'),
('usr-user-001', 'Buyer User', '+91 98450 12345', 'buyer@procucev.com', 'Apex Industrial Dynamics Ltd.', 'Plot 45, Industrial Suburb, Peenya 2nd Stage, Bengaluru 560058, Karnataka, India', '2IJRSyNrGBV6M_IWNwrL_g:Dd5sbyDetVfztKnipwUZr-weIJwXPqnt9T2styyNJmRDEgl5PpUmtKX4qoda0fhVEWYp5XATrjK8jL1fC_zcWw', 'USER', 'ACTIVE', 'BRONZE', 'TNT-GLOBAL-8902'),
('usr-user-002', 'Priya Sharma', '+91 97123 45678', 'priya.sharma@tatasupply.com', 'Tata Strategic Procurement Corp', 'Bombay House, 24 Homi Mody Street, Fort, Mumbai 400001, Maharashtra, India', 'cLSMxXQyc_2epRAAmx6lVw:bchlMQmASILTidIN4-pH8BUaPmJd6BTJc16uJtFAJ-DV9eOS346A0I_sm6bVMEp-UeB7GxOsusBMPPcqDjkHmQ', 'USER', 'ACTIVE', 'SILVER', 'TNT-GLOBAL-8902')
ON CONFLICT(id) DO UPDATE SET tenant_id = excluded.tenant_id;

-- 3. Ingestion Document Record
INSERT OR IGNORE INTO RawDocumentIngestion (
  doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count, detected_currencies, converted_inr_crores, unique_items_count, unique_vendors_count, material_groups_count, plants_count
) VALUES (
  'DOC-INGEST-BOROSIL-001', 'TNT-GLOBAL-8902', 'Enterprise_Procurement_Dataset_3Year.xlsx', 'XLSX', 2.14, 'Completed', 100, 30740, '["INR","USD","EUR"]', 556.5347, 438, 1537, 10, 8
);

-- 4. Assessment Records
INSERT OR IGNORE INTO AssessmentRecord (assessment_id, customer_id, customer_name, industry, business_unit, company_website, assessment_owner, currency, assessment_period_start, assessment_period_end, data_received_at, nda_status, data_status, assigned_analyst, status, notes, is_test_data, total_spend_cr, validated_spend_cr, baseline_spend_cr, gross_spend_cr, fx_impact_cr, addressable_spend_cr, gross_opportunity_cr, overlap_deductions_cr, net_defensible_opportunity_cr, proven_opportunity_cr, delivery_range_min_cr, delivery_range_max_cr, pcbi_analytical_signal_cr, potential_savings_cr, savings_pct, created_at, updated_at) VALUES
('AIC-2026-0002', 'CUST-2026-0002', 'ABC Textile Ltd', 'Textile', 'Procurement Operations', NULL, 'analyst@procucev.com', 'INR', 'Jan 2023', 'Dec 2023', '2024-04-01', 'SIGNED', 'VALIDATED', 'analyst@procucev.com', 'APPROVED', 'E2E Procurement Analysis', 0, 613.8805, 613.8805, 613.8805, NULL, 0, 110.498, 88.398, 13.26, 75.138, 69.127, NULL, NULL, 9.2082, 75.138, 12.24, '2026-10-11T14:08:42.719Z', '2026-10-22T08:06:47.121Z'),
('AIC-2026-0003', 'CUST-2026-0003', 'PQR Cement Ltd', 'Cement', 'Procurement Operations', NULL, 'analyst@procucev.com', 'INR', 'April 2021', 'March 2022', '2026-10-08', 'SIGNED', 'VALIDATED', 'analyst@procucev.com', 'ANALYSIS_IN_PROGRESS', 'end to end testing', 0, 262.6412, 262.6412, 262.6412, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-12T18:42:51.519Z', '2026-10-13T05:08:49.469Z'),
('AIC-2026-0001', 'CUST-2026-0004', '[TEST DATA] Varroc Polymers (VGT Regression Baseline)', 'Automotive & Polymers', NULL, NULL, 'analyst@procucev.com', 'INR', 'April 2021', 'January 2022', '2026-04-01T10:00:00.000Z', 'SIGNED', 'VALIDATED', 'analyst@procucev.com', 'APPROVED', NULL, 1, 4073.8307, 4073.8307, 3920.3277, NULL, 153.5029, 443.621, 441.833, 104.067, 337.766, 319.439, 31.944, 79.86, 31.6921, 378.4, 9.29, '2026-04-01T09:00:00.000Z', '2026-10-24T14:56:17.367Z');

-- 5. Spend Category Summaries (10 Categories summing exactly to 556.5347 Cr)
INSERT OR IGNORE INTO SpendCategorySummary (
  id, name, category, spend, spend_inr, spend_inr_crores, targetReductionPct, lineItemsCount, color, column_l_code,
  spend_2023, spend_2024, spend_2025_26, spend_inr_2023, spend_inr_2024, spend_inr_2025_26, spend_fy24_cr, spend_fy25_cr, spend_fy26_cr,
  vendor_count, item_count, share_pct
) VALUES 
('CAT-1', 'Direct Raw Materials & Chemicals', 'Direct Raw Materials & Chemicals', 25596658, 2145000000, 214.5000, 8.5, 9420, '#0284c7', 'MAT-DIR-RAW', 68.20, 72.10, 74.20, 682000000, 721000000, 742000000, 68.20, 72.10, 74.20, 240, 95, 38.54),
('CAT-2', 'Corrugated Boxes & Primary Packaging', 'Corrugated Boxes & Primary Packaging', 9826968, 823500000, 82.3500, 9.2, 4810, '#0ea5e9', 'MAT-PKG-BOX', 26.10, 27.80, 28.45, 261000000, 278000000, 284500000, 26.10, 27.80, 28.45, 125, 62, 14.80),
('CAT-3', 'Heavy Mechanical Spares & Bearings', 'Heavy Mechanical Spares & Bearings', 7661097, 642000000, 64.2000, 7.8, 3650, '#38bdf8', 'MRO-SPARES', 20.40, 21.60, 22.20, 204000000, 216000000, 222000000, 20.40, 21.60, 22.20, 180, 74, 11.54),
('CAT-4', 'Secondary Process Chemicals', 'Secondary Process Chemicals', 5745823, 481500000, 48.1500, 6.5, 2940, '#06b6d4', 'CHEM-PROC-SEC', 15.20, 16.30, 16.65, 152000000, 163000000, 166500000, 15.20, 16.30, 16.65, 88, 41, 8.65),
('CAT-5', 'Structural Steel & Fabrication Plates', 'Structural Steel & Fabrication Plates', 5083532, 426000000, 42.6000, 8.0, 2310, '#14b8a6', 'MET-STEEL-FAB', 13.50, 14.40, 14.70, 135000000, 144000000, 147000000, 13.50, 14.40, 14.70, 72, 33, 7.65),
('CAT-6', 'Inbound Logistics & Surface Freight', 'Inbound Logistics & Surface Freight', 4224343, 354000000, 35.4000, 10.5, 2100, '#10b981', 'LOG-FREIGHT-IN', 11.20, 11.90, 12.30, 112000000, 119000000, 123000000, 11.20, 11.90, 12.30, 54, 22, 6.36),
('CAT-7', 'Electrical Switchgears & Automation', 'Electrical Switchgears & Automation', 3430787, 287500000, 28.7500, 6.8, 1820, '#84cc16', 'ELEC-AUTO-SW', 9.10, 9.70, 9.95, 91000000, 97000000, 99500000, 9.10, 9.70, 9.95, 65, 38, 5.17),
('CAT-8', 'Factory Utilities & Thermal Fuels', 'Factory Utilities & Thermal Fuels', 2541766, 213000000, 21.3000, 5.5, 1420, '#eab308', 'UTIL-FUEL-TH', 6.80, 7.20, 7.30, 68000000, 72000000, 73000000, 6.80, 7.20, 7.30, 32, 14, 3.83),
('CAT-9', 'Consumables & Operational PPE', 'Consumables & Operational PPE', 1414081, 118500000, 11.8500, 7.0, 1210, '#f97316', 'OPS-CONS-PPE', 3.75, 4.00, 4.10, 37500000, 40000000, 41000000, 3.75, 4.00, 4.10, 48, 29, 2.13),
('CAT-10', 'Plant Maintenance & Facility Services', 'Plant Maintenance & Facility Services', 887195, 74347000, 7.4347, 5.0, 1060, '#ef4444', 'FAC-MAINT-SRV', 2.35, 2.50, 2.5847, 23500000, 25000000, 25847000, 2.35, 2.50, 2.5847, 36, 17, 1.33);

-- 6. Category Year Details
INSERT OR IGNORE INTO CategoryYearDetail (
  id, rank, category, core_bucket, sample_column_l_code, sample_column_l_title, spend_2023, spend_2024, spend_2025_26,
  total_3yr_spend, spend_inr_2023_cr, spend_inr_2024_cr, spend_inr_2025_26_cr, spend_fy24_cr, spend_fy25_cr, spend_fy26_cr,
  total_3yr_spend_inr_cr, yoy_growth_pct, line_items_count, color, is_balance_category
) VALUES 
('CYD-1', 1, 'Direct Raw Materials & Chemicals', 'Direct Materials', 'MAT-DIR-RAW', 'Primary Chemical Precursors', 68.20, 72.10, 74.20, 214.50, 68.20, 72.10, 74.20, 68.20, 72.10, 74.20, 214.50, 4.3, 9420, '#0284c7', 0),
('CYD-2', 2, 'Corrugated Boxes & Primary Packaging', 'Packaging', 'MAT-PKG-BOX', 'Heavy Duty Corrugated Cartons', 26.10, 27.80, 28.45, 82.35, 26.10, 27.80, 28.45, 26.10, 27.80, 28.45, 82.35, 4.4, 4810, '#0ea5e9', 0),
('CYD-3', 3, 'Heavy Mechanical Spares & Bearings', 'MRO Spares', 'MRO-SPARES', 'Spherical Roller Bearings', 20.40, 21.60, 22.20, 64.20, 20.40, 21.60, 22.20, 20.40, 21.60, 22.20, 64.20, 4.3, 3650, '#38bdf8', 0),
('CYD-4', 4, 'Secondary Process Chemicals', 'Direct Materials', 'CHEM-PROC-SEC', 'Soda Ash & Refining Agents', 15.20, 16.30, 16.65, 48.15, 15.20, 16.30, 16.65, 15.20, 16.30, 16.65, 48.15, 4.6, 2940, '#06b6d4', 0),
('CYD-5', 5, 'Structural Steel & Fabrication Plates', 'CapEx & Metal', 'MET-STEEL-FAB', 'Hot Rolled Steel Plates 12mm', 13.50, 14.40, 14.70, 42.60, 13.50, 14.40, 14.70, 13.50, 14.40, 14.70, 42.60, 4.3, 2310, '#14b8a6', 0),
('CYD-6', 6, 'Inbound Logistics & Surface Freight', 'Logistics', 'LOG-FREIGHT-IN', 'Primary Road Cargo Transport', 11.20, 11.90, 12.30, 35.40, 11.20, 11.90, 12.30, 11.20, 11.90, 12.30, 35.40, 4.8, 2100, '#10b981', 0),
('CYD-7', 7, 'Electrical Switchgears & Automation', 'Plant Electrical', 'ELEC-AUTO-SW', 'Motor Control Centers & Relays', 9.10, 9.70, 9.95, 28.75, 9.10, 9.70, 9.95, 9.10, 9.70, 9.95, 28.75, 4.5, 1820, '#84cc16', 0),
('CYD-8', 8, 'Factory Utilities & Thermal Fuels', 'Utilities', 'UTIL-FUEL-TH', 'Imported Thermal Steam Coal', 6.80, 7.20, 7.30, 21.30, 6.80, 7.20, 7.30, 6.80, 7.20, 7.30, 21.30, 3.6, 1420, '#eab308', 0),
('CYD-9', 9, 'Consumables & Operational PPE', 'Plant Safety', 'OPS-CONS-PPE', 'Safety Helmets, Boots & Gloves', 3.75, 4.00, 4.10, 11.85, 3.75, 4.00, 4.10, 3.75, 4.00, 4.10, 11.85, 4.5, 1210, '#f97316', 0),
('CYD-10', 10, 'Plant Maintenance & Facility Services', 'Services', 'FAC-MAINT-SRV', 'Facility AMC & Civil Repairs', 2.35, 2.50, 2.5847, 7.4347, 2.35, 2.50, 2.5847, 2.35, 2.50, 2.5847, 7.4347, 4.8, 1060, '#ef4444', 0);

-- 7. Top Vendors
INSERT OR IGNORE INTO VendorYearDetail (
  id, rank, vendor_name, master_vendor_id, primary_category, sample_column_l_code, sample_column_l_title,
  spend_fy24_cr, spend_fy25_cr, spend_fy26_cr, total_3yr_spend_inr_cr, yoy_growth_pct, line_items_count, color, risk_status, price_creep_pct, is_balance_vendor
) VALUES 
('VYD-1', 1, 'Tata Chemicals Ltd', 'VEND-TATA-CHEM', 'Direct Raw Materials & Chemicals', 'MAT-DIR-RAW', 'Soda Ash Dense & Light', 22.40, 23.80, 24.60, 70.80, 4.8, 1420, '#0284c7', 'ALIGNED', 1.8, 0),
('VYD-2', 2, 'Packaging India Corporation', 'VEND-PKG-IND', 'Corrugated Boxes & Primary Packaging', 'MAT-PKG-BOX', 'Heavy Duty Cartons', 14.20, 15.10, 15.50, 44.80, 4.5, 860, '#0ea5e9', 'ALIGNED', 2.1, 0),
('VYD-3', 3, 'SKF India Bearings Ltd', 'VEND-SKF-BRG', 'Heavy Mechanical Spares & Bearings', 'MRO-SPARES', 'Tapered Roller Bearings', 11.50, 12.20, 12.60, 36.30, 4.6, 740, '#38bdf8', 'MODERATE_RISK', 3.4, 0),
('VYD-4', 4, 'Steel Authority of India Ltd (SAIL)', 'VEND-SAIL-MET', 'Structural Steel & Fabrication Plates', 'MET-STEEL-FAB', 'Mild Steel Plates IS 2062', 9.80, 10.40, 10.70, 30.90, 4.4, 620, '#14b8a6', 'ALIGNED', 1.5, 0),
('VYD-5', 5, 'Adani Logistics Surface Cargo', 'VEND-ADANI-LOG', 'Inbound Logistics & Surface Freight', 'LOG-FREIGHT-IN', 'Primary Full Truckload Transport', 8.20, 8.70, 9.00, 25.90, 4.8, 510, '#10b981', 'ALIGNED', 2.2, 0),
('VYD-6', 6, 'Schneider Electric India Pvt Ltd', 'VEND-SCHN-ELEC', 'Electrical Switchgears & Automation', 'ELEC-AUTO-SW', 'Air Circuit Breakers & PLC', 6.40, 6.80, 7.00, 20.20, 4.5, 430, '#84cc16', 'ALIGNED', 1.9, 0),
('VYD-7', 7, 'Grasim Industries Chemical Div', 'VEND-GRASIM-CH', 'Secondary Process Chemicals', 'CHEM-PROC-SEC', 'Caustic Soda Lye 48%', 5.60, 6.00, 6.20, 17.80, 5.1, 380, '#06b6d4', 'ALIGNED', 2.0, 0),
('VYD-8', 8, 'Coal India Ltd (Western Coalfields)', 'VEND-COAL-IND', 'Factory Utilities & Thermal Fuels', 'UTIL-FUEL-TH', 'Non-Coking Coal G11 Grade', 4.80, 5.10, 5.20, 15.10, 3.9, 290, '#eab308', 'ALIGNED', 1.2, 0),
('VYD-9', 9, '3M India Industrial Safety', 'VEND-3M-IND', 'Consumables & Operational PPE', 'OPS-CONS-PPE', 'Safety Respirators & PPE', 2.80, 3.00, 3.10, 8.90, 5.2, 220, '#f97316', 'ALIGNED', 2.4, 0),
('VYD-10', 10, 'L&T Technology & Facility Services', 'VEND-LT-SRV', 'Plant Maintenance & Facility Services', 'FAC-MAINT-SRV', 'Mechanical Maintenance AMC', 1.80, 1.90, 1.9847, 5.6847, 4.3, 190, '#ef4444', 'ALIGNED', 1.7, 0);

-- 8. Vendor Price Rankings
INSERT OR IGNORE INTO VendorPriceRank (
  vendor_name, master_id, category, price_creep_pct, total_spend, total_spend_inr_cr, risk_status, variance_leakage_usd, variance_leakage_inr_cr, benchmark_index, last_36mo_trend
) VALUES 
('Tata Chemicals Ltd', 'VEND-TATA-CHEM', 'Direct Raw Materials & Chemicals', 1.8, 8448687, 70.80, 'ALIGNED', 152000, 1.27, 'ICIS Soda Ash', '[22.4, 23.8, 24.6]'),
('Packaging India Corporation', 'VEND-PKG-IND', 'Corrugated Boxes & Primary Packaging', 2.1, 5346062, 44.80, 'ALIGNED', 114000, 0.95, 'PCBI Kraft Paper', '[14.2, 15.1, 15.5]'),
('SKF India Bearings Ltd', 'VEND-SKF-BRG', 'Heavy Mechanical Spares & Bearings', 3.4, 4331742, 36.30, 'MODERATE_RISK', 148000, 1.24, 'PCBI Industrial Bearing', '[11.5, 12.2, 12.6]'),
('Steel Authority of India Ltd (SAIL)', 'VEND-SAIL-MET', 'Structural Steel & Fabrication Plates', 1.5, 3687350, 30.90, 'ALIGNED', 56000, 0.47, 'Platts HRC Steel', '[9.8, 10.4, 10.7]'),
('Adani Logistics Surface Cargo', 'VEND-ADANI-LOG', 'Inbound Logistics & Surface Freight', 2.2, 3090692, 25.90, 'ALIGNED', 68000, 0.57, 'Diesel Freight Index', '[8.2, 8.7, 9.0]');

-- 9. Savings Opportunities (10 Levers)
INSERT OR IGNORE INTO SavingsOpportunity (
  opp_id, category, title, current_spend, current_spend_inr_cr, target_savings_pct, est_savings, est_savings_inr_cr, savings_percentage,
  lever, recommended_action, push_to_module, recommended_module, status, risk_level, contract_leak_type, complexity, confidence_score
) VALUES 
('OPP-001', 'Direct Raw Materials & Chemicals', 'Direct Price Benchmark Alignment on Soda Ash', 708000000, 70.80, 7.5, 53100000, 5.31, 7.5, 'Direct Price Renegotiation', 'Align unit contract price with global ICIS baseline and quarterly volume commitment rebate.', 'proCPX', 'proCPX', 'Identified', 'Low', 'Price Variance', 'Low', 0.95),
('OPP-002', 'Corrugated Boxes & Primary Packaging', 'Supplier Consolidation & GSM Standardization', 448000000, 44.80, 8.2, 36736000, 3.67, 8.2, 'Supplier Consolidation', 'Consolidate 12 regional box converters down to 3 national tier-1 suppliers with standardized GSM specs.', 'proCPX', 'proCPX', 'Identified', 'Low', 'Fragmented Volume', 'Low', 0.92),
('OPP-003', 'Heavy Mechanical Spares & Bearings', 'OEM to Authorized Direct Master Purchase Agreement', 363000000, 36.30, 9.0, 32670000, 3.27, 9.0, 'Volume Pooling', 'Bypass intermediary distributors and negotiate centralized annual rate card directly with SKF / FAG.', 'proCPX', 'proCPX', 'Identified', 'Medium', 'Intermediary Markups', 'Medium', 0.90),
('OPP-004', 'Structural Steel & Fabrication Plates', 'Steel Index Formula-Based Quarterly Contracting', 309000000, 30.90, 6.8, 21012000, 2.10, 6.8, 'PCBI Indexation', 'Peg steel procurement contracts to Platts Hot Rolled Coil index + fixed conversion delta.', 'proCPX', 'proCPX', 'Identified', 'Low', 'Unpegged Inflation', 'Low', 0.94),
('OPP-005', 'Inbound Logistics & Surface Freight', 'Reverse E-Auction on High-Density Truckload Lanes', 259000000, 25.90, 11.0, 28490000, 2.85, 11.0, 'E-Auctions', 'Execute multi-round competitive e-auction on top 15 freight routes across Maharashtra and Gujarat.', 'DPS NXT', 'DPS NXT', 'Identified', 'Low', 'Ad-hoc Spot Rates', 'Low', 0.96),
('OPP-006', 'Secondary Process Chemicals', 'Harmonized Technical Specs & Alternate Source Trial', 178000000, 17.80, 8.5, 15130000, 1.51, 8.5, 'Specification Harmonization', 'Harmonize chemical purity specifications across plants to enable dual-sourcing.', 'proCPX', 'proCPX', 'Identified', 'Medium', 'Single Source Spec', 'Medium', 0.88),
('OPP-007', 'Electrical Switchgears & Automation', 'Consolidated Corporate Rate Card & Framework Agreement', 202000000, 20.20, 7.2, 14544000, 1.45, 7.2, 'Volume Pooling', 'Aggregate plant-level switchgear purchases into corporate framework agreement with Schneider & ABB.', 'proCPX', 'proCPX', 'Identified', 'Low', 'Decentralized Spend', 'Low', 0.91),
('OPP-008', 'Factory Utilities & Thermal Fuels', 'Coal Supply Index Linkage & GCV Audit Integration', 151000000, 15.10, 6.0, 9060000, 0.91, 6.0, 'Contract Compliance', 'Tie billing strictly to third-party validated GCV (Gross Calorific Value) certificates on delivery.', 'proCPX', 'proCPX', 'Identified', 'Medium', 'Energy Loss Under-spec', 'Medium', 0.89),
('OPP-009', 'Consumables & Operational PPE', 'Vendor Managed Inventory (VMI) & Fast-Mover Catalog', 89000000, 8.90, 10.5, 9345000, 0.93, 10.5, 'Demand Rationalization', 'Deploy punchout digital catalog for plant safety equipment with standard consumption caps.', 'DPS NXT', 'DPS NXT', 'Identified', 'Low', 'Maverick Buying', 'Low', 0.93),
('OPP-010', 'Plant Maintenance & Facility Services', 'Consolidated Multi-Plant Facility Management Contract', 56847000, 5.6847, 7.8, 4434066, 0.4434, 7.8, 'Supplier Consolidation', 'Consolidate civil, electrical and mechanical maintenance services under unified SLA contract.', 'proCPX', 'proCPX', 'Identified', 'Low', 'Fragmented Vendor Base', 'Low', 0.90);

-- Savings action plans are editable D1 records, not client-side sample rows.
INSERT OR IGNORE INTO ActionPlanItem (
  id, opp_id, title, lever, category, est_savings_inr_cr, owner, quarter, status, created_at, updated_at
) VALUES
('ACT-001', 'OPP-001', 'Align Soda Ash contract pricing to approved ICIS benchmark and secure quarterly volume rebates.', 'Direct Price Renegotiation', 'Direct Raw Materials & Chemicals', 5.31, 'Procurement', 'Q4 2026', 'IN_PROGRESS', '2026-09-20T00:00:00Z', '2026-10-29T00:00:00Z'),
('ACT-002', 'OPP-002', 'Consolidate regional box converters and approve a common GSM specification.', 'Supplier Consolidation', 'Corrugated Boxes & Primary Packaging', 3.67, 'SCM', 'Q4 2026', 'PLANNED', '2026-09-20T00:00:00Z', '2026-09-20T00:00:00Z'),
('ACT-003', 'OPP-005', 'Run a competitive e-auction for the highest-spend freight lanes.', 'E-Auctions', 'Inbound Logistics & Surface Freight', 2.85, 'Procurement', 'Q1 2027', 'PLANNED', '2026-09-20T00:00:00Z', '2026-09-20T00:00:00Z');

INSERT OR IGNORE INTO ActionPlanItemDetails (action_id, target_date, priority, comments) VALUES
('ACT-001', '2026-12-15', 'HIGH', 'Use the approved ICIS benchmark and document the agreed rebate tiers.'),
('ACT-002', '2026-12-31', 'HIGH', 'Consolidate the supplier cohort after technical specification approval.'),
('ACT-003', '2027-03-31', 'MEDIUM', 'Keep route-level baseline and supplier bids in the sourcing evidence pack.');

-- 10. Conversion Funnel Phases
INSERT OR IGNORE INTO ConversionFunnelPhase (
  phase_num, phase_name, platform_actionable_focus, value_outcome_delivered, commercial_lock_in_metric, completion_pct, status,
  spend_evaluated_cr, count_elements, percentage_leakage_identified
) VALUES 
(1, 'Dataset Ingestion & ETL Normalization', 'Multi-Currency Live FX & Pre-ETL Anomaly Detection', 'Unified base currency spend view with OCR validation', 'Data Ingestion SLA Verified (<800ms query latency)', 100, 'Completed', 556.5347, 30740, 100.0),
(2, 'AI UNSPSC Taxonomy & Entity Resolution', 'Dual-Engine Classification (Gemini AI + UNSPSC Dictionary)', 'Automated spend family categorization to 8-digit UNSPSC', 'Classification Confidence > 92%', 100, 'Completed', 556.5347, 10, 96.4),
(3, 'Strategic Sourcing & Market Discovery', '10 Strategic Sourcing Levers & Supplier Volatility Ranking', 'Actionable sourcing opportunity ledger across 1,537 suppliers', 'Addressable Spend Mapped > 85%', 85, 'In Progress', 489.2000, 50, 85.0),
(4, 'PCBI Benchmark Intelligence', 'Commodity Price Index Tracking & Should-Cost Modeling', 'Dynamic price variance tracking against CRU, Platts, ICIS', 'Benchmarkability Coverage > 75%', 60, 'Upcoming', 320.0000, 6, 65.0),
(5, 'Savings Engine & Sourcing Execution', 'Executive Opportunity Brief & Sourcing Push to proCPX / DPS NXT', 'Audited net defensible savings delivery of ₹42.45 Cr (7.63%)', 'Verified CFO Value Delivery Sign-Off', 40, 'Upcoming', 42.4500, 10, 42.45);

-- 11. PCBI Benchmarks
INSERT OR IGNORE INTO PCBIBenchmarkMaster (
  id, pcbi_id, sector, category, sub_category, unspsc_segment, unspsc_family, unspsc_class, unspsc_commodity,
  benchmark_name, benchmark_source, source_series, benchmark_unit, currency, geography, benchmark_type,
  benchmarkability_percent, residual_percent, quality_rating, calculation_method, benchmark_scope, applicable_sectors,
  gap_handling_method, effective_from, version, notes, active
) VALUES 
('pcbi-bm-001', 'PCBI-STEEL-001', 'Multi-Sector', 'Ferrous Metals & Structural Steel', 'Hot Rolled Coils & Plates', '30000000', '30260000', '30263600', '30263601', 'CRU / Platts Hot Rolled Steel Benchmark', 'Approved Industrial Metal Indices', 'CRU-STEEL-HRC-DOM', 'MT', 'INR', 'India National & Ex-Works', 'SINGLE', 75, 25, 'A', 'P0*(1-B) + P0*B*(I1/I0)', 'MULTI_SECTOR', '["Cement","Steel","Automotive","Engineering","Manufacturing","Packaging"]', 'FORWARD_FILL', '2020-04-01', 1, 'Primary benchmark for structural steel and wear plates.', 1),
('pcbi-bm-002', 'PCBI-BRG-COMP-001', 'Multi-Sector', 'Bearings & Power Transmission', 'Industrial Roller & Ball Bearings', '31000000', '31170000', '31171500', '31171504', 'Composite Industrial Bearing Index', 'Multi-Source Composite PCBI Model', 'PCBI-COMP-BRG-GEN', 'EA', 'INR', 'National & Imported Blend', 'COMPOSITE', 80, 20, 'A', 'P0*(1-B) + P0*B*(I1/I0)', 'MULTI_SECTOR', '["Cement","Steel","Chemicals","Manufacturing"]', 'FORWARD_FILL', '2020-04-01', 1, 'Composite bearing benchmark model.', 1),
('pcbi-bm-003', 'PCBI-CHEM-SODA-001', 'Chemicals', 'Direct Raw Materials & Chemicals', 'Soda Ash Dense & Light', '12000000', '12140000', '12141900', '12141901', 'ICIS Domestic Soda Ash Benchmark', 'ICIS Chemical Market Data', 'ICIS-SODA-ASH-IND', 'MT', 'INR', 'India Domestic', 'SINGLE', 85, 15, 'A', 'P0*(1-B) + P0*B*(I1/I0)', 'SECTOR_SPECIFIC', '["Glass","Chemicals","Textile"]', 'FORWARD_FILL', '2020-04-01', 1, 'Primary feedstock for glassware manufacturing.', 1),
('pcbi-bm-004', 'PCBI-POLY-HDPE-001', 'Packaging', 'Polymers & Resin Packaging', 'High Density Polyethylene (HDPE)', '13000000', '13100000', '13102000', '13102005', 'Platts Polymer HDPE Injection Grade', 'Platts Global Petrochemical', 'PLATTS-HDPE-INJ', 'MT', 'INR', 'Asia / India CFR', 'SINGLE', 80, 20, 'A', 'P0*(1-B) + P0*B*(I1/I0)', 'MULTI_SECTOR', '["Packaging","Automotive","Consumer"]', 'FORWARD_FILL', '2020-04-01', 1, 'Molded container and primary packaging resin.', 1),
('pcbi-bm-005', 'PCBI-ENERGY-COAL-001', 'Utilities', 'Factory Utilities & Thermal Fuels', 'Imported Thermal Steam Coal', '15000000', '15100000', '15101500', '15101505', 'Argus / Coalindo Indonesian Coal Index (ICI 3)', 'Argus Media Energy Indices', 'ARGUS-COAL-5000-GAR', 'MT', 'INR', 'CFR West Coast India', 'SINGLE', 90, 10, 'A', 'P0*(1-B) + P0*B*(I1/I0)', 'MULTI_SECTOR', '["Power","Cement","Glass","Chemicals"]', 'FORWARD_FILL', '2020-04-01', 1, 'Thermal power and boiler fuel benchmark.', 1),
('pcbi-bm-006', 'PCBI-PACK-CORR-001', 'Packaging', 'Corrugated Boxes & Primary Packaging', 'Kraft Linerboard & Medium', '14000000', '14110000', '14111500', '14111507', 'Domestic Kraft Paper Benchmark', 'Indian Paper & Packaging Association', 'IPMA-KRAFT-180BF', 'MT', 'INR', 'India Ex-Mill', 'SINGLE', 70, 30, 'B', 'P0*(1-B) + P0*B*(I1/I0)', 'MULTI_SECTOR', '["FMCG","Glassware","Pharma","Logistics"]', 'FORWARD_FILL', '2020-04-01', 1, 'Raw material benchmark for corrugated shipper cartons.', 1);

-- 12. PCBI Weekly Indices
INSERT OR IGNORE INTO PCBIWeeklyIndex (id, pcbi_id, week_date, index_value, currency, is_projected) VALUES 
('pwi-001-1', 'PCBI-STEEL-001', '2024-01-08', 52500, 'INR', 0),
('pwi-001-2', 'PCBI-STEEL-001', '2024-06-10', 54200, 'INR', 0),
('pwi-001-3', 'PCBI-STEEL-001', '2025-01-06', 53800, 'INR', 0),
('pwi-001-4', 'PCBI-STEEL-001', '2025-06-09', 55100, 'INR', 0),
('pwi-001-5', 'PCBI-STEEL-001', '2026-01-05', 56400, 'INR', 0),
('pwi-001-6', 'PCBI-STEEL-001', '2026-03-30', 57200, 'INR', 0),
('pwi-003-1', 'PCBI-CHEM-SODA-001', '2024-01-08', 31200, 'INR', 0),
('pwi-003-2', 'PCBI-CHEM-SODA-001', '2024-06-10', 32400, 'INR', 0),
('pwi-003-3', 'PCBI-CHEM-SODA-001', '2025-01-06', 31800, 'INR', 0),
('pwi-003-4', 'PCBI-CHEM-SODA-001', '2025-06-09', 32900, 'INR', 0),
('pwi-003-5', 'PCBI-CHEM-SODA-001', '2026-01-05', 33500, 'INR', 0),
('pwi-003-6', 'PCBI-CHEM-SODA-001', '2026-03-30', 34100, 'INR', 0);

-- 13. Customer Records
INSERT OR IGNORE INTO CustomerRecord (customer_id, customer_name, industry, business_unit, region, base_currency, company_website, website_profile_json, contact_email, contact_person, status, notes, created_at, updated_at) VALUES
('CUST-2026-0002', 'ABC Textile Ltd', 'Textile', 'Procurement Operations', NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 'Associated from existing assessment', '2026-10-11T14:08:42.719Z', '2026-10-12T05:09:09.732Z'),
('CUST-2026-0003', 'PQR Cement Ltd', 'Cement', 'Procurement Operations', 'APAC', 'INR', NULL, NULL, 'procucev@abc.com', 'Sri', 'ACTIVE', 'end to end procurement analysis', '2026-10-12T18:39:32.718Z', '2026-10-12T18:39:32.718Z'),
('CUST-2026-0004', '[TEST DATA] Varroc Polymers (VGT Regression Baseline)', 'Automotive & Polymers', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 'Associated from existing assessment', '2026-04-01T09:00:00.000Z', '2026-10-24T14:54:12.172Z'),
('CUST-2026-0005', 'Persistence Verification Client', 'Manufacturing', 'Default BU', NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 'Associated from existing assessment', '2026-10-24T14:54:19.348Z', '2026-10-24T14:54:19.348Z'),
('CUST-2026-0006', 'Client A Corp', 'Automotive', 'Default BU', NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 'Associated from existing assessment', '2026-10-24T14:54:28.388Z', '2026-10-24T14:54:28.394Z'),
('CUST-2026-0007', 'Client B Corp', 'Chemicals', 'Default BU', NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 'Associated from existing assessment', '2026-10-24T14:54:28.391Z', '2026-10-24T14:54:28.391Z'),
('CUST-2026-0008', 'E2E Re-Analysis Client', 'Heavy Engineering', 'Default BU', NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 'Associated from existing assessment', '2026-10-24T14:54:33.004Z', '2026-10-24T14:54:33.046Z');

-- 14. Assessment Data Versions
INSERT OR IGNORE INTO AssessmentDataVersion (
  data_version_id, assessment_id, version_number, file_name, file_size, checksum, uploaded_by, record_count, notes, is_superseded
) VALUES
('DV-001', 'AIC-2026-0001', 1, 'Enterprise_Procurement_Spend_Data.xlsx', 1048576, 'sha256-enterprise-dv001', 'admin@procucev.com', 20505, 'Baseline spend data', 0),
('DV-002', 'AIC-2026-0002', 1, 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx', 2457600, 'sha256-borosil-dv001', 'admin@procucev.com', 30740, 'Borosil FY24 spend extract', 0),
('DV-003', 'AIC-2026-0003', 1, 'Cement2.xlsx', 1843200, 'sha256-cement-dv001', 'analyst@procucev.com', 15200, 'PQR Cement data', 0);

-- 15. Assessment Analysis Runs
INSERT OR IGNORE INTO AssessmentAnalysisRun (
  analysis_run_id, assessment_id, data_version_id, status, total_spend_cr, validated_spend_cr, baseline_spend_cr, fx_impact_cr, addressable_spend_cr, gross_opportunity_cr, overlap_deductions_cr, net_defensible_opportunity_cr, proven_opportunity_cr, delivery_range_min_cr, delivery_range_max_cr, pcbi_analytical_signal_cr, potential_savings_cr, savings_pct, all_gates_passed, is_approved, is_superseded
) VALUES
('RUN-001', 'AIC-2026-0001', 'DV-001', 'COMPLETED', 556.5347, 556.5347, 556.5347, 0, 489.20, 48.65, 6.20, 42.45, 38.10, 35.00, 45.00, 14.80, 42.45, 7.63, 1, 1, 0),
('RUN-002', 'AIC-2026-0002', 'DV-002', 'COMPLETED', 556.5347, 556.5347, 556.5347, 0, 489.20, 48.65, 6.20, 42.45, 38.10, 35.00, 45.00, 14.80, 42.45, 7.63, 1, 1, 0),
('RUN-003', 'AIC-2026-0003', 'DV-003', 'COMPLETED', 262.6412, 262.6412, 262.6412, 0, 230.50, 22.80, 2.90, 19.90, 17.50, 16.00, 21.00, 7.20, 19.90, 7.58, 1, 1, 0);

-- 16. Assessment Audit Logs
INSERT OR IGNORE INTO AssessmentAuditLog (
  id, assessment_id, actor_email, actor_role, action, details_json, timestamp
) VALUES
('LOG-001', 'AIC-2026-0001', 'admin@procucev.com', 'INTERNAL_ADMIN', 'ASSESSMENT_CREATED', '{"assessmentId":"AIC-2026-0001"}', '2026-04-01T09:00:00.000Z'),
('LOG-002', 'AIC-2026-0001', 'admin@procucev.com', 'INTERNAL_ADMIN', 'ANALYSIS_APPROVED', '{"status":"APPROVED"}', '2026-04-10T12:00:00.000Z'),
('LOG-003', 'AIC-2026-0002', 'admin@procucev.com', 'INTERNAL_ADMIN', 'ASSESSMENT_CREATED', '{"assessmentId":"AIC-2026-0002"}', '2026-04-01T09:00:00.000Z'),
('LOG-004', 'AIC-2026-0002', 'admin@procucev.com', 'INTERNAL_ADMIN', 'ANALYSIS_APPROVED', '{"status":"APPROVED"}', '2026-04-15T12:00:00.000Z'),
('LOG-005', 'AIC-2026-0003', 'analyst@procucev.com', 'INTERNAL_SENIOR_ANALYST', 'ASSESSMENT_CREATED', '{"assessmentId":"AIC-2026-0003"}', '2026-10-08T10:00:00.000Z');

-- 17. E-Auction Planning Assumptions (provisional governance inputs; never realized savings)
INSERT OR IGNORE INTO Module2EAuctionPlanningAssumption (
  assumption_id, category_or_material, min_savings_rate, expected_savings_rate, max_savings_rate,
  rate_source, reference_period, applicability, approval_status, approved_by, approved_date,
  confidence, is_planning_assumption_only, notes, updated_by, updated_at
) VALUES
('ASSUMP-PACKAGING', 'Packaging', 0.03, 0.055, 0.09,
 'Industrial Packaging Dynamic Reverse Auction Index', '2023-2025 Historical Dynamic Bidding Indices',
 'Multi-supplier corrugated, polybags, boxes and industrial packaging', 'Proposed Planning Assumption — Approval Required',
 NULL, NULL, 'HIGH', 1, 'Provisional planning assumption. Procurement approval is required before any use.', 'D1 seed', '2026-10-30T00:00:00.000Z'),
('ASSUMP-CHEMICALS', 'Chemicals', 0.02, 0.04, 0.065,
 'Chemical Industry Reverse Auction Procurement Benchmarks', 'FY2023-FY2025',
 'Standardized bulk industrial chemicals and dyes with at least two active suppliers', 'Proposed Planning Assumption — Approval Required',
 NULL, NULL, 'HIGH', 1, 'Provisional planning assumption. Procurement approval is required before any use.', 'D1 seed', '2026-10-30T00:00:00.000Z'),
('ASSUMP-MRO-SPARES', 'MRO', 0.04, 0.07, 0.12,
 'MRO and Standard Hardware Dynamic Bidding Benchmarks', 'FY2023-FY2025',
 'Standardized off-the-shelf industrial parts, fasteners and hardware', 'Proposed Planning Assumption — Approval Required',
 NULL, NULL, 'MEDIUM', 1, 'Provisional planning assumption. Procurement approval is required before any use.', 'D1 seed', '2026-10-30T00:00:00.000Z'),
('ASSUMP-GENERAL-SOURCING', 'DEFAULT', 0.02, 0.035, 0.05,
 'Enterprise Strategic Sourcing Conservative Planning Baseline', 'FY2024-FY2025',
 'Multi-supplier candidate materials with documented price dispersion', 'Proposed Planning Assumption — Approval Required',
 NULL, NULL, 'MEDIUM', 1, 'Provisional planning assumption. Procurement approval is required before any use.', 'D1 seed', '2026-10-30T00:00:00.000Z');
