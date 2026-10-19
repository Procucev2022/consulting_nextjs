/**
 * Module 2 — Lever 3: Material UNSPSC Classification Taxonomy Reference Rules
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10, line <= 120
 */

import { unspscOfficialDictionary } from '../data/unspscTaxonomy';

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

interface RawTaxonomyRuleDef {
  pattern: RegExp;
  code: string;
  score: number;
  evidence: string;
}

const rx = (...parts: string[]): RegExp => new RegExp(`\\b(?:${parts.join('|')})\\b`, 'i');

const RAW_TAXONOMY_RULES: readonly RawTaxonomyRuleDef[] = [
  // --- VERIFIED RULES (Specific Technical Standards & Specifications, score >= 95) ---
  {
    pattern: rx('high speed diesel|hsd for mines|hsd oil'),
    code: '15101505', score: 95,
    evidence: 'Explicit technical Indian Standard IS 1460 fuel specification for High Speed Diesel'
  },
  {
    pattern: rx('draw texturising machine 336 spindle|draw texturising machine 448 spindle'),
    code: '23131506', score: 95,
    evidence: 'Explicit technical specification for continuous filament Draw Texturising Machine (DTM)'
  },
  {
    pattern: rx('vp-1 heater of 14.2 mkcal'),
    code: '40101827', score: 95,
    evidence: 'Explicit technical capacity (14.2 MKCal) and manufacturer specification for VP-1 thermal fluid heater'
  },
  {
    pattern: rx('fire brick.*(?:70%|al2o3|alumina)|accmon - 30sic castable|whytheat -k|whytheat-k'),
    code: '30161500', score: 95,
    evidence: 'Explicit technical alumina metallurgy (70% Al2O3) or Calderys/ACC manufacturer refractory specification'
  },
  {
    pattern: rx('grinding media.*(?:15mm|17mm|20mm|25mm|30mm|50mm)|hicrome grinding media 25mm'),
    code: '23153100', score: 95,
    evidence: 'Explicit technical diameter specification for cement grinding media alloy balls'
  },
  {
    pattern: rx('conve\\.belt,1400mm,1250/4|conveyor belt 1000mm,630/4|conveyor belt 800mm,630\\*4'),
    code: '24101720', score: 95,
    evidence: 'Explicit technical tension (1250/4) and dimensional (1400mm) specification for heavy conveyor belting'
  },

  // --- PROVISIONAL RULES (Broad Keyword Matches, score 80-85) ---
  {
    pattern: rx('coal linkage auction|coal e-auction|coal market|coking coal|thermal coal|steam coal|lignite'),
    code: '15101601', score: 85,
    evidence: 'Standardized commodity description lacking explicit ASTM/IS coal standard specification'
  },
  {
    pattern: rx('furnace oil|bunker oil|lshs fuel'),
    code: '15101612', score: 85,
    evidence: 'Standardized commodity description lacking explicit kinematic viscosity or IS grade specification'
  },
  {
    pattern: rx('ammonium nitrate|booster charger|column charger'),
    code: '12131700', score: 85,
    evidence: 'Standardized chemical / blasting description lacking manufacturer part number or technical grade'
  },

  // --- PROVISIONAL RULES (Broad Keyword Matches, score 80-85) ---
  {
    pattern: rx(
      'magnesia spinel|basic brick|fire brick|refractory brick|refractory bricks',
      'castable|accmon|dense castable|insulating brick|mortar'
    ),
    code: '30161500', score: 85,
    evidence: 'Broad keyword match: Kiln and preheater refractory lining bricks and castables'
  },
  {
    pattern: rx(
      'grinding media|forged balls|grate plate|roller tyre|roller tyres|roller tire',
      'central tube|wear plate|liner plate|mill liner|blow bar'
    ),
    code: '23153100', score: 85,
    evidence: 'Broad keyword match: Cement mill wear plates, grate plates, and alloy castings'
  },
  {
    pattern: rx('conveyor belt|conve\\.belt|conveyor|rubber belt|v-belt|timing belt|transmission belt|belt feeder'),
    code: '24101720', score: 85,
    evidence: 'Broad keyword match: Bulk material handling continuous conveyor belting'
  },
  {
    pattern: rx(
      'servo ultra|hydrol|hydraulic oil|lubricant|grease|mobil|castrol|lubricating oil',
      'heat xl|coolant|fe oil|mak htf|klueber|kluber|gear oil|engine oil|transformer oil|synthetic oil'
    ),
    code: '15121500', score: 85,
    evidence: 'Broad keyword match: Industrial lubricants, synthetic coolants, and compressor oils'
  },
  {
    pattern: rx(
      'asstt|assistant|packing assistance|contract labour|contract labor',
      'manpower|labour charge|labor charge|packing,hra'
    ),
    code: '80111600', score: 80,
    evidence: 'Broad keyword match: Plant operations packaging assistance and temporary contract manpower'
  },
  {
    pattern: rx('p/t\\b', 'paper tube|paper core|paper cone|winding tube|dt-tube'),
    code: '14121503', score: 85,
    evidence: 'Broad keyword match: Yarn winding industrial paper tubes and cylindrical cardboard cores'
  },
  {
    pattern: rx('corrugated box|corrugated|carton box|ply box|5 ply|7 ply'),
    code: '24112502', score: 85,
    evidence: 'Broad keyword match: Corrugated cartons and distribution packaging specification'
  },
  {
    pattern: rx(
      'jumbo bag|jumbo bags|fibc|bulk bag|polythene|poly bag|poly bags',
      'chips bag|hdpe bag|pp woven bag|liner bag'
    ),
    code: '24111515', score: 85,
    evidence: 'Broad keyword match: Industrial polypropylene FIBC jumbo bags and bulk packaging sacks'
  },
  {
    pattern: rx('bale cover|pp bag|polypropylene bag|woven sack|stretch film|packing strip'),
    code: '24121500', score: 85,
    evidence: 'Broad keyword match: Polypropylene bale wrapping and sack packaging'
  },
  {
    pattern: rx('pet strap|polyester strap|steel strap|strapping band|cord strap'),
    code: '24121500', score: 85,
    evidence: 'Broad keyword match: Industrial packaging strapping bands and bundling materials'
  },
  {
    pattern: rx('pallet|metallic pallet|steel pallet|wooden pallet|plastic pallet|storage rack'),
    code: '24112701', score: 85,
    evidence: 'Broad keyword match: Material handling and storage transport pallets'
  },
  {
    pattern: rx('air washer|humidification|scrubber|spray system|ahu|dehumidifier'),
    code: '40101701', score: 85,
    evidence: 'Broad keyword match: Textile processing climate and humidity control air washer units'
  },
  {
    pattern: rx(
      'bagging machine|packing machine|strapping machine|wrapping machine',
      'checkweigher|weighing machine|filling machine'
    ),
    code: '24141514', score: 85,
    evidence: 'Broad keyword match: Automatic weighing, bagging and packaging machinery'
  },
  {
    pattern: rx('ms plate|steel plate|sheet metal|structural steel|ms angle|channel'),
    code: '30101704', score: 85,
    evidence: 'Broad keyword match: Carbon/mild steel dimensional plate and structural metal'
  },
  {
    pattern: rx('bearing|roller bearing|ball bearing|plummer block|tapered bearing'),
    code: '31171500', score: 85,
    evidence: 'Broad keyword match: Mechanical rolling element bearings'
  },
  {
    pattern: rx('bolt|nut|washer|fastener|stud|hex bolt|anchor bolt|screw|rivet'),
    code: '31161500', score: 85,
    evidence: 'Broad keyword match: Standard industrial threaded fasteners, bolts, nuts and washers'
  },
  {
    pattern: rx('gasket|o-ring|oil seal|mechanical seal|seal kit|gland packing|teflon tape|ptfe sheet'),
    code: '31401500', score: 85,
    evidence: 'Broad keyword match: Fluid containment industrial gaskets, elastomeric O-rings and mechanical seals'
  },
  {
    pattern: rx('pipe|seamless pipe|erw pipe|pipe fitting|flange|elbow|tee|nipple|bushing'),
    code: '40171501', score: 85,
    evidence: 'Broad keyword match: Industrial process piping, seamless pipe and ASME fittings'
  },
  {
    pattern: rx('valve|butterfly valve|ball valve|gate valve|globe valve|check valve'),
    code: '40141600', score: 85,
    evidence: 'Broad keyword match: Fluid flow isolation and regulation valves'
  },
  {
    pattern: rx('pump|centrifugal pump|slurry pump|submersible pump'),
    code: '40151500', score: 85,
    evidence: 'Broad keyword match: Industrial fluid handling pumps'
  },
  {
    pattern: rx('filter element|air filter|oil filter|filter bag|filter cage|filter cartridge|strainer|filter cloth'),
    code: '40161500', score: 85,
    evidence: 'Broad keyword match: Baghouse dust collection filter bags, fluid filter elements and strainers'
  },
  {
    pattern: rx(
      'pressure gauge|temp\\.gauge|thermocouple|rtd|transmitter',
      'flow meter|transducer|sensor|level switch|limit switch'
    ),
    code: '41111900', score: 85,
    evidence: 'Broad keyword match: Plant process automation sensors, gauges and temperature transmitters'
  },
  {
    pattern: rx('cable|electrical wire|copper cable|armoured cable|instrumentation cable'),
    code: '26121600', score: 85,
    evidence: 'Broad keyword match: Industrial insulated electrical conductors'
  },
  {
    pattern: rx('motor|induction motor|electric motor|drive|vfd'),
    code: '26101100', score: 85,
    evidence: 'Broad keyword match: Industrial rotary electric motors and drives'
  },
  {
    pattern: rx('safety shoe|safety helmet|goggle|hand glove|safety harness|ear plug|mask|apron|coverall'),
    code: '46181500', score: 85,
    evidence: 'Broad keyword match: Industrial workplace personal protective equipment and safety gear'
  },
  {
    pattern: rx('tyre|tire|tubeless tyre|radial tyre'),
    code: '25172500', score: 85,
    evidence: 'Broad keyword match: Heavy mining equipment dump truck and loader off-road tyres'
  },
  {
    pattern: rx('girth gear|gear wheel|gearbox|pinion|spur gear|helical gear|bevel gear|reduction gear'),
    code: '31171701', score: 85,
    evidence: 'Broad keyword match: Mechanical drive gears and gearboxes'
  },
  {
    pattern: rx('fabrication|erection|installation service|mechanical service|piping work'),
    code: '72102900', score: 80,
    evidence: 'Broad keyword match: Site structural/mechanical fabrication service'
  },
  {
    pattern: rx('electrical service|electrical work|wiring service'),
    code: '72151500', score: 80,
    evidence: 'Broad keyword match: Licensed electrical contractor maintenance service'
  },
  {
    pattern: rx('storage charge|tank rental|demurrage|freight|transport|hydra|crane hire'),
    code: '78101800', score: 80,
    evidence: 'Broad keyword match: Material handling equipment hire and tank storage service'
  }
];

