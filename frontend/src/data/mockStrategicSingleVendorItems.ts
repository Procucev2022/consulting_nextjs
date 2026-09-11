import type { StrategicSingleVendorItem } from '../types';

export const mockStrategicSingleVendorItems: StrategicSingleVendorItem[] = [
  {
    material_code: 'MAT-NKL-9980',
    material_desc: 'Refined Nickel Cathodes & Briquettes (Electrolytic 99.8%)',
    total_spend_inr_cr: 1215.81,
    core_bucket: 'Direct Materials',
    unspsc_code: '11101701',
    unspsc_commodity_title: 'Nickel and nickel alloys',
    unspsc_class_title: 'Non ferrous metals and alloys',
    unspsc_class_code: '11101700',
    unspsc_family_title: 'Minerals and ores and metals',
    segment_code: '11000000',
    primary_vendor: {
      vendor_name: 'TRAFIGURA INDIA PRIVATE LIMITED',
      spend_inr_cr: 1215.81,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 99,
    annual_quantity: 4800,
    unit_of_measure: 'MT',
    po_count: 36,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Critical Sole-Source Exposure: 100% dependency on single global trader. Immediate alternate smelter onboarding & consignment stock SLA mandatory.',
    suggested_action_plan: [
      'Execute multi-sourcing tender allocating min 25% quota to Vale or Glencore',
      'Negotiate LME-indexed collar mechanism to cap spot price volatility',
      'Establish 45-day emergency strategic buffer inventory at port warehouse'
    ]
  },
  {
    material_code: 'MAT-SS-316L',
    material_desc: 'Stainless Steel Melting Scrap Grade 316 (Low Carbon)',
    total_spend_inr_cr: 1546.0,
    core_bucket: 'Direct Materials',
    unspsc_code: '11101804',
    unspsc_commodity_title: 'Stainless steel scrap or waste',
    unspsc_class_title: 'Iron and steel scrap',
    unspsc_class_code: '11101800',
    unspsc_family_title: 'Minerals and ores and metals',
    segment_code: '11000000',
    primary_vendor: {
      vendor_name: 'JINDAL STAINLESS LIMITED',
      spend_inr_cr: 1450.2,
      share_percentage: 93.8,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'OUTOKUMPU DISTRIBUTION',
      spend_inr_cr: 95.8,
      share_percentage: 6.2,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 94,
    annual_quantity: 125000,
    unit_of_measure: 'MT',
    po_count: 58,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Dominant Supplier with Nominal 6.2% Secondary: Secondary supplier has inadequate volume scale to buffer supply shocks. Ramp secondary volume to >= 25%.',
    suggested_action_plan: [
      'Increase secondary supplier allocation from 6.2% to 20% in Q3 contracting cycle',
      'Harmonize quality inspection parameters across both melting yards',
      'Implement dual-rail delivery framework to mitigate regional logistics bottlenecks'
    ]
  },
  {
    material_code: 'MAT-FE-CR70',
    material_desc: 'High Carbon Ferro Chrome (Cr 65-70%, C 6-8%)',
    total_spend_inr_cr: 765.35,
    core_bucket: 'Direct Materials',
    unspsc_code: '11101901',
    unspsc_commodity_title: 'Ferroalloys',
    unspsc_class_title: 'Specialty metals and alloys',
    unspsc_class_code: '11101900',
    unspsc_family_title: 'Minerals and ores and metals',
    segment_code: '11000000',
    primary_vendor: {
      vendor_name: 'GLENCORE INTERNATIONAL AG',
      spend_inr_cr: 720.15,
      share_percentage: 94.1,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'TATA STEEL LIMITED',
      spend_inr_cr: 45.2,
      share_percentage: 5.9,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 92,
    annual_quantity: 45000,
    unit_of_measure: 'MT',
    po_count: 24,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Acute 94.1% Primary Dependency: Secondary supplier at 5.9% is ineffective for crisis diversion. Restructure supply agreement.',
    suggested_action_plan: [
      'Rebalance annual volume commitment: Target 75% Primary / 25% Secondary',
      'Secure quarterly price-matching clause from primary vendor against Tata Steel pricing',
      'Establish technical interchangeability protocol for furnace charging'
    ]
  },
  {
    material_code: 'MAT-NKL-PEL1',
    material_desc: 'High-Purity Carbonyl Nickel Pellets Grade 1',
    total_spend_inr_cr: 410.25,
    core_bucket: 'Direct Materials',
    unspsc_code: '11101705',
    unspsc_commodity_title: 'Nickel refined products',
    unspsc_class_title: 'Non ferrous metals and alloys',
    unspsc_class_code: '11101700',
    unspsc_family_title: 'Minerals and ores and metals',
    segment_code: '11000000',
    primary_vendor: {
      vendor_name: 'VALE INTERNATIONAL SA',
      spend_inr_cr: 410.25,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 97,
    annual_quantity: 1650,
    unit_of_measure: 'MT',
    po_count: 18,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Sole Source on Carbonyl Grade: Highly proprietary refining process. Immediate technical audit of alternative Japanese or European producers needed.',
    suggested_action_plan: [
      'Initiate metallurgical trials on Sumitomo & Norilsk alternative pellet grades',
      'Negotiate 24-month long-term supply agreement with guaranteed capacity allocation',
      'Mandate 60-day safety inventory holding at domestic hub'
    ]
  },
  {
    material_code: 'MAT-DRI-HG',
    material_desc: 'Direct Reduced Iron (DRI / Sponge Iron) High Grade 88% Fe',
    total_spend_inr_cr: 486.7,
    core_bucket: 'Direct Materials',
    unspsc_code: '11101501',
    unspsc_commodity_title: 'Direct reduced iron',
    unspsc_class_title: 'Raw iron materials',
    unspsc_class_code: '11101500',
    unspsc_family_title: 'Minerals and ores and metals',
    segment_code: '11000000',
    primary_vendor: {
      vendor_name: 'TATA STEEL LIMITED',
      spend_inr_cr: 450.2,
      share_percentage: 92.5,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'JSW STEEL LIMITED',
      spend_inr_cr: 36.5,
      share_percentage: 7.5,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 89,
    annual_quantity: 180000,
    unit_of_measure: 'MT',
    po_count: 42,
    mitigation_urgency: 'HIGH_PRIORITY',
    actionable_mitigation: 'Heavy 92.5% Domestic Concentration: Secondary source at 7.5% cannot absorb surge demand during blast furnace scheduled overhauls.',
    suggested_action_plan: [
      'Scale secondary supplier contract allocation to 20-25% across regional plants',
      'Standardize carbon content tolerances to enable immediate interchangeability',
      'Implement joint demand forecasting with quarterly volume reconciliations'
    ]
  },
  {
    material_code: 'MAT-CAT-B79',
    material_desc: 'Specialty Synthesis Catalyst Grade B-79 Bulk (Precious Metal Base)',
    total_spend_inr_cr: 38.41,
    core_bucket: 'Direct Materials',
    unspsc_code: '12352204',
    unspsc_commodity_title: 'Chemicals & Industrial Catalysts',
    unspsc_class_title: 'Compounds and mixtures',
    unspsc_class_code: '12352200',
    unspsc_family_title: 'Chemicals including bio chemicals and gas',
    segment_code: '12000000',
    primary_vendor: {
      vendor_name: 'Acme Chemical Co.',
      spend_inr_cr: 38.41,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 96,
    annual_quantity: 240,
    unit_of_measure: 'KG',
    po_count: 12,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Patented Catalyst Formulation Sole Sourced: Zero substitute in plant process. High risk of unilateral price escalation and lead-time blowout.',
    suggested_action_plan: [
      'Commission R&D synthesis validation for alternative formulation by Johnson Matthey',
      'Lock in 3-year fixed-margin contract with raw precious metal indexing formula',
      'Maintain on-site hermetically sealed emergency re-charge charge'
    ]
  },
  {
    material_code: 'MAT-BX-4040',
    material_desc: 'High-Tensile Corrugated Shipping Cartons 40x40 Multi-Wall',
    total_spend_inr_cr: 45.61,
    core_bucket: 'Packaging Materials',
    unspsc_code: '14121506',
    unspsc_commodity_title: 'Corrugated fiberboard / boxes',
    unspsc_class_title: 'Paperboard and packaging papers',
    unspsc_class_code: '14121500',
    unspsc_family_title: 'Paper materials and products',
    segment_code: '14000000',
    primary_vendor: {
      vendor_name: 'Amcor Packaging Group',
      spend_inr_cr: 42.6,
      share_percentage: 93.4,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'Crown Paper Box',
      spend_inr_cr: 3.01,
      share_percentage: 6.6,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 87,
    annual_quantity: 1450000,
    unit_of_measure: 'PCS',
    po_count: 64,
    mitigation_urgency: 'HIGH_PRIORITY',
    actionable_mitigation: 'Packaging Line Bottleneck Risk: 93.4% spend tied to Amcor. Secondary supplier (6.6%) lacks tooling across all 3 box sizes.',
    suggested_action_plan: [
      'Finance die-cut tooling calibration for Crown Paper Box to handle 30% line volume',
      'Harmonize burst-strength specifications across all finishing plants',
      'Run competitive e-auction for FY27 packaging volume split'
    ]
  },
  {
    material_code: 'MAT-FOIL-250',
    material_desc: 'Sterile Barrier Blister Foil 250mm Pharmaceutical Grade',
    total_spend_inr_cr: 24.8,
    core_bucket: 'Packaging Materials',
    unspsc_code: '14121501',
    unspsc_commodity_title: 'Bleached paperboard and laminates',
    unspsc_class_title: 'Paperboard and packaging papers',
    unspsc_class_code: '14121500',
    unspsc_family_title: 'Paper materials and products',
    segment_code: '14000000',
    primary_vendor: {
      vendor_name: 'Constantia Flexibles Group',
      spend_inr_cr: 24.8,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 95,
    annual_quantity: 85000,
    unit_of_measure: 'SQM',
    po_count: 22,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Regulatory Qualified Single Vendor: Packaging validation locked to single converter. Regulatory re-filing required to add secondary source.',
    suggested_action_plan: [
      'Initiate stability testing for secondary foil laminate supplier (UFlex / Bilcare)',
      'Prepare supplementary regulatory validation dossier for FDA/GMP compliance',
      'Contractually mandate 90-day rolling finished inventory held in vendor cleanrooms'
    ]
  },
  {
    material_code: 'MAT-TAPE-50',
    material_desc: 'Thermal Adhesive Industrial Packaging Tape 50mm Reinforced',
    total_spend_inr_cr: 20.04,
    core_bucket: 'Packaging Materials',
    unspsc_code: '31201501',
    unspsc_commodity_title: 'Packaging Adhesives & Tapes',
    unspsc_class_title: 'Packaging supplies',
    unspsc_class_code: '31201500',
    unspsc_family_title: 'Manufacturing components and supplies',
    segment_code: '31000000',
    primary_vendor: {
      vendor_name: 'Crown Paper Box / Packaging Div',
      spend_inr_cr: 18.4,
      share_percentage: 91.8,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: '3M India Limited',
      spend_inr_cr: 1.64,
      share_percentage: 8.2,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 85,
    annual_quantity: 210000,
    unit_of_measure: 'ROLLS',
    po_count: 38,
    mitigation_urgency: 'HIGH_PRIORITY',
    actionable_mitigation: 'High 91.8% Reliance on Local Converter: Secondary global supplier (3M) underutilized at 8.2% despite superior cold-temperature adhesive specs.',
    suggested_action_plan: [
      'Transfer cold-storage packaging lines (25% volume) to 3M India',
      'Standardize roll core diameter across automated carton sealers',
      'Benchmark unit price parity between primary and secondary converters'
    ]
  },
  {
    material_code: 'MAT-RES-HDPE',
    material_desc: 'High Density Polyethylene Polymer Resin Pellets (HDPE Blow Molding)',
    total_spend_inr_cr: 39.5,
    core_bucket: 'Direct Materials',
    unspsc_code: '13101502',
    unspsc_commodity_title: 'Raw Resins & Synthetic Polymers',
    unspsc_class_title: 'Resins and natural rubbers and elastomers',
    unspsc_class_code: '13101500',
    unspsc_family_title: 'Resin and rubber and elastomeric materials',
    segment_code: '13000000',
    primary_vendor: {
      vendor_name: 'Continental Polymer S.A.',
      spend_inr_cr: 36.5,
      share_percentage: 92.4,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'Synthchem Polymer Corp',
      spend_inr_cr: 3.0,
      share_percentage: 7.6,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 91,
    annual_quantity: 32000,
    unit_of_measure: 'MT',
    po_count: 50,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Feedstock Vulnerability: 92.4% resin sourced from Continental Polymer. Secondary supplier (7.6%) should be scaled to 25% to protect blow molding lines.',
    suggested_action_plan: [
      'Scale secondary supplier contract allocation to 25% in H2 tender',
      'Implement Platts Polymer index-linked pricing across both converters',
      'Audit secondary resin melt-flow index consistency across high-speed cavities'
    ]
  },
  {
    material_code: 'MAT-PUMP-SEAL',
    material_desc: 'Heavy-Duty Hydraulic Fluid Pump Mechanical Seals (Series 40)',
    total_spend_inr_cr: 8.4,
    core_bucket: 'Indirect & MRO',
    unspsc_code: '40151501',
    unspsc_commodity_title: 'Pumps & Compressors Machinery',
    unspsc_class_title: 'Fluid and gas flow equipment',
    unspsc_class_code: '40151500',
    unspsc_family_title: 'Distribution and conditioning systems and equipment',
    segment_code: '40000000',
    primary_vendor: {
      vendor_name: 'Flowserve Industrial Services',
      spend_inr_cr: 8.4,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 93,
    annual_quantity: 340,
    unit_of_measure: 'SETS',
    po_count: 16,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Critical Rotating Equipment Sole Sourced: Unavailability causes unscheduled rolling mill shutdown. Qualify secondary OEM seal refurbisher.',
    suggested_action_plan: [
      'Qualify John Crane as authorized secondary seal refurbisher and vendor',
      'Standardize shaft dimensions across auxiliary pump stations',
      'Implement consignment spares program on-site for immediate swap-out'
    ]
  },
  {
    material_code: 'MAT-BRG-6204',
    material_desc: 'Precision Ceramic Ball Bearings (Series 6204 High RPM)',
    total_spend_inr_cr: 15.11,
    core_bucket: 'Indirect & MRO',
    unspsc_code: '31171501',
    unspsc_commodity_title: 'Bearings & Bushings Component',
    unspsc_class_title: 'Bearings and bushings and wheels and gears',
    unspsc_class_code: '31171500',
    unspsc_family_title: 'Manufacturing components and supplies',
    segment_code: '31000000',
    primary_vendor: {
      vendor_name: 'Apex Precision Bearings Corp',
      spend_inr_cr: 14.2,
      share_percentage: 94.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'SKF India Limited',
      spend_inr_cr: 0.91,
      share_percentage: 6.0,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 88,
    annual_quantity: 12000,
    unit_of_measure: 'UNITS',
    po_count: 28,
    mitigation_urgency: 'HIGH_PRIORITY',
    actionable_mitigation: 'Concentration on Proprietary Distributor: 94.0% spend with Apex. SKF (6.0%) can directly supply at competitive global rates.',
    suggested_action_plan: [
      'Transition high-speed spindle bearings (25% volume) directly to SKF framework agreement',
      'Eliminate distributor markups through direct manufacturer enterprise contract',
      'Establish bearing vibration monitoring baseline to benchmark lifecycle wear'
    ]
  },
  {
    material_code: 'MAT-FRT-TL01',
    material_desc: 'Dedicated Full Truckload Heavy Fleet Corridor Logistics',
    total_spend_inr_cr: 28.5,
    core_bucket: 'Logistics & Freight',
    unspsc_code: '78101801',
    unspsc_commodity_title: 'Road Transport & Fleet Cargo',
    unspsc_class_title: 'Mail and cargo transport',
    unspsc_class_code: '78101800',
    unspsc_family_title: 'Transportation and Storage and Mail Services',
    segment_code: '78000000',
    primary_vendor: {
      vendor_name: 'Global Logistics LLC',
      spend_inr_cr: 28.5,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 92,
    annual_quantity: 2400,
    unit_of_measure: 'TRIPS',
    po_count: 72,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Sole Carrier on Primary Corridor: Capacity shortage or driver strikes halt dispatches. Onboard secondary national fleet operator immediately.',
    suggested_action_plan: [
      'Tender dedicated route lanes: Split 70% Primary / 30% Secondary carrier',
      'Enforce real-time GPS tracking and vehicle placement SLA penalties',
      'Implement multi-carrier freight management system (FMS) routing'
    ]
  },
  {
    material_code: 'MAT-GAS-ARGON',
    material_desc: 'Ultra High-Purity Liquid Argon (99.999% Grade 5.0 Cryogenic)',
    total_spend_inr_cr: 18.04,
    core_bucket: 'Direct Materials',
    unspsc_code: '12141901',
    unspsc_commodity_title: 'Industrial and medical gases',
    unspsc_class_title: 'Inorganic compounds and gases',
    unspsc_class_code: '12141900',
    unspsc_family_title: 'Chemicals including bio chemicals and gas',
    segment_code: '12000000',
    primary_vendor: {
      vendor_name: 'United Industrial Gases Ltd',
      spend_inr_cr: 16.8,
      share_percentage: 93.1,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'Linde India Limited',
      spend_inr_cr: 1.24,
      share_percentage: 6.9,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 90,
    annual_quantity: 8500,
    unit_of_measure: 'TONS',
    po_count: 48,
    mitigation_urgency: 'HIGH_PRIORITY',
    actionable_mitigation: 'Critical Shielding Gas Concentration: 93.1% volume on single supplier. Secondary provider (6.9%) must be connected to dual-manifold storage.',
    suggested_action_plan: [
      'Install dual-manifold cryogenic valve manifold to allow seamless tank filling from Linde',
      'Negotiate take-or-pay flexibility clauses with both gas suppliers',
      'Connect telemetry tank telemetry to automated re-ordering threshold'
    ]
  },
  {
    material_code: 'MAT-REF-RAM',
    material_desc: 'High-Purity Magnesite Ramming Mass Refractory Lining',
    total_spend_inr_cr: 12.4,
    core_bucket: 'Indirect & MRO',
    unspsc_code: '30111501',
    unspsc_commodity_title: 'Refractory materials and linings',
    unspsc_class_title: 'Concrete and cement and masonry',
    unspsc_class_code: '30111500',
    unspsc_family_title: 'Building and Construction Machinery and Accessories',
    segment_code: '30000000',
    primary_vendor: {
      vendor_name: 'Delta Refractories Ltd',
      spend_inr_cr: 12.4,
      share_percentage: 100.0,
      is_primary: true,
      is_secondary_single_digit: false
    },
    risk_level: 'SOLE_SOURCE_CRITICAL',
    risk_score: 94,
    annual_quantity: 4200,
    unit_of_measure: 'MT',
    po_count: 26,
    mitigation_urgency: 'IMMEDIATE_ACTION',
    actionable_mitigation: 'Smelter Hearth Integrity Risk: 100% sole source on furnace lining. Failure or delay stops core steel melting furnace operation.',
    suggested_action_plan: [
      'Initiate furnace trial with RHI Magnesita alternative lining formulation',
      'Establish certified refractory installation training program across shifts',
      'Contractually enforce 60-day dry storage buffer at plant proximity'
    ]
  },
  {
    material_code: 'MAT-VLV-DN50',
    material_desc: 'Forged Stainless Severe Service Gate Valves DN50 PN40',
    total_spend_inr_cr: 19.76,
    core_bucket: 'Indirect & MRO',
    unspsc_code: '40141601',
    unspsc_commodity_title: 'Industrial valves and actuators',
    unspsc_class_title: 'Fluid and gas flow equipment',
    unspsc_class_code: '40141600',
    unspsc_family_title: 'Distribution and conditioning systems and equipment',
    segment_code: '40000000',
    primary_vendor: {
      vendor_name: 'Industrial Valves & Fittings Co',
      spend_inr_cr: 18.2,
      share_percentage: 92.1,
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: {
      vendor_name: 'KSB Valves Limited',
      spend_inr_cr: 1.56,
      share_percentage: 7.9,
      is_primary: false,
      is_secondary_single_digit: true
    },
    risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
    risk_score: 86,
    annual_quantity: 850,
    unit_of_measure: 'PCS',
    po_count: 20,
    mitigation_urgency: 'HIGH_PRIORITY',
    actionable_mitigation: 'Critical High-Pressure Piping Exposure: 92.1% concentrated in single valve manufacturer. Secondary supplier at 7.9% needs volume increase.',
    suggested_action_plan: [
      'Increase KSB Valves order allocation to 30% for upcoming piping expansion projects',
      'Standardize face-to-face flange dimensions to ensure 100% plug-and-play interchangeability',
      'Implement automated valve cycle testing before scheduled maintenance shutdowns'
    ]
  }
];
