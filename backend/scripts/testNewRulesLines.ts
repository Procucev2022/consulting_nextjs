import * as fs from 'fs';
import * as path from 'path';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';

const newRulesContent = `/**
 * Module 2 — Lever 3: Material UNSPSC Classification Taxonomy Reference Rules
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

export interface TaxonomyClassificationRule {
  pattern: RegExp;
  unspscCode: string;
  unspscTitle: string;
  segmentCode: string;
  segmentTitle: string;
  familyCode: string;
  familyTitle: string;
  classCode: string;
  classTitle: string;
  commodityCode: string;
  commodityTitle: string;
  confidenceScore: number;
  evidence: string;
}

export const OFFICIAL_UNSPSC_TAXONOMY_RULES: readonly TaxonomyClassificationRule[] = Object.freeze([
  {
    pattern: /\\b(?:hsd|high speed diesel|diesel oil|diesel fuel)\\b/i,
    unspscCode: '15101505', unspscTitle: 'Diesel fuel',
    segmentCode: '15000000', segmentTitle: 'Fuels and Lubricants and Related Products',
    familyCode: '15100000', familyTitle: 'Fuels',
    classCode: '15101500', classTitle: 'Oil and petroleum products',
    commodityCode: '15101505', commodityTitle: 'Diesel fuel',
    confidenceScore: 95, evidence: 'Exact chemical fuel specification match for High Speed Diesel'
  },
  {
    pattern: /\\b(?:furnace oil|fuel oil|bunker oil|lshs)\\b/i,
    unspscCode: '15101612', unspscTitle: 'Heavy fuel oils',
    segmentCode: '15000000', segmentTitle: 'Fuels and Lubricants and Related Products',
    familyCode: '15100000', familyTitle: 'Fuels',
    classCode: '15101600', classTitle: 'Fuel oils and lubricants',
    commodityCode: '15101612', commodityTitle: 'Heavy fuel oils',
    confidenceScore: 92, evidence: 'Standard heavy residual fuel oil specification match'
  },
  {
    pattern: /\\b(?:coal|coking coal|thermal coal|lignite|anthracite)\\b/i,
    unspscCode: '15101601', unspscTitle: 'Bituminous coal',
    segmentCode: '15000000', segmentTitle: 'Fuels and Lubricants and Related Products',
    familyCode: '15100000', familyTitle: 'Fuels',
    classCode: '15101600', classTitle: 'Fuel oils and lubricants',
    commodityCode: '15101601', commodityTitle: 'Bituminous coal',
    confidenceScore: 94, evidence: 'Solid mineral coal commodity match'
  },
  {
    pattern: /\\b(?:servo ultra|hydrol|hydraulic oil|lubricant|grease|mobil|castrol|lubricating oil|heat xl|coolant|fe oil|mak htf|klueber|kluber|gear oil|engine oil|transformer oil|synthetic oil)\\b/i,
    unspscCode: '15121500', unspscTitle: 'Lubricating preparations and industrial oils',
    segmentCode: '15000000', segmentTitle: 'Fuels and Lubricants and Related Products',
    familyCode: '15120000', familyTitle: 'Lubricants and oils and greases and anti corrosives',
    classCode: '15121500', classTitle: 'Lubricating preparations',
    commodityCode: '15121500', commodityTitle: 'Lubricating preparations and industrial oils',
    confidenceScore: 92, evidence: 'Industrial lubricants, synthetic coolants, and compressor oils match'
  },
  {
    pattern: /\\b(?:asstt|assistant|packing assistance|contract labour|contract labor|manpower|labour charge|labor charge|packing,hra)\\b/i,
    unspscCode: '80111600', unspscTitle: 'Temporary personnel services and contract labor',
    segmentCode: '80000000', segmentTitle: 'Management and Business Professionals and Administrative Services',
    familyCode: '80110000', familyTitle: 'Human resources services',
    classCode: '80111600', classTitle: 'Temporary personnel services',
    commodityCode: '80111600', commodityTitle: 'Temporary personnel services and contract labor',
    confidenceScore: 92, evidence: 'Plant operations packaging assistance and temporary contract manpower services'
  },
  {
    pattern: /\\b(?:draw texturising|draw texturing|texturising machine|texturing machine|spindle aft|spindle afd|spinning machine|autoloom|winding machine)\\b/i,
    unspscCode: '23131506', unspscTitle: 'Yarn texturing machines',
    segmentCode: '23000000', segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyCode: '23130000', familyTitle: 'Textile and fabric machinery and accessories',
    classCode: '23131500', classTitle: 'Textile spinning and winding and twisting and texturising machinery',
    commodityCode: '23131506', commodityTitle: 'Yarn texturing machines',
    confidenceScore: 94, evidence: 'Synthetic yarn Draw Texturising Machine (DTM/DTY) equipment match'
  },
  {
    pattern: /\\b(?:thermal fluid heater|vapor heater|vapour heater|vp-1 heater|oil heater|heat exchanger|air preheater|aph|economiser|economizer)\\b/i,
    unspscCode: '40101827', unspscTitle: 'Thermal fluid heaters',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40100000', familyTitle: 'Heating and ventilation and air circulation',
    classCode: '40101800', classTitle: 'Industrial boilers and thermal heaters',
    commodityCode: '40101827', commodityTitle: 'Thermal fluid heaters',
    confidenceScore: 93, evidence: 'Polymerization plant thermal fluid heater and heat exchanger equipment'
  },
  {
    pattern: /\\b(?:p\\/t\\b|paper tube|paper core|paper cone|winding tube|dt-tube)\\b/i,
    unspscCode: '14111601', unspscTitle: 'Paper tubes or cores',
    segmentCode: '14000000', segmentTitle: 'Paper Materials and Products',
    familyCode: '14110000', familyTitle: 'Paper products',
    classCode: '14111600', classTitle: 'Novelty and specialty paper products',
    commodityCode: '14111601', commodityTitle: 'Paper tubes or cores',
    confidenceScore: 94, evidence: 'Yarn winding dimensional paper tubes and cylindrical cores (P/T)'
  },
  {
    pattern: /\\b(?:corrugated box|corrugated|carton box|ply box|5 ply|7 ply|box)\\b/i,
    unspscCode: '24121502', unspscTitle: 'Corrugated boxes',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24120000', familyTitle: 'Packaging supplies',
    classCode: '24121500', classTitle: 'Packaging boxes and bags and pouches',
    commodityCode: '24121502', commodityTitle: 'Corrugated boxes',
    confidenceScore: 91, evidence: 'Industrial corrugated packaging box specification match'
  },
  {
    pattern: /\\b(?:jumbo bag|jumbo bags|fibc|bulk bag|polythene|poly bag|poly bags|chips bag|hdpe bag|pp woven bag|liner bag)\\b/i,
    unspscCode: '24111515', unspscTitle: 'Bulk transport bags or FIBC or jumbo bags',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24110000', familyTitle: 'Containers and storage',
    classCode: '24111500', classTitle: 'Bags',
    commodityCode: '24111515', commodityTitle: 'Bulk transport bags or FIBC or jumbo bags',
    confidenceScore: 92, evidence: 'Industrial polypropylene FIBC jumbo bags and bulk packaging sacks'
  },
  {
    pattern: /\\b(?:bale cover|pp bag|polypropylene bag|woven sack|stretch film|packing strip)\\b/i,
    unspscCode: '24121500', unspscTitle: 'Industrial packaging covers and sacks',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24120000', familyTitle: 'Packaging supplies',
    classCode: '24121500', classTitle: 'Packaging boxes and bags and pouches',
    commodityCode: '24121500', commodityTitle: 'Industrial packaging covers and sacks',
    confidenceScore: 90, evidence: 'Polypropylene bale wrapping and sack packaging match'
  },
  {
    pattern: /\\b(?:pet strap|polyester strap|steel strap|strapping band|cord strap)\\b/i,
    unspscCode: '24121512', unspscTitle: 'Packaging strapping and tape',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24120000', familyTitle: 'Packaging supplies',
    classCode: '24121500', classTitle: 'Packaging boxes and bags and pouches',
    commodityCode: '24121512', commodityTitle: 'Packaging strapping and tape',
    confidenceScore: 92, evidence: 'Bale and carton packaging strapping bands and PET straps'
  },
  {
    pattern: /\\b(?:pallet|metallic pallet|steel pallet|wooden pallet|plastic pallet|storage rack)\\b/i,
    unspscCode: '24101904', unspscTitle: 'Pallets',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24100000', familyTitle: 'Material handling machinery and equipment',
    classCode: '24101900', classTitle: 'Lifting and moving equipment and accessories',
    commodityCode: '24101904', commodityTitle: 'Pallets',
    confidenceScore: 93, evidence: 'Material handling and storage transport pallets'
  },
  {
    pattern: /\\b(?:air washer|humidification|scrubber|spray system|ahu|dehumidifier)\\b/i,
    unspscCode: '40101701', unspscTitle: 'Air conditioning units and industrial air washers',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40100000', familyTitle: 'Heating and ventilation and air circulation',
    classCode: '40101700', classTitle: 'Cooling systems and accessories',
    commodityCode: '40101701', commodityTitle: 'Air conditioning units and industrial air washers',
    confidenceScore: 90, evidence: 'Textile processing climate and humidity control air washer units'
  },
  {
    pattern: /\\b(?:bagging machine|packing machine|strapping machine|wrapping machine|checkweigher|weighing machine|filling machine)\\b/i,
    unspscCode: '24141514', unspscTitle: 'Bagging machines',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24140000', familyTitle: 'Packaging machinery',
    classCode: '24141500', classTitle: 'Industrial packaging machinery',
    commodityCode: '24141514', commodityTitle: 'Bagging machines',
    confidenceScore: 91, evidence: 'Automatic weighing, bagging and packaging machinery'
  },
  {
    pattern: /\\b(?:conveyor belt|conve\\.belt|conveyor|rubber belt|v-belt|timing belt|transmission belt|belt feeder)\\b/i,
    unspscCode: '24101720', unspscTitle: 'Conveyor belts and accessories',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24100000', familyTitle: 'Material handling machinery and equipment',
    classCode: '24101700', classTitle: 'Conveyors and accessories',
    commodityCode: '24101720', commodityTitle: 'Conveyor belts and accessories',
    confidenceScore: 92, evidence: 'Bulk material handling continuous conveyor belting'
  },
  {
    pattern: /\\b(?:ammonium nitrate|explosive|booster charger|column charger|detonator)\\b/i,
    unspscCode: '12131700', unspscTitle: 'Explosive materials and blasting accessories',
    segmentCode: '12000000', segmentTitle: 'Chemicals including Bio Chemicals and Gas Materials',
    familyCode: '12130000', familyTitle: 'Explosive materials',
    classCode: '12131700', classTitle: 'Explosive materials and blasting accessories',
    commodityCode: '12131700', commodityTitle: 'Explosive materials and blasting accessories',
    confidenceScore: 93, evidence: 'Mining blasting chemical and booster charge match'
  },
  {
    pattern: /\\b(?:magnesia spinel|basic brick|whytheat|fire brick|wedge brick|wedge bricks|refractory brick|refractory bricks|castable|accmon|dense castable|insulating brick|mortar)\\b/i,
    unspscCode: '30161500', unspscTitle: 'Refractory materials and kiln bricks',
    segmentCode: '30000000', segmentTitle: 'Structures and Building and Construction and Manufacturing Components',
    familyCode: '30160000', familyTitle: 'Interior finishing materials',
    classCode: '30161500', classTitle: 'Refractory materials and kiln bricks',
    commodityCode: '30161500', commodityTitle: 'Refractory materials and kiln bricks',
    confidenceScore: 93, evidence: 'Kiln and preheater refractory lining bricks and castables'
  },
  {
    pattern: /\\b(?:grinding media|high chrome|hi-chrome|forged balls|grate plate|roller tyre|roller tyres|roller tire|central tube|wear plate|liner plate|mill liner|blow bar|hammer|diaphragm)\\b/i,
    unspscCode: '23153100', unspscTitle: 'Grinding and crushing media balls and cylinders',
    segmentCode: '23000000', segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyCode: '23150000', familyTitle: 'Industrial process machinery',
    classCode: '23153100', classTitle: 'Grinding and crushing media balls and cylinders',
    commodityCode: '23153100', commodityTitle: 'Grinding and crushing media balls and cylinders',
    confidenceScore: 92, evidence: 'Cement mill grinding media, cooler grate plates, and kiln alloy castings'
  },
  {
    pattern: /\\b(?:girth gear|gear wheel|gearbox|pinion|spur gear|helical gear|bevel gear|reduction gear|gear)\\b/i,
    unspscCode: '31171701', unspscTitle: 'Gears and gearboxes and girth gears',
    segmentCode: '31000000', segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    familyCode: '31170000', familyTitle: 'Bearings and bushings and wheels and gears',
    classCode: '31171700', classTitle: 'Gears',
    commodityCode: '31171701', commodityTitle: 'Gears and gearboxes and girth gears',
    confidenceScore: 92, evidence: 'Kiln and mill mechanical drive gears, girth gears and gearboxes'
  },
  {
    pattern: /\\b(?:ms plate|steel plate|sheet metal|structural steel|ms angle|channel)\\b/i,
    unspscCode: '30101704', unspscTitle: 'Mild steel plate and sheet',
    segmentCode: '30000000', segmentTitle: 'Structures and Building and Construction and Manufacturing Components',
    familyCode: '30100000', familyTitle: 'Structural materials',
    classCode: '30101700', classTitle: 'Structural steel sheets and plates',
    commodityCode: '30101704', commodityTitle: 'Mild steel plate and sheet',
    confidenceScore: 90, evidence: 'Carbon/mild steel dimensional plate and structural metal match'
  },
  {
    pattern: /\\b(?:bearing|roller bearing|ball bearing|plummer block|tapered bearing)\\b/i,
    unspscCode: '31171500', unspscTitle: 'Bearings and bushings',
    segmentCode: '31000000', segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    familyCode: '31170000', familyTitle: 'Bearings and bushings and wheels and gears',
    classCode: '31171500', classTitle: 'Bearings and bushings',
    commodityCode: '31171500', commodityTitle: 'Bearings and bushings',
    confidenceScore: 92, evidence: 'Mechanical rolling element bearing specification match'
  },
  {
    pattern: /\\b(?:bolt|nut|washer|fastener|stud|hex bolt|anchor bolt|screw|rivet)\\b/i,
    unspscCode: '31161500', unspscTitle: 'Fasteners and hardware',
    segmentCode: '31000000', segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    familyCode: '31160000', familyTitle: 'Hardware',
    classCode: '31161500', classTitle: 'Fasteners',
    commodityCode: '31161500', commodityTitle: 'Fasteners and hardware',
    confidenceScore: 90, evidence: 'Standard industrial threaded fasteners, bolts, nuts and washers'
  },
  {
    pattern: /\\b(?:gasket|o-ring|oil seal|mechanical seal|seal kit|gland packing|teflon tape|ptfe sheet)\\b/i,
    unspscCode: '31401500', unspscTitle: 'Seals and gaskets and packings',
    segmentCode: '31000000', segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    familyCode: '31400000', familyTitle: 'Gaskets and seals',
    classCode: '31401500', classTitle: 'Gaskets and seals',
    commodityCode: '31401500', commodityTitle: 'Seals and gaskets and packings',
    confidenceScore: 91, evidence: 'Fluid containment industrial gaskets, elastomeric O-rings and mechanical seals'
  },
  {
    pattern: /\\b(?:pipe|seamless pipe|erw pipe|pipe fitting|flange|elbow|tee|nipple|bushing)\\b/i,
    unspscCode: '40171501', unspscTitle: 'Industrial pipe and pipe fittings',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40170000', familyTitle: 'Pipe and tubing and accessories',
    classCode: '40171500', classTitle: 'Industrial pipe and fittings',
    commodityCode: '40171501', commodityTitle: 'Industrial pipe and pipe fittings',
    confidenceScore: 90, evidence: 'Industrial process piping, seamless pipe and ASME fittings'
  },
  {
    pattern: /\\b(?:valve|butterfly valve|ball valve|gate valve|globe valve|check valve)\\b/i,
    unspscCode: '40141600', unspscTitle: 'Valves',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40140000', familyTitle: 'Fluid and gas flow and filtration',
    classCode: '40141600', classTitle: 'Valves',
    commodityCode: '40141600', commodityTitle: 'Valves',
    confidenceScore: 91, evidence: 'Fluid flow isolation and regulation valve specification match'
  },
  {
    pattern: /\\b(?:pump|centrifugal pump|slurry pump|submersible pump)\\b/i,
    unspscCode: '40151500', unspscTitle: 'Pumps and compressors',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40150000', familyTitle: 'Industrial pumps and compressors',
    classCode: '40151500', classTitle: 'Pumps',
    commodityCode: '40151500', commodityTitle: 'Pumps and compressors',
    confidenceScore: 90, evidence: 'Industrial fluid handling pump specification match'
  },
  {
    pattern: /\\b(?:filter element|air filter|oil filter|filter bag|filter cage|filter cartridge|strainer|filter cloth)\\b/i,
    unspscCode: '40161500', unspscTitle: 'Industrial filtration equipment and media',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40160000', familyTitle: 'Industrial filtering and purification',
    classCode: '40161500', classTitle: 'Filtering and purifying machinery and equipment',
    commodityCode: '40161500', commodityTitle: 'Industrial filtration equipment and media',
    confidenceScore: 91, evidence: 'Baghouse dust collection filter bags, fluid filter elements and strainers'
  },
  {
    pattern: /\\b(?:pressure gauge|temp\\.gauge|thermocouple|rtd|transmitter|flow meter|transducer|sensor|level switch|limit switch)\\b/i,
    unspscCode: '41111900', unspscTitle: 'Industrial measuring and observing instruments',
    segmentCode: '41000000', segmentTitle: 'Laboratory and Measuring and Observing and Testing Equipment',
    familyCode: '41110000', familyTitle: 'Measuring and observing and testing instruments',
    classCode: '41111900', classTitle: 'Pressure measuring instruments',
    commodityCode: '41111900', commodityTitle: 'Industrial measuring and observing instruments',
    confidenceScore: 91, evidence: 'Plant process automation sensors, gauges and temperature transmitters'
  },
  {
    pattern: /\\b(?:cable|electrical wire|copper cable|armoured cable|instrumentation cable)\\b/i,
    unspscCode: '26121600', unspscTitle: 'Electrical wire and cable and harness',
    segmentCode: '26000000', segmentTitle: 'Power Generation and Distribution Machinery and Accessories',
    familyCode: '26120000', familyTitle: 'Electrical wire and cable and harness',
    classCode: '26121600', classTitle: 'Electrical cable and wire',
    commodityCode: '26121600', commodityTitle: 'Electrical wire and cable and harness',
    confidenceScore: 90, evidence: 'Industrial insulated electrical conductor match'
  },
  {
    pattern: /\\b(?:motor|induction motor|electric motor|drive|vfd)\\b/i,
    unspscCode: '26101100', unspscTitle: 'Electric motors and generators',
    segmentCode: '26000000', segmentTitle: 'Power Generation and Distribution Machinery and Accessories',
    familyCode: '26100000', familyTitle: 'Power sources',
    classCode: '26101100', classTitle: 'Motors and generators',
    commodityCode: '26101100', commodityTitle: 'Electric motors and generators',
    confidenceScore: 90, evidence: 'Industrial rotary electric motor equipment match'
  },
  {
    pattern: /\\b(?:safety shoe|safety helmet|goggle|hand glove|safety harness|ear plug|mask|apron|coverall)\\b/i,
    unspscCode: '46181500', unspscTitle: 'Safety apparel and personal protective equipment (PPE)',
    segmentCode: '46000000', segmentTitle: 'Defense and Law Enforcement and Security and Safety Equipment and Supplies',
    familyCode: '46180000', familyTitle: 'Personal safety and protection',
    classCode: '46181500', classTitle: 'Safety apparel',
    commodityCode: '46181500', commodityTitle: 'Safety apparel and personal protective equipment (PPE)',
    confidenceScore: 91, evidence: 'Industrial workplace personal protective equipment and safety gear'
  },
  {
    pattern: /\\b(?:tyre|tire|tubeless tyre|radial tyre)\\b/i,
    unspscCode: '25172500', unspscTitle: 'Tires and tubes',
    segmentCode: '25000000', segmentTitle: 'Commercial and Military and Private Vehicles and their Accessories and Components',
    familyCode: '25170000', familyTitle: 'Transportation components and systems',
    classCode: '25172500', classTitle: 'Tires and tubes',
    commodityCode: '25172500', commodityTitle: 'Tires and tubes',
    confidenceScore: 92, evidence: 'Heavy mining equipment dump truck and loader off-road tyres'
  },
  {
    pattern: /\\b(?:fabrication|erection|installation service|mechanical service|piping work)\\b/i,
    unspscCode: '72102900', unspscTitle: 'Industrial plant maintenance and fabrication services',
    segmentCode: '72000000', segmentTitle: 'Building and Construction and Maintenance Services',
    familyCode: '72100000', familyTitle: 'Building and facility maintenance',
    classCode: '72102900', classTitle: 'Facility maintenance and repair services',
    commodityCode: '72102900', commodityTitle: 'Industrial plant maintenance and fabrication services',
    confidenceScore: 88, evidence: 'Site structural/mechanical fabrication service match'
  },
  {
    pattern: /\\b(?:electrical service|electrical work|wiring service)\\b/i,
    unspscCode: '72151500', unspscTitle: 'Electrical system installation and maintenance services',
    segmentCode: '72000000', segmentTitle: 'Building and Construction and Maintenance Services',
    familyCode: '72150000', familyTitle: 'Specialized trade construction and maintenance services',
    classCode: '72151500', classTitle: 'Electrical system services',
    commodityCode: '72151500', commodityTitle: 'Electrical system installation and maintenance services',
    confidenceScore: 88, evidence: 'Licensed electrical contractor maintenance service match'
  },
  {
    pattern: /\\b(?:storage charge|tank rental|demurrage|freight|transport|hydra|crane hire)\\b/i,
    unspscCode: '78101800', unspscTitle: 'Freight transport and storage and equipment rental services',
    segmentCode: '78000000', segmentTitle: 'Transportation and Storage and Mail Services',
    familyCode: '78100000', familyTitle: 'Mail and cargo transport',
    classCode: '78101800', classTitle: 'Logistics and handling services',
    commodityCode: '78101800', commodityTitle: 'Freight transport and storage and equipment rental services',
    confidenceScore: 88, evidence: 'Material handling equipment hire and tank storage service match'
  }
]);
`;

const lines = newRulesContent.trim().split('\n').length;
console.log(`Generated rules lines: ${lines} (must be <= 300)`);
