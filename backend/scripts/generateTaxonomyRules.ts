import * as fs from 'fs';
import * as path from 'path';

const content = `/**
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

const rx = (...parts: string[]): RegExp => new RegExp(\`\\\\b(?:\${parts.join('|')})\\\\b\`, 'i');

const RAW_TAXONOMY_RULES: readonly RawTaxonomyRuleDef[] = [
  {
    pattern: rx('hsd|high speed diesel|diesel oil|diesel fuel'),
    code: '15101505', score: 95,
    evidence: 'Exact chemical fuel specification match for High Speed Diesel'
  },
  {
    pattern: rx('furnace oil|fuel oil|bunker oil|lshs'),
    code: '15101612', score: 92,
    evidence: 'Standard heavy residual fuel oil specification match'
  },
  {
    pattern: rx('coal|coking coal|thermal coal|lignite|anthracite'),
    code: '15101601', score: 94,
    evidence: 'Solid mineral coal commodity match'
  },
  {
    pattern: rx(
      'servo ultra|hydrol|hydraulic oil|lubricant|grease|mobil|castrol|lubricating oil',
      'heat xl|coolant|fe oil|mak htf|klueber|kluber|gear oil|engine oil|transformer oil|synthetic oil'
    ),
    code: '15121500', score: 92,
    evidence: 'Industrial lubricants, synthetic coolants, and compressor oils match'
  },
  {
    pattern: rx(
      'asstt|assistant|packing assistance|contract labour|contract labor',
      'manpower|labour charge|labor charge|packing,hra'
    ),
    code: '80111600', score: 92,
    evidence: 'Plant operations packaging assistance and temporary contract manpower services'
  },
  {
    pattern: rx(
      'draw texturising|draw texturing|texturising machine|texturing machine',
      'spindle aft|spindle afd|spinning machine|autoloom|winding machine'
    ),
    code: '23131506', score: 94,
    evidence: 'Synthetic yarn Draw Texturising Machine (DTM/DTY) equipment match'
  },
  {
    pattern: rx(
      'thermal fluid heater|vapor heater|vapour heater|vp-1 heater|oil heater',
      'heat exchanger|air preheater|aph|economiser|economizer'
    ),
    code: '40101827', score: 93,
    evidence: 'Polymerization plant thermal fluid heater and heat exchanger equipment'
  },
  {
    pattern: rx('p/t\\\\b', 'paper tube|paper core|paper cone|winding tube|dt-tube'),
    code: '14111601', score: 94,
    evidence: 'Yarn winding dimensional paper tubes and cylindrical cores (P/T)'
  },
  {
    pattern: rx('corrugated box|corrugated|carton box|ply box|5 ply|7 ply|box'),
    code: '24121502', score: 91,
    evidence: 'Industrial corrugated packaging box specification match'
  },
  {
    pattern: rx(
      'jumbo bag|jumbo bags|fibc|bulk bag|polythene|poly bag|poly bags',
      'chips bag|hdpe bag|pp woven bag|liner bag'
    ),
    code: '24111515', score: 92,
    evidence: 'Industrial polypropylene FIBC jumbo bags and bulk packaging sacks'
  },
  {
    pattern: rx('bale cover|pp bag|polypropylene bag|woven sack|stretch film|packing strip'),
    code: '24121500', score: 90,
    evidence: 'Polypropylene bale wrapping and sack packaging match'
  },
  {
    pattern: rx('pet strap|polyester strap|steel strap|strapping band|cord strap'),
    code: '24121512', score: 92,
    evidence: 'Bale and carton packaging strapping bands and PET straps'
  },
  {
    pattern: rx('pallet|metallic pallet|steel pallet|wooden pallet|plastic pallet|storage rack'),
    code: '24101904', score: 93,
    evidence: 'Material handling and storage transport pallets'
  },
  {
    pattern: rx('air washer|humidification|scrubber|spray system|ahu|dehumidifier'),
    code: '40101701', score: 90,
    evidence: 'Textile processing climate and humidity control air washer units'
  },
  {
    pattern: rx(
      'bagging machine|packing machine|strapping machine|wrapping machine',
      'checkweigher|weighing machine|filling machine'
    ),
    code: '24141514', score: 91,
    evidence: 'Automatic weighing, bagging and packaging machinery'
  },
  {
    pattern: rx(
      'conveyor belt|conve\\\\.belt|conveyor|rubber belt',
      'v-belt|timing belt|transmission belt|belt feeder'
    ),
    code: '24101720', score: 92,
    evidence: 'Bulk material handling continuous conveyor belting'
  },
  {
    pattern: rx('ammonium nitrate|explosive|booster charger|column charger|detonator'),
    code: '12131700', score: 93,
    evidence: 'Mining blasting chemical and booster charge match'
  },
  {
    pattern: rx(
      'magnesia spinel|basic brick|whytheat|fire brick|wedge brick|wedge bricks',
      'refractory brick|refractory bricks|castable|accmon|dense castable|insulating brick|mortar'
    ),
    code: '30161500', score: 93,
    evidence: 'Kiln and preheater refractory lining bricks and castables'
  },
  {
    pattern: rx(
      'grinding media|high chrome|hi-chrome|forged balls|grate plate|roller tyre|roller tyres',
      'roller tire|central tube|wear plate|liner plate|mill liner|blow bar|hammer|diaphragm'
    ),
    code: '23153100', score: 92,
    evidence: 'Cement mill grinding media, cooler grate plates, and kiln alloy castings'
  },
  {
    pattern: rx(
      'girth gear|gear wheel|gearbox|pinion|spur gear',
      'helical gear|bevel gear|reduction gear|gear'
    ),
    code: '31171701', score: 92,
    evidence: 'Kiln and mill mechanical drive gears, girth gears and gearboxes'
  },
  {
    pattern: rx('ms plate|steel plate|sheet metal|structural steel|ms angle|channel'),
    code: '30101704', score: 90,
    evidence: 'Carbon/mild steel dimensional plate and structural metal match'
  },
  {
    pattern: rx('bearing|roller bearing|ball bearing|plummer block|tapered bearing'),
    code: '31171500', score: 92,
    evidence: 'Mechanical rolling element bearing specification match'
  },
  {
    pattern: rx('bolt|nut|washer|fastener|stud|hex bolt|anchor bolt|screw|rivet'),
    code: '31161500', score: 90,
    evidence: 'Standard industrial threaded fasteners, bolts, nuts and washers'
  },
  {
    pattern: rx(
      'gasket|o-ring|oil seal|mechanical seal|seal kit',
      'gland packing|teflon tape|ptfe sheet'
    ),
    code: '31401500', score: 91,
    evidence: 'Fluid containment industrial gaskets, elastomeric O-rings and mechanical seals'
  },
  {
    pattern: rx(
      'pipe|seamless pipe|erw pipe|pipe fitting',
      'flange|elbow|tee|nipple|bushing'
    ),
    code: '40171501', score: 90,
    evidence: 'Industrial process piping, seamless pipe and ASME fittings'
  },
  {
    pattern: rx('valve|butterfly valve|ball valve|gate valve|globe valve|check valve'),
    code: '40141600', score: 91,
    evidence: 'Fluid flow isolation and regulation valve specification match'
  },
  {
    pattern: rx('pump|centrifugal pump|slurry pump|submersible pump'),
    code: '40151500', score: 90,
    evidence: 'Industrial fluid handling pump specification match'
  },
  {
    pattern: rx(
      'filter element|air filter|oil filter|filter bag',
      'filter cage|filter cartridge|strainer|filter cloth'
    ),
    code: '40161500', score: 91,
    evidence: 'Baghouse dust collection filter bags, fluid filter elements and strainers'
  },
  {
    pattern: rx(
      'pressure gauge|temp\\\\.gauge|thermocouple|rtd|transmitter',
      'flow meter|transducer|sensor|level switch|limit switch'
    ),
    code: '41111900', score: 91,
    evidence: 'Plant process automation sensors, gauges and temperature transmitters'
  },
  {
    pattern: rx('cable|electrical wire|copper cable|armoured cable|instrumentation cable'),
    code: '26121600', score: 90,
    evidence: 'Industrial insulated electrical conductor match'
  },
  {
    pattern: rx('motor|induction motor|electric motor|drive|vfd'),
    code: '26101100', score: 90,
    evidence: 'Industrial rotary electric motor equipment match'
  },
  {
    pattern: rx('safety shoe|safety helmet|goggle|hand glove|safety harness|ear plug|mask|apron|coverall'),
    code: '46181500', score: 91,
    evidence: 'Industrial workplace personal protective equipment and safety gear'
  },
  {
    pattern: rx('tyre|tire|tubeless tyre|radial tyre'),
    code: '25172500', score: 92,
    evidence: 'Heavy mining equipment dump truck and loader off-road tyres'
  },
  {
    pattern: rx('fabrication|erection|installation service|mechanical service|piping work'),
    code: '72102900', score: 88,
    evidence: 'Site structural/mechanical fabrication service match'
  },
  {
    pattern: rx('electrical service|electrical work|wiring service'),
    code: '72151500', score: 88,
    evidence: 'Licensed electrical contractor maintenance service match'
  },
  {
    pattern: rx('storage charge|tank rental|demurrage|freight|transport|hydra|crane hire'),
    code: '78101800', score: 88,
    evidence: 'Material handling equipment hire and tank storage service match'
  }
];

function buildOfficialTaxonomyRules(): readonly TaxonomyClassificationRule[] {
  const dictMap = new Map(unspscOfficialDictionary.map(item => [item.commodityCode, item]));
  return Object.freeze(
    RAW_TAXONOMY_RULES.map((raw) => {
      const taxonomy = dictMap.get(raw.code);
      return {
        pattern: raw.pattern,
        unspscCode: raw.code,
        unspscTitle: taxonomy?.commodityTitle ?? \`Commodity \${raw.code}\`,
        segmentCode: taxonomy?.segmentCode ?? \`\${raw.code.substring(0, 2)}000000\`,
        segmentTitle: taxonomy?.segmentTitle ?? 'Industrial Segment',
        familyCode: taxonomy?.familyCode ?? \`\${raw.code.substring(0, 4)}0000\`,
        familyTitle: taxonomy?.familyTitle ?? 'Industrial Family',
        classCode: taxonomy?.classCode ?? \`\${raw.code.substring(0, 6)}00\`,
        classTitle: taxonomy?.classTitle ?? 'Industrial Class',
        commodityCode: raw.code,
        commodityTitle: taxonomy?.commodityTitle ?? \`Commodity \${raw.code}\`,
        confidenceScore: raw.score,
        evidence: raw.evidence
      };
    })
  );
}

export const OFFICIAL_UNSPSC_TAXONOMY_RULES: readonly TaxonomyClassificationRule[] = buildOfficialTaxonomyRules();
`;

const lines = content.trim().split('\n');
console.log('Total lines:', lines.length);
let maxLen = 0;
let longLines: string[] = [];
lines.forEach((l, i) => {
  if (l.length > maxLen) maxLen = l.length;
  if (l.length > 120) longLines.push(\`Line \${i + 1} (\${l.length} chars): \${l}\`);
});
console.log('Max line length:', maxLen);
if (longLines.length > 0) {
  console.log('Long lines:', longLines);
} else {
  const targetFile = path.resolve(__dirname, '..', 'src', 'constants', 'module2MaterialMappingTaxonomy.ts');
  fs.writeFileSync(targetFile, content, 'utf-8');
  console.log('Wrote file successfully!');
}
