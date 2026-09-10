import type { IndustryMaterialProfile } from '../types/industry';

export const INDUSTRY_SECTORS_SERVICES_PART2: IndustryMaterialProfile[] = [
  {
    majorSector: 'Logistics, 3PL & Supply Chain Services',
    minorSector: '3PL Contract Logistics & Warehousing',
    sectorCode: 'LOG-3PL',
    tagline: 'Dedicated Warehousing, Cross-Docking, Inventory Staging & Fulfillment Services',
    description:
      'Contract logistics operations, multi-client distribution centers, temperature-controlled staging, pick-pack fulfillment, and reverse logistics.',
    typicalDirectMaterials: [
      'Dedicated Contract Warehousing Pallet Storage Space',
      'Inventory Inbound Receiving & Cross-Dock Labor',
      'Value-Added Kitting & Sub-Assembly Workstations',
      'Warehouse Management System (WMS) User Licensing',
      'RFID Tagging & Pallet Asset Tracking Services'
    ],
    typicalPackagingMaterials: [
      'Machine Grade Cast Stretch Film (500mm)',
      'Heavy-Duty Corrugated Gaylord Master Cartons',
      'Reusable Plastic Bulk Bins & Totes',
      'Recycled Wood Heat-Treated Pallets (ISPM-15)'
    ],
    typicalLogisticsCategories: [
      'Long-Haul Full Truckload (FTL) Linehaul Routing',
      'Less-Than-Truckload (LTL) Terminal Consolidation',
      'Intermodal Rail Ramp-to-Ramp Drayage',
      'Last-Mile Urban Delivery Fleet Contracting'
    ],
    typicalMroCategories: [
      'Electric Forklift Mast Chains & Lithium Battery Packs',
      'Automated Conveyor Belting & Drive Pulleys',
      'Hydraulic Loading Dock Leveler Repair Kits',
      'Heavy-Duty Industrial Floor Scrubbing Detergents'
    ],
    characteristicUNSPSCPrefixes: ['78', '24', '31', '23'],
    benchmarkSpendSplit: {
      directPct: 45,
      packagingPct: 18,
      logisticsPct: 25,
      mroPct: 12
    },
    categorizationGuidance:
      'Warehousing leases, labor tariffs, and dedicated storage are classified as core direct contract logistics spend.',
    keyKeywords: ['3pl', 'warehousing', 'logistics', 'pallet', 'fulfillment', 'cross-dock', 'freight', 'wms', 'kitting']
  },
  {
    majorSector: 'Logistics, 3PL & Supply Chain Services',
    minorSector: 'Freight Forwarding & Multi-Modal Transit',
    sectorCode: 'LOG-FRT',
    tagline: 'Ocean Container Booking, Air Cargo Charters, Customs Clearance & Multi-Modal Lines',
    description:
      'Global freight forwarding, 20ft/40ft ocean container shipping, air express cargo chartering, customs brokerage, and port demurrage handling.',
    typicalDirectMaterials: [
      'Full Container Load (FCL) Ocean Freight Tariffs',
      'Consolidated Air Cargo Freight Space Booking',
      'Licensed Customs Brokerage & Tariff Classifications',
      'Port Handling & Terminal Operating Surcharges',
      'Cargo Insurance & Marine Transit Coverage'
    ],
    typicalPackagingMaterials: [
      'Container Desiccant Dry Bags & Moisture Poles',
      'Heavy-Duty Cargo Lashing Straps & Ratchets',
      'Inflatable Kraft Dunnage Air Bags (90x180cm)',
      'High-Security Bolt & Cable ISO 17712 Container Seals'
    ],
    typicalLogisticsCategories: [
      'Deep Sea Container Vessel Slot Charters',
      'Port-to-Distribution Center Rail Intermodal Runs',
      'Airport Cargo Ramp Transfer Services',
      'Bonded Customs In-Transit Trucking'
    ],
    typicalMroCategories: [
      'Cargo Netting & Retaining Bulkhead Bars',
      'Container Temperature & GPS Data Loggers',
      'Pallet Scale Calibration Weights & Sensors'
    ],
    characteristicUNSPSCPrefixes: ['78', '24', '41'],
    benchmarkSpendSplit: {
      directPct: 62,
      packagingPct: 10,
      logisticsPct: 24,
      mroPct: 4
    },
    categorizationGuidance:
      'Ocean freight rates, fuel bunker adjustments (BAF), and customs clearance fees are mapped directly to core freight logistics.',
    keyKeywords: ['freight', 'ocean', 'container', 'forwarding', 'customs', 'fcl', 'ltl', 'air cargo', 'demurrage', 'transit']
  },
  {
    majorSector: 'Facility, Real Estate & Corporate Services',
    minorSector: 'Integrated Facilities Management (IFM)',
    sectorCode: 'FAC-IFM',
    tagline: 'Janitorial Services, HVAC Plant Maintenance, Security Guarding & Grounds Upkeep',
    description:
      'Comprehensive campus and plant maintenance, commercial janitorial, HVAC filtration, physical access security, and grounds management.',
    typicalDirectMaterials: [
      'Integrated Facilities Management (IFM) Retainers',
      'Scheduled HVAC Chiller & Air Handler Servicing',
      'Commercial Janitorial & Infection Control Contracts',
      'Security Guarding & Perimeter Patrol Services',
      'Fire Suppression & Life Safety System Inspections'
    ],
    typicalPackagingMaterials: [
      'Commercial Waste Bin Liners & Heavy Bags',
      'Dilution Chemical Cleaning Dispensers',
      'Sanitary Washroom Paper Product Cartons'
    ],
    typicalLogisticsCategories: [
      'Regulated Industrial Waste & Hazardous Removal',
      'Corporate Shuttle Bus Transit Operations',
      'Inter-Building Mailroom Logistics'
    ],
    typicalMroCategories: [
      'Commercial HEPA Air Filters & V-Belts',
      'Commercial LED Light Fixtures & Emergency Ballasts',
      'Plumbing Flush Valves & Sensor Faucets',
      'Proximity Card Readers & Turnstile Actuators'
    ],
    characteristicUNSPSCPrefixes: ['72', '76', '40', '46'],
    benchmarkSpendSplit: {
      directPct: 44,
      packagingPct: 8,
      logisticsPct: 16,
      mroPct: 32
    },
    categorizationGuidance:
      'Campus facilities contracts, HVAC service retainers, and security staffing are identified as core facility management services.',
    keyKeywords: ['facility', 'ifm', 'janitorial', 'hvac', 'security', 'maintenance', 'cleaning', 'waste', 'chiller', 'lighting']
  },
  {
    majorSector: 'Facility, Real Estate & Corporate Services',
    minorSector: 'Corporate Real Estate & Workspace Lease',
    sectorCode: 'FAC-REAL',
    tagline: 'Commercial Office Leases, Workspace Fit-Outs, Utilities & Lease Administration',
    description:
      'Leasing of headquarters buildings, industrial warehouse premises, architectural fit-outs, facility utility sourcing, and lease accounting.',
    typicalDirectMaterials: [
      'Commercial Class-A Office Building Base Rent',
      'Industrial Manufacturing Facility Land Leases',
      'Architectural Workspace Fit-Out & Tenant Improvements',
      'Commercial Electric Grid Power Sourcing Contracts',
      'Municipal Water, Sewer & Stormwater Utility Tariffs'
    ],
    typicalPackagingMaterials: [
      'Office Relocation Crates & Corrugated Packing Totes',
      'Furniture Protective Quilted Moving Blankets',
      'Architectural Blueprint Storage Tubes'
    ],
    typicalLogisticsCategories: [
      'Commercial Office Relocation & Rigging Services',
      'Heavy Machinery Facility Movement Logistics',
      'Executive Office Equipment Delivery'
    ],
    typicalMroCategories: [
      'Modular Partition Wall Systems & Acoustic Panels',
      'Carpet Tile Flooring & Transition Strips',
      'Raised Access Flooring Pedestals & Grommets'
    ],
    characteristicUNSPSCPrefixes: ['80', '72', '30', '83'],
    benchmarkSpendSplit: {
      directPct: 76,
      packagingPct: 3,
      logisticsPct: 11,
      mroPct: 10
    },
    categorizationGuidance:
      'Real estate lease commitments, tenant improvement allowances, and municipal power tariffs are classified as direct corporate property spend.',
    keyKeywords: ['lease', 'real estate', 'rent', 'office', 'utilities', 'fit-out', 'tenant', 'workspace', 'facility']
  },
  {
    majorSector: 'Media, Marketing & Creative Services',
    minorSector: 'Digital Advertising & Programmatic Media',
    sectorCode: 'MEDIA-MKTG',
    tagline: 'Programmatic Ad Buying, Creative Agencies, Performance Marketing & Media Production',
    description:
      'Paid search, programmatic video and display ad networks, influencer marketing, creative agency retainers, and broadcast media production.',
    typicalDirectMaterials: [
      'Programmatic Display & Video Ad Impressions',
      'Paid Search Engine Marketing (SEM) Ad Budgets',
      'Creative Agency of Record (AOR) Monthly Retainers',
      'Video Commercial Production & Sound Design Fees',
      'Social Media Influencer Sponsorship Campaigns'
    ],
    typicalPackagingMaterials: [
      'Promotional VIP Event Gift Packaging Kits',
      'Retail Point-of-Sale (POS) Cardboard Display Stands',
      'Branded PR Sample Product Boxes'
    ],
    typicalLogisticsCategories: [
      'Retail Merchandising Display Drop-Shipping',
      'Commercial Film Set Equipment Transport',
      'Express Courier for Film Master Hard Drives'
    ],
    typicalMroCategories: [
      'Commercial Stock Photography & Video Footage Licenses',
      'Color-Calibrated Studio Display Monitors',
      'Studio Production Grip Clamps & High-Output Bulbs'
    ],
    characteristicUNSPSCPrefixes: ['82', '80', '43'],
    benchmarkSpendSplit: {
      directPct: 70,
      packagingPct: 6,
      logisticsPct: 14,
      mroPct: 10
    },
    categorizationGuidance:
      'Media buys, digital ad networks, and creative agency retainers are categorized as core marketing service spend.',
    keyKeywords: ['marketing', 'advertising', 'agency', 'media', 'creative', 'ad spend', 'campaign', 'branding', 'pr', 'sem']
  },
  {
    majorSector: 'Aerospace & Defense',
    minorSector: 'Commercial Avionics & Aero-Structures',
    sectorCode: 'AERO-DEF',
    tagline: 'Flight Control Avionics, Carbon Composites, FAA/EASA Certified Fasteners & Precision Assemblies',
    description:
      'Commercial aircraft structures, flight computers, titanium airframe forgings, AS9100 certified composites, and radar subsystems.',
    typicalDirectMaterials: [
      'Aerospace Certified Carbon Fiber Pre-Preg Rolls',
      'Aero-Grade Titanium 6Al-4V Forgings & Billets',
      'Flight Management Computer Line-Replaceable Units (LRUs)',
      'FAA/EASA Traceable Fasteners (Inconel, A286 Bolts)',
      'Hydraulic Actuators & Flight Control Servos'
    ],
    typicalPackagingMaterials: [
      'Custom Anti-Static Shock-Absorbing Avionics Cases',
      'Cleanroom Polyethylene Heat-Sealed Airframe Sleeves',
      'Molded Composite Protective Wing-Tip Crates'
    ],
    typicalLogisticsCategories: [
      'AOG (Aircraft On Ground) Emergency Air Couriers',
      'Climate-Controlled Oversized Wing Section Transport',
      'Bonded Aerospace Free-Trade Zone Logistics'
    ],
    typicalMroCategories: [
      'Turbine Engine Borescope Inspection Equipment',
      'Calibrated Torque Wrenches & Avionics Test Benches',
      'Mil-Spec Hydraulic Fluids (Skydrol) & Sealants'
    ],
    characteristicUNSPSCPrefixes: ['25', '31', '32', '41', '78'],
    benchmarkSpendSplit: {
      directPct: 65,
      packagingPct: 6,
      logisticsPct: 15,
      mroPct: 14
    },
    categorizationGuidance:
      'Avionics LRUs, aerospace titanium, and carbon pre-preg are classified as core direct aerospace components.',
    keyKeywords: ['avionics', 'aerospace', 'aircraft', 'titanium', 'composites', 'carbon fiber', 'flight control', 'as9100', 'aog']
  },
  {
    majorSector: 'Metals & Mining',
    minorSector: 'Primary Steel & Ferrous Smelting',
    sectorCode: 'MET-STEEL',
    tagline: 'Iron Ore Pellets, Coking Coal, Scrap Metal, Blast Furnace Refractories & Billets',
    description:
      'Blast furnace ironmaking, basic oxygen furnaces, electric arc furnaces (EAF), continuous slab casting, and hot-rolled coil rolling.',
    typicalDirectMaterials: [
      'High-Grade Iron Ore Pellets & Fines (65% Fe)',
      'Metallurgical Coking Coal & Anthracite',
      'Heavy Melting Scrap Metal (HMS 1/2)',
      'Ferroalloys (Ferrosilicon, Ferromanganese, Ferrochrome)',
      'Direct Reduced Iron (DRI) / Hot Briquetted Iron (HBI)'
    ],
    typicalPackagingMaterials: [
      'High-Tensile Steel Coil Strapping & Seal Clips',
      'Rust-Inhibiting Heavy VCI Paper Coil Wraps',
      'Heavy Timber Dunnage Blocks & Chocks'
    ],
    typicalLogisticsCategories: [
      'Cape-Size Bulk Vessel Raw Material Shipping',
      'Dedicated Heavy-Haul Mineral Rail Hopper Cars',
      'Slag & Scrap Metal Yard Transloading Services'
    ],
    typicalMroCategories: [
      'Blast Furnace Magnesite Refractory Bricks',
      'Electric Arc Furnace (EAF) Graphite Electrodes',
      'Rolling Mill Chilled Cast Iron Work Rolls',
      'Slag Pot Carrier Hydraulic Cylinder Seals'
    ],
    characteristicUNSPSCPrefixes: ['11', '12', '15', '30', '78'],
    benchmarkSpendSplit: {
      directPct: 62,
      packagingPct: 6,
      logisticsPct: 18,
      mroPct: 14
    },
    categorizationGuidance:
      'Iron ore, coking coal, scrap metal, and ferroalloys are evaluated as primary direct smelting feedstocks.',
    keyKeywords: ['steel', 'iron ore', 'ferroalloys', 'refractory', 'coking coal', 'scrap metal', 'furnace', 'billet', 'smelting']
  }
];
