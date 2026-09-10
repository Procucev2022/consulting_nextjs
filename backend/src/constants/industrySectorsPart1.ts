import type { IndustryMaterialProfile } from '../types/industry';

export const INDUSTRY_SECTORS_PART1: IndustryMaterialProfile[] = [
  {
    majorSector: 'Chemical & Petrochemicals',
    minorSector: 'Specialty Chemicals',
    sectorCode: 'CHEM-SPEC',
    tagline: 'High-Value Catalysts, Polymers, Industrial Reagents & Specialized Packaging',
    description:
      'Formulations, fine chemicals, performance additives, and specialized intermediates requiring strict batch control and hazardous logistics.',
    typicalDirectMaterials: [
      'Specialty Catalysts & Reaction Modifiers',
      'High-Purity Solvents & Extraction Agents',
      'Synthetic Resins & Polymer Concentrates',
      'Industrial Pigments, Colorants & Dyes',
      'Organic Intermediate Compounds'
    ],
    typicalPackagingMaterials: [
      'UN-Certified Steel Drums & Barrels',
      'Intermediate Bulk Containers (IBC Totes 1000L)',
      'Fluorinated HDPE Bottles & Carboys',
      'Heavy-Duty Polyethylene Sacks',
      'Tamper-Evident Chemical Liners'
    ],
    typicalLogisticsCategories: [
      'Hazmat Liquid Bulk Tanker Transport',
      'Temperature-Controlled Chemical Freight',
      'Port-to-Plant Container Drayage',
      'Dangerous Goods (ADR/IMDG) Freight'
    ],
    typicalMroCategories: [
      'Corrosion-Resistant Valves & Gaskets (PTFE)',
      'Centrifugal Chemical Slurry Pumps',
      'Explosion-Proof Electrical Switchgear',
      'Analytical Lab Columns & Chromatography Reagents'
    ],
    characteristicUNSPSCPrefixes: ['12', '13', '14', '24', '40', '78'],
    benchmarkSpendSplit: {
      directPct: 56,
      packagingPct: 18,
      logisticsPct: 14,
      mroPct: 12
    },
    categorizationGuidance:
      'AI classifies chemical precursors, catalysts, and UN packaging as core direct inputs. Out-of-spec office or commercial hardware is flagged as general MRO.',
    keyKeywords: ['chemical', 'catalyst', 'solvent', 'resin', 'polymer', 'drum', 'ibc', 'hazmat', 'pigment', 'reagent']
  },
  {
    majorSector: 'Chemical & Petrochemicals',
    minorSector: 'Basic Organics & Petrochemicals',
    sectorCode: 'CHEM-PETRO',
    tagline: 'High-Volume Olefins, Aromatics, Feedstocks & Continuous Process Refining',
    description:
      'Continuous distillation, cracking, and synthesis of commodity chemicals, refinery feedstocks, and industrial gases.',
    typicalDirectMaterials: [
      'Ethylene, Propylene & Butadiene Monomers',
      'Benzene, Toluene & Xylene (BTX)',
      'Industrial Nitrogen, Oxygen & Argon Gases',
      'Caustic Soda & Sulfuric Acid Bulk',
      'Refinery Cracking Catalysts'
    ],
    typicalPackagingMaterials: [
      'Bulk Tanker Dedicated Liners',
      'ISO Tank Containers (24,000L)',
      'Heavy-Wall Steel Drums (200L)',
      'Stretch Hood Pallet Film'
    ],
    typicalLogisticsCategories: [
      'Pipeline Transfer Tariff Charges',
      'Railroad Tank Car Lease & Haulage',
      'Deep-Sea Chemical Parcel Tankers',
      'Bulk Terminal Storage & Demurrage'
    ],
    typicalMroCategories: [
      'Heat Exchanger Tube Bundles (Titanium)',
      'High-Pressure Flanges & Spiral Gaskets',
      'Refractory Brick & Furnace Insulation',
      'Distillation Column Structured Packing'
    ],
    characteristicUNSPSCPrefixes: ['12', '15', '24', '40', '78'],
    benchmarkSpendSplit: {
      directPct: 68,
      packagingPct: 7,
      logisticsPct: 15,
      mroPct: 10
    },
    categorizationGuidance:
      'Continuous bulk deliveries and pipeline transfers are weighted as primary direct production expenses.',
    keyKeywords: ['ethylene', 'benzene', 'bulk acid', 'nitrogen', 'iso tank', 'cracking', 'refinery', 'catalyst']
  },
  {
    majorSector: 'Chemical & Petrochemicals',
    minorSector: 'Polymers & Synthetic Resins',
    sectorCode: 'CHEM-POLY',
    tagline: 'Thermoplastic Granules, Engineering Plastics, Elastomers & Compounding',
    description:
      'Polymerization, extrusion, compounding, and masterbatch preparation for injection moulding and flexible converting.',
    typicalDirectMaterials: [
      'Virgin Polypropylene & Polyethylene Pellets',
      'Engineering Polycarbonate & Polyamide Resins',
      'Titanium Dioxide & Carbon Black Masterbatch',
      'Impact Modifiers & Heat Stabilizers',
      'Recycled PCR Resin Flakes'
    ],
    typicalPackagingMaterials: [
      '1-Tonne Polypropylene Jumbo Bags (FIBC)',
      '25kg Multi-Wall Valve Paper Sacks',
      'Wooden Heat-Treated Pallets (1200x1000)',
      'Heavy Gauge Stretch Hood Film'
    ],
    typicalLogisticsCategories: [
      'Dry Bulk Silo Truck Haulage',
      'Intermodal Ocean Container Freight (40ft HC)',
      'Regional Cross-Dock Distribution',
      'Palletized LTL Freight'
    ],
    typicalMroCategories: [
      'Twin-Screw Extruder Barrels & Segments',
      'Underwater Pelletizer Die Plates & Knives',
      'Pneumatic Conveying Rotary Valves',
      'Chiller Compressor Seals & Heat Exchangers'
    ],
    characteristicUNSPSCPrefixes: ['13', '14', '24', '31', '78'],
    benchmarkSpendSplit: {
      directPct: 62,
      packagingPct: 15,
      logisticsPct: 13,
      mroPct: 10
    },
    categorizationGuidance:
      'FIBC bulk bags, masterbatch, and extruder spares are prioritized as core production materials.',
    keyKeywords: ['polymer', 'resin', 'pellet', 'polypropylene', 'polyethylene', 'masterbatch', 'fibc', 'jumbo bag']
  },
  {
    majorSector: 'Manufacturing & Industrial',
    minorSector: 'Precision Engineering & Tooling',
    sectorCode: 'MFG-PREC',
    tagline: 'CNC Machining, Cutting Tools, High-Alloy Steels & Geometric Tolerances',
    description:
      'Sub-micron machining, aerospace forgings, semiconductor fixtures, die & mould manufacturing, and metrology.',
    typicalDirectMaterials: [
      'Aerospace Grade Titanium & Inconel Round Bar',
      'Pre-Hardened Tool Steel Blocks (P20, D2)',
      'Solid Carbide End Mills & Indexable Inserts',
      'Precision Ceramic Balls & Bearings',
      'Micro-Fasteners & Threaded Inserts'
    ],
    typicalPackagingMaterials: [
      'VCI Anti-Corrosion Bags & Paper Wrap',
      'Thermoformed Protective Component Trays',
      'Custom Foam Inserts & Poly Bags',
      'Reinforced Corrugated Heavy Boxes'
    ],
    typicalLogisticsCategories: [
      'Time-Critical Air Freight Express',
      'Dedicated Sprinter Van Courier Delivery',
      'Consolidated Air Cargo Freight',
      'Cleanroom Delivery Logistics'
    ],
    typicalMroCategories: [
      'Water-Soluble CNC Cutting Fluids & Coolants',
      '5-Axis Spindle Bearings & Collet Chucks',
      'Coordinate Measuring Machine (CMM) Probes',
      'Diamond Grinding Wheels & EDM Wire'
    ],
    characteristicUNSPSCPrefixes: ['30', '31', '23', '27', '41', '78'],
    benchmarkSpendSplit: {
      directPct: 54,
      packagingPct: 8,
      logisticsPct: 14,
      mroPct: 24
    },
    categorizationGuidance:
      'Carbide tooling, metal alloys, and CNC coolants are evaluated as direct and critical manufacturing spend.',
    keyKeywords: ['carbide', 'tooling', 'titanium', 'machining', 'vci', 'coolant', 'spindle', 'steel bar', 'fastener']
  },
  {
    majorSector: 'Manufacturing & Industrial',
    minorSector: 'Industrial Machinery & Equipment',
    sectorCode: 'MFG-MACH',
    tagline: 'Heavy Mechanical Assemblies, Hydraulic Drives, Pumps & Fabricated Enclosures',
    description:
      'Assembly of compressors, heavy earthmoving systems, packaging automation lines, and power transmissions.',
    typicalDirectMaterials: [
      'Cast Iron Pump Housings & Motor Frames',
      'High-Tensile Structural Steel Plates',
      'Heavy Spherical Roller Bearings',
      'Electro-Hydraulic Directional Proportional Valves',
      'AC Servo Motors & Planetary Gearboxes'
    ],
    typicalPackagingMaterials: [
      'Heavy Wooden Export Crates & Skids',
      'Steel Strapping Bands & Corner Protectors',
      'Heavy Duty Tarpaulins & Heat Shrink Wrap',
      'Desiccant Packs & Moisture Barrier Foil'
    ],
    typicalLogisticsCategories: [
      'Over-Dimensional (ODC) Flatbed Heavy Haulage',
      'Breakbulk Ocean Vessel Chartering',
      'Mobile Crane Offloading Services',
      'Port Handling & Rigging Transport'
    ],
    typicalMroCategories: [
      'High-Pressure Hydraulic Hoses & Couplers',
      'Industrial Gear Oils (ISO VG 320/460)',
      'Submerged Arc Welding Wire & Flux',
      'Laser Cutting Nozzles & Optical Lenses'
    ],
    characteristicUNSPSCPrefixes: ['30', '31', '40', '24', '78'],
    benchmarkSpendSplit: {
      directPct: 58,
      packagingPct: 6,
      logisticsPct: 18,
      mroPct: 18
    },
    categorizationGuidance:
      'Castings, servo drives, hydraulic valves, and wooden export crating are recognized as direct project bills of material.',
    keyKeywords: ['hydraulic', 'pump', 'bearing', 'casting', 'motor', 'gearbox', 'crate', 'flatbed', 'valve']
  },
  {
    majorSector: 'Construction & Infrastructure',
    minorSector: 'Commercial EPC & Heavy Civil',
    sectorCode: 'CONST-EPC',
    tagline: 'Structural Steel, Ready-Mix Concrete, Rebar & Heavy Earthmoving Rentals',
    description:
      'Execution of turnkey industrial plants, bridges, highways, commercial towers, and civil foundations.',
    typicalDirectMaterials: [
      'TMT Thermo-Mechanically Treated Rebar Steel',
      'Grade 43/53 Portland Cement & Fly Ash',
      'Structural Steel Wide-Flange Beams & Columns',
      'Ready-Mix Concrete (M30/M40 Batch)',
      'Aggregates, Crushed Stone & River Sand'
    ],
    typicalPackagingMaterials: [
      '50kg HDPE Laminated Cement Bags',
      'Geotextile Rolls & Silt Fences',
      'Steel Rebar Wire Binding Coils',
      'Heavy Wooden Concrete Shuttering Formwork'
    ],
    typicalLogisticsCategories: [
      'Transit Mixer Concrete Haulage (Within 2 Hours)',
      'Multi-Axle Flatbed Rebar & Beam Trucking',
      'Tipper Truck Aggregate Bulk Haulage',
      'Heavy Equipment Low-Bed Trailer Mobilization'
    ],
    typicalMroCategories: [
      'Excavator Bucket Teeth & Wear Plates',
      'Concrete Pump Delivery Pipes & Clamps',
      'Tower Crane Wire Ropes & Slew Bearings',
      'Safety Harnesses, Hard Hats & Steel-Toe Boots'
    ],
    characteristicUNSPSCPrefixes: ['30', '11', '22', '78'],
    benchmarkSpendSplit: {
      directPct: 54,
      packagingPct: 6,
      logisticsPct: 24,
      mroPct: 16
    },
    categorizationGuidance:
      'Rebar steel, cement, structural beams, and batch concrete are categorized as direct EPC project materials.',
    keyKeywords: ['rebar', 'cement', 'concrete', 'steel beam', 'aggregate', 'crane', 'excavator', 'epc', 'scaffolding']
  }
];