export function buildOfficialTaxonomyRules(
  dictionary = unspscOfficialDictionary
): readonly TaxonomyClassificationRule[] {
  const dictMap = new Map(dictionary.map(item => [item.commodityCode, item]));
  return Object.freeze(
    RAW_TAXONOMY_RULES.map((raw) => {
      const taxonomy = dictMap.get(raw.code);
      return {
        pattern: raw.pattern,
        unspscCode: raw.code,
        unspscTitle: taxonomy ? taxonomy.commodityTitle : `Commodity ${raw.code}`,
        segmentCode: taxonomy ? taxonomy.segmentCode : `${raw.code.substring(0, 2)}000000`,
        segmentTitle: taxonomy ? taxonomy.segmentTitle : 'Industrial Segment',
        familyCode: taxonomy ? taxonomy.familyCode : `${raw.code.substring(0, 4)}0000`,
        familyTitle: taxonomy ? taxonomy.familyTitle : 'Industrial Family',
        classCode: taxonomy ? taxonomy.classCode : `${raw.code.substring(0, 6)}00`,
        classTitle: taxonomy ? taxonomy.classTitle : 'Industrial Class',
        commodityCode: raw.code,
        commodityTitle: taxonomy ? taxonomy.commodityTitle : `Commodity ${raw.code}`,
        confidenceScore: raw.score,
        evidence: raw.evidence
      };
    })
  );
}

export const OFFICIAL_UNSPSC_TAXONOMY_RULES: readonly TaxonomyClassificationRule[] = buildOfficialTaxonomyRules();
