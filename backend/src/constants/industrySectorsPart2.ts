import type { IndustryMaterialProfile } from '../types/industry';

export const INDUSTRY_SECTORS_PART2: IndustryMaterialProfile[] = [
  {
    majorSector: 'Consumer Packaged Goods (CPG)',
    minorSector: 'Packaging & Paperboard',
    sectorCode: 'CPG-PACK',
    tagline: 'Corrugated Cartons, Folding Boxes, Barrier Films & Sustainable Substrates',
    description:
      'Conversion of bleached pulp, kraft liner, recycled fluting, flexible barrier laminates, and food-grade packaging.',
    typicalDirectMaterials: [
      'Virgin Bleached Kraftliner & Fluting Rolls',
      'Coated Duplex & Triplex Paperboard Sheets',
      'Biaxially Oriented Polypropylene (BOPP) Film',
      'Hot Melt Adhesives & Water-Based Inks',
      'Biodegradable Starch Polymers'
    ],
    typicalPackagingMaterials: [
      'Baling Wire & Steel Core Straps',
      'Heavy Edgeboard Corner Protectors',
      'High-Tension Coreless Stretch Film',
      'Top Wooden Pallet Caps (1200x800)'
    ],
    typicalLogisticsCategories: [
      'High-Cube Dedicated Dry Van Truckloads',
      'Regional Multi-Drop Retail Fleet Delivery',
      'Returnable Plastic Pallet Pool Leasing',
      'Paper Mill Railcar Logistics'
    ],
    typicalMroCategories: [
      'Rotary Die Cutting Blades & Creasing Rules',
      'Corrugator Belt Belting & Steam Joint Rings',
      'Flexographic Printing Plates & Anilox Rolls',
      'Glue Application Nozzles & Heated Hoses'
    ],
    characteristicUNSPSCPrefixes: ['14', '13', '31', '24', '78'],
    benchmarkSpendSplit: {
      directPct: 64,
      packagingPct: 14,
      logisticsPct: 14,
      mroPct: 8
    },
    categorizationGuidance:
      'Paper rolls, laminates, printing inks, and hot melts are classified as direct substrate conversion components.',
    keyKeywords: ['corrugated', 'kraftliner', 'paperboard', 'bopp', 'adhesive', 'printing ink', 'die cutting', 'carton']
  },
  {
    majorSector: 'Consumer Packaged Goods (CPG)',
    minorSector: 'Food & Beverage Processing',
    sectorCode: 'CPG-FOOD',
    tagline: 'Agricultural Ingredients, Dairy, Flavourings, Aseptic Packs & Cold Chain',
    description:
      'Processing of organic food inputs, bulk commodities, aseptic bottling, confectionery, and refrigerated retail packs.',
    typicalDirectMaterials: [
      'Refined Sugar, Edible Oils & Flour Bulk',
      'Dairy Concentrates & Milk Powder Sacks',
      'Natural Flavours, Emulsifiers & Vitamin Blends',
      'Aseptic Multilayer Liquid Packaging Boards',
      'PET Resin Preforms & Bottle Closures'
    ],
    typicalPackagingMaterials: [
      'Aseptic Brick Liquid Cartons (TETRA)',
      'Corrugated Retail Ready Trays (RRP)',
      'Multilayer Barrier Pouches & Gas Flush Bags',
      'Food Grade Pallet Liners & Dividers'
    ],
    typicalLogisticsCategories: [
      'Refrigerated Reefer Fleet Transport (+2C to +4C)',
      'Frozen Deep Cold Logistics (-18C)',
      'Sanitized Insulated Milk Tanker Logistics',
      'Automated Distribution Center Warehousing'
    ],
    typicalMroCategories: [
      'Food Grade USDA H1 Synthetic Lubricants',
      'Sanitary Tri-Clamp Gaskets (EPDM/Silicon)',
      'Pasteurizer Plate Heat Exchanger Seals',
      'Clean-in-Place (CIP) Caustic Detergents'
    ],
    characteristicUNSPSCPrefixes: ['50', '14', '24', '40', '78'],
    benchmarkSpendSplit: {
      directPct: 52,
      packagingPct: 26,
      logisticsPct: 15,
      mroPct: 7
    },
    categorizationGuidance:
      'Food grade ingredients and aseptic packaging form >75% of spend; cold-chain transport is prioritized as logistics.',
    keyKeywords: ['flavour', 'sugar', 'edible oil', 'dairy', 'aseptic', 'pet preform', 'reefer', 'carton', 'cip']
  },
  {
    majorSector: 'Healthcare & Life Sciences',
    minorSector: 'Pharmaceuticals & Active APIs',
    sectorCode: 'LIFE-PHARMA',
    tagline: 'Active Pharmaceutical Ingredients, Excipients, Cleanroom & Cold Chain',
    description:
      'Synthesis of GMP chemical actives, tablet compression, injectables, sterile compounding, and serialized clinical distribution.',
    typicalDirectMaterials: [
      'Active Pharmaceutical Ingredients (API Pure)',
      'Microcrystalline Cellulose & Starch Excipients',
      'Sterile Water for Injection (WFI Ampoules)',
      'Hard Gelatin & HPMC Capsule Shells',
      'USP Grade Organic Chemical Precursors'
    ],
    typicalPackagingMaterials: [
      'Alu-Alu Cold Form Blister Barrier Foil',
      'Type I Borosilicate Glass Vials & Rubber Stoppers',
      'Child-Resistant HDPE Pharmaceutical Bottles',
      'Tamper-Evident Unit Dose Folding Cartons',
      'Phase Change Material (PCM) Thermal Shippers'
    ],
    typicalLogisticsCategories: [
      'Validated Temperature-Controlled Air Cargo (+15C to +25C)',
      'Deep Cryogenic Dry Ice Transport (-80C)',
      'High-Security Bonded Armored Pharma Haulage',
      'GDP Compliant Cold Chain Dedicated Vehicles'
    ],
    typicalMroCategories: [
      'Cleanroom HEPA / ULPA Filtration Modules',
      'TOC Analyzer Reagents & Conductivity Sensors',
      'Autoclave Silicone Gaskets & Diaphragms',
      'Sterile Lint-Free Cleanroom Wipers & Garments'
    ],
    characteristicUNSPSCPrefixes: ['51', '12', '14', '41', '78'],
    benchmarkSpendSplit: {
      directPct: 48,
      packagingPct: 24,
      logisticsPct: 16,
      mroPct: 12
    },
    categorizationGuidance:
      'Blister foil, vials, and APIs are mapped to direct procurement; cold chain validation is mapped to compliant logistics.',
    keyKeywords: ['api', 'excipient', 'blister foil', 'vial', 'gmp', 'sterile', 'cleanroom', 'dry ice', 'capsule']
  },
  {
    majorSector: 'Automotive & Transportation',
    minorSector: 'Auto Components & Tier-1 Assemblies',
    sectorCode: 'AUTO-OEM',
    tagline: 'Forgings, Stamped Body Panels, Wire Harnesses, Returnable Dunnage & JIT',
    description:
      'Manufacture of braking systems, engine powertrains, body chassis, electrical harnesses, and interior modules for vehicle OEMs.',
    typicalDirectMaterials: [
      'High-Strength Steel Coils for Stamping',
      'Aluminum Die Cast Transmission Housings',
      'Copper Multi-Core Wiring Harness Assemblies',
      'Brake Friction Pads & Rotor Castings',
      'Electronic Engine Control Modules (ECU)'
    ],
    typicalPackagingMaterials: [
      'Returnable Steel Foldable Collapsible Racks',
      'KLT Injection-Moulded Plastic Euro Containers',
      'Custom Vacuum-Formed Component Dunnage',
      'Anti-Static ESD Corrugated Cartons'
    ],
    typicalLogisticsCategories: [
      'Just-in-Time (JIT) / Just-in-Sequence (JIS) Milk Runs',
      'Dedicated Automotive Cross-Dock Shuttle Fleet',
      'Returnable Empty Packaging Return Freight',
      'Expedited Emergency Air Charters for Line-Stoppers'
    ],
    typicalMroCategories: [
      'Robotic Spot Welding Tips & Cables',
      'Hydraulic Stamping Press Lubricants (ISO 68)',
      'Paint Shop E-Coat Chemical Baths & Filters',
      'End-of-Arm Tooling Grippers & Vacuum Cups'
    ],
    characteristicUNSPSCPrefixes: ['25', '30', '31', '39', '78'],
    benchmarkSpendSplit: {
      directPct: 62,
      packagingPct: 8,
      logisticsPct: 18,
      mroPct: 12
    },
    categorizationGuidance:
      'Forgings, stamped panels, wire harnesses, and returnable dunnage are categorized as direct Tier-1 production BOM.',
    keyKeywords: ['stamping', 'wire harness', 'casting', 'brake pad', 'returnable rack', 'klt', 'jit', 'ecu', 'automotive']
  },
  {
    majorSector: 'Energy, Utilities & Mining',
    minorSector: 'Oil & Gas (Upstream & Downstream)',
    sectorCode: 'ENERGY-OG',
    tagline: 'Drill String Tubulars, Wellhead Valves, Drilling Fluids & Heavy Rig Spares',
    description:
      'Exploration, offshore production, subsea infrastructure, refinery operations, and pipeline transmission.',
    typicalDirectMaterials: [
      'API Casing & Production Tubing Pipes (OCTG)',
      'Water-Based & Oil-Based Drilling Fluid Mud',
      'Subsea High-Pressure Gate & Choke Valves',
      'Drill Bits (PDC & Roller Cone)',
      'Corrosion Inhibitors & Demulsifier Chemicals'
    ],
    typicalPackagingMaterials: [
      'Thread Protectors for Tubular Casing',
      'Steel Offshore Cargo Baskets (DNV 2.7-1)',
      'Heavy Duty FIBC Sacks for Barite & Bentonite',
      'Heavy-Wall Steel Drums for Specialized Fluids'
    ],
    typicalLogisticsCategories: [
      'Offshore Supply Vessel (OSV) Marine Logistics',
      'Heavy Lift Barge & Crane Transhipment',
      'Helicopter Crew & Emergency Cargo Transport',
      'Dedicated Pipe-Haulage Heavy Transport'
    ],
    typicalMroCategories: [
      'Gas Turbine Overhaul Blades & Fuel Nozzles',
      'Centrifugal Multistage Injection Pump Impellers',
      'Explosion-Proof Control Panels (ATEX/IECEx)',
      'High-Pressure Flange Stud Bolts & Ring Joint Gaskets'
    ],
    characteristicUNSPSCPrefixes: ['20', '40', '15', '12', '78'],
    benchmarkSpendSplit: {
      directPct: 40,
      packagingPct: 6,
      logisticsPct: 24,
      mroPct: 30
    },
    categorizationGuidance:
      'Heavy tubular casing and drilling muds are direct operational supplies; turbine overhauls and pump impellers are major MRO.',
    keyKeywords: ['drilling', 'tubing', 'casing', 'valve', 'turbine', 'offshore', 'mud', 'barite', 'octg']
  },
  {
    majorSector: 'Technology & Telecommunications',
    minorSector: 'Semiconductor & Electronics Hardware',
    sectorCode: 'TECH-SEMI',
    tagline: 'Silicon Wafers, SMT Passive Components, Micro-Optics & Cleanroom Assemblies',
    description:
      'Fabrication of integrated circuits, printed circuit board assembly (PCBA), fiber optics, and telecom base stations.',
    typicalDirectMaterials: [
      '300mm Polished Silicon Wafers',
      'SMT Ceramic Capacitors & Resistors (0402/0201)',
      'Microcontrollers, FPGAs & Power ICs',
      'Multilayer FR4 & Rogers High-Frequency PCBs',
      'Gold & Copper Wire Bonding Spools'
    ],
    typicalPackagingMaterials: [
      'Tape & Reel Packaging Carrier Tapes',
      'Antistatic ESD Moisture Barrier Bags (MBB)',
      'Conductive IC Trays (JEDEC Matrix)',
      'Desiccant Packs & Humidity Indicator Cards'
    ],
    typicalLogisticsCategories: [
      'Priority Security Courier Air Cargo',
      'Bonded Customs Free-Zone Air Freight',
      'Temperature & Vibration Monitored Transport',
      'Global Distribution Center Hub Operations'
    ],
    typicalMroCategories: [
      'Solder Paste Stencils & Squeegee Blades',
      'Reflow Oven Nitrogen Atmosphere Regulators',
      'Automated Optical Inspection (AOI) Calibration Targets',
      'Deionized Ultra-Pure Water System Consumables'
    ],
    characteristicUNSPSCPrefixes: ['32', '43', '39', '24', '78'],
    benchmarkSpendSplit: {
      directPct: 60,
      packagingPct: 10,
      logisticsPct: 16,
      mroPct: 14
    },
    categorizationGuidance:
      'Silicon wafers, ICs, PCBs, and tape-and-reel ESD carriers are prioritized as core direct materials.',
    keyKeywords: ['semiconductor', 'wafer', 'pcb', 'ic', 'chip', 'esd', 'smt', 'capacitor', 'bonding']
  }
];
