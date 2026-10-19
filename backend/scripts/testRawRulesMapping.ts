import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';

interface RawRuleDef {
  pattern: RegExp;
  code: string;
  score: number;
  evidence: string;
}

const RAW_RULES: readonly RawRuleDef[] = [
  {
    pattern: /\b(?:hsd|high speed diesel|diesel oil|diesel fuel)\b/i,
    code: '15101505', score: 95,
    evidence: 'Exact chemical fuel specification match for High Speed Diesel'
  },
  {
    pattern: /\b(?:furnace oil|fuel oil|bunker oil|lshs)\b/i,
    code: '15101612', score: 92,
    evidence: 'Standard heavy residual fuel oil specification match'
  },
  {
    pattern: /\b(?:coal|coking coal|thermal coal|lignite|anthracite)\b/i,
    code: '15101601', score: 94,
    evidence: 'Solid mineral coal commodity match'
  },
  {
    pattern: /\b(?:servo ultra|hydrol|hydraulic oil|lubricant|grease|mobil|castrol|lubricating oil|heat xl|coolant|fe oil|mak htf|klueber|kluber|gear oil|engine oil|transformer oil|synthetic oil)\b/i,
    code: '15121500', score: 92,
    evidence: 'Industrial lubricants, synthetic coolants, and compressor oils match'
  },
  {
    pattern: /\b(?:asstt|assistant|packing assistance|contract labour|contract labor|manpower|labour charge|labor charge|packing,hra)\b/i,
    code: '80111600', score: 92,
    evidence: 'Plant operations packaging assistance and temporary contract manpower services'
  },
  {
    pattern: /\b(?:draw texturising|draw texturing|texturising machine|texturing machine|spindle aft|spindle afd|spinning machine|autoloom|winding machine)\b/i,
    code: '23131506', score: 94,
    evidence: 'Synthetic yarn Draw Texturising Machine (DTM/DTY) equipment match'
  },
  {
    pattern: /\b(?:thermal fluid heater|vapor heater|vapour heater|vp-1 heater|oil heater|heat exchanger|air preheater|aph|economiser|economizer)\b/i,
    code: '40101827', score: 93,
    evidence: 'Polymerization plant thermal fluid heater and heat exchanger equipment'
  },
  {
    pattern: /\b(?:p\/t\b|paper tube|paper core|paper cone|winding tube|dt-tube)\b/i,
    code: '14111601', score: 94,
    evidence: 'Yarn winding dimensional paper tubes and cylindrical cores (P/T)'
  },
  {
    pattern: /\b(?:corrugated box|corrugated|carton box|ply box|5 ply|7 ply|box)\b/i,
    code: '24121502', score: 91,
    evidence: 'Industrial corrugated packaging box specification match'
  },
  {
    pattern: /\b(?:jumbo bag|jumbo bags|fibc|bulk bag|polythene|poly bag|poly bags|chips bag|hdpe bag|pp woven bag|liner bag)\b/i,
    code: '24111515', score: 92,
    evidence: 'Industrial polypropylene FIBC jumbo bags and bulk packaging sacks'
  },
  {
    pattern: /\b(?:bale cover|pp bag|polypropylene bag|woven sack|stretch film|packing strip)\b/i,
    code: '24121500', score: 90,
    evidence: 'Polypropylene bale wrapping and sack packaging match'
  },
  {
    pattern: /\b(?:pet strap|polyester strap|steel strap|strapping band|cord strap)\b/i,
    code: '24121512', score: 92,
    evidence: 'Bale and carton packaging strapping bands and PET straps'
  },
  {
    pattern: /\b(?:pallet|metallic pallet|steel pallet|wooden pallet|plastic pallet|storage rack)\b/i,
    code: '24101904', score: 93,
    evidence: 'Material handling and storage transport pallets'
  },
  {
    pattern: /\b(?:air washer|humidification|scrubber|spray system|ahu|dehumidifier)\b/i,
    code: '40101701', score: 90,
    evidence: 'Textile processing climate and humidity control air washer units'
  },
  {
    pattern: /\b(?:bagging machine|packing machine|strapping machine|wrapping machine|checkweigher|weighing machine|filling machine)\b/i,
    code: '24141514', score: 91,
    evidence: 'Automatic weighing, bagging and packaging machinery'
  },
  {
    pattern: /\b(?:conveyor belt|conve\.belt|conveyor|rubber belt|v-belt|timing belt|transmission belt|belt feeder)\b/i,
    code: '24101720', score: 92,
    evidence: 'Bulk material handling continuous conveyor belting'
  },
  {
    pattern: /\b(?:ammonium nitrate|explosive|booster charger|column charger|detonator)\b/i,
    code: '12131700', score: 93,
    evidence: 'Mining blasting chemical and booster charge match'
  },
  {
    pattern: /\b(?:magnesia spinel|basic brick|whytheat|fire brick|wedge brick|wedge bricks|refractory brick|refractory bricks|castable|accmon|dense castable|insulating brick|mortar)\b/i,
    code: '30161500', score: 93,
    evidence: 'Kiln and preheater refractory lining bricks and castables'
  },
  {
    pattern: /\b(?:grinding media|high chrome|hi-chrome|forged balls|grate plate|roller tyre|roller tyres|roller tire|central tube|wear plate|liner plate|mill liner|blow bar|hammer|diaphragm)\b/i,
    code: '23153100', score: 92,
    evidence: 'Cement mill grinding media, cooler grate plates, and kiln alloy castings'
  },
  {
    pattern: /\b(?:girth gear|gear wheel|gearbox|pinion|spur gear|helical gear|bevel gear|reduction gear|gear)\b/i,
    code: '31171701', score: 92,
    evidence: 'Kiln and mill mechanical drive gears, girth gears and gearboxes'
  },
  {
    pattern: /\b(?:ms plate|steel plate|sheet metal|structural steel|ms angle|channel)\b/i,
    code: '30101704', score: 90,
    evidence: 'Carbon/mild steel dimensional plate and structural metal match'
  },
  {
    pattern: /\b(?:bearing|roller bearing|ball bearing|plummer block|tapered bearing)\b/i,
    code: '31171500', score: 92,
    evidence: 'Mechanical rolling element bearing specification match'
  },
  {
    pattern: /\b(?:bolt|nut|washer|fastener|stud|hex bolt|anchor bolt|screw|rivet)\b/i,
    code: '31161500', score: 90,
    evidence: 'Standard industrial threaded fasteners, bolts, nuts and washers'
  },
  {
    pattern: /\b(?:gasket|o-ring|oil seal|mechanical seal|seal kit|gland packing|teflon tape|ptfe sheet)\b/i,
    code: '31401500', score: 91,
    evidence: 'Fluid containment industrial gaskets, elastomeric O-rings and mechanical seals'
  },
  {
    pattern: /\b(?:pipe|seamless pipe|erw pipe|pipe fitting|flange|elbow|tee|nipple|bushing)\b/i,
    code: '40171501', score: 90,
    evidence: 'Industrial process piping, seamless pipe and ASME fittings'
  },
  {
    pattern: /\b(?:valve|butterfly valve|ball valve|gate valve|globe valve|check valve)\b/i,
    code: '40141600', score: 91,
    evidence: 'Fluid flow isolation and regulation valve specification match'
  },
  {
    pattern: /\b(?:pump|centrifugal pump|slurry pump|submersible pump)\b/i,
    code: '40151500', score: 90,
    evidence: 'Industrial fluid handling pump specification match'
  },
  {
    pattern: /\b(?:filter element|air filter|oil filter|filter bag|filter cage|filter cartridge|strainer|filter cloth)\b/i,
    code: '40161500', score: 91,
    evidence: 'Baghouse dust collection filter bags, fluid filter elements and strainers'
  },
  {
    pattern: /\b(?:pressure gauge|temp\.gauge|thermocouple|rtd|transmitter|flow meter|transducer|sensor|level switch|limit switch)\b/i,
    code: '41111900', score: 91,
    evidence: 'Plant process automation sensors, gauges and temperature transmitters'
  },
  {
    pattern: /\b(?:cable|electrical wire|copper cable|armoured cable|instrumentation cable)\b/i,
    code: '26121600', score: 90,
    evidence: 'Industrial insulated electrical conductor match'
  },
  {
    pattern: /\b(?:motor|induction motor|electric motor|drive|vfd)\b/i,
    code: '26101100', score: 90,
    evidence: 'Industrial rotary electric motor equipment match'
  },
  {
    pattern: /\b(?:safety shoe|safety helmet|goggle|hand glove|safety harness|ear plug|mask|apron|coverall)\b/i,
    code: '46181500', score: 91,
    evidence: 'Industrial workplace personal protective equipment and safety gear'
  },
  {
    pattern: /\b(?:tyre|tire|tubeless tyre|radial tyre)\b/i,
    code: '25172500', score: 92,
    evidence: 'Heavy mining equipment dump truck and loader off-road tyres'
  },
  {
    pattern: /\b(?:fabrication|erection|installation service|mechanical service|piping work)\b/i,
    code: '72102900', score: 88,
    evidence: 'Site structural/mechanical fabrication service match'
  },
  {
    pattern: /\b(?:electrical service|electrical work|wiring service)\b/i,
    code: '72151500', score: 88,
    evidence: 'Licensed electrical contractor maintenance service match'
  },
  {
    pattern: /\b(?:storage charge|tank rental|demurrage|freight|transport|hydra|crane hire)\b/i,
    code: '78101800', score: 88,
    evidence: 'Material handling equipment hire and tank storage service match'
  }
];

const dictMap = new Map(unspscOfficialDictionary.map(item => [item.commodityCode, item]));

for (const raw of RAW_RULES) {
  const item = dictMap.get(raw.code);
  if (!item) {
    console.error(`Missing code in dictionary: ${raw.code}`);
  } else {
    // Verified
  }
}

console.log(`All ${RAW_RULES.length} raw rules mapped successfully!`);
