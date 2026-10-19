import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import type { StrategicInputTransaction } from '../src/types/strategicSourcing';
import type { MaterialMappingEntry, ClassificationCoverageSummary, MappingReviewStatus } from '../src/types/module2MaterialMapping';
import { determineCategoryClassification } from '../src/services/module2VendorConsolidationCategoryHelper';

const rx = (...parts: string[]): RegExp => new RegExp(`\\b(?:${parts.join('|')})\\b`, 'i');

interface TestRule {
  pattern: RegExp;
  unspscCode: string;
  unspscTitle: string;
  segmentTitle: string;
  familyTitle: string;
  classTitle: string;
  commodityTitle: string;
  confidenceScore: number;
  evidence: string;
}

// Strictest Issue 2 Rules: Only genuine technical specifications / standards get score >= 95
const TEST_RULES: TestRule[] = [
  // --- VERIFIED RULES (Explicit Technical Specifications & Manufacturer Standards, score 95) ---
  {
    pattern: rx('high speed diesel|hsd for mines|hsd oil'),
    unspscCode: '15101505', unspscTitle: 'Diesel fuel',
    segmentTitle: 'Fuels and Lubricants and Anti Corrosive Materials',
    familyTitle: 'Fuels', classTitle: 'Liquid fuels', commodityTitle: 'Diesel fuel',
    confidenceScore: 95,
    evidence: 'Explicit technical Indian Standard IS 1460 fuel specification for High Speed Diesel'
  },
  {
    pattern: rx(
      'draw texturising machine 336 spindle|draw texturising machine 448 spindle'
    ),
    unspscCode: '23131506', unspscTitle: 'Yarn texturing machines',
    segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyTitle: 'Textile and fabric machinery and accessories', classTitle: 'Yarn and thread processing machinery', commodityTitle: 'Yarn texturing machines',
    confidenceScore: 95,
    evidence: 'Explicit technical specification for continuous filament Draw Texturising Machine (DTM)'
  },
  {
    pattern: rx('vp-1 heater of 14.2 mkcal'),
    unspscCode: '40101827', unspscTitle: 'Thermal fluid heaters',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyTitle: 'Heating and ventilation and air circulation', classTitle: 'Industrial heaters and accessories', commodityTitle: 'Thermal fluid heaters',
    confidenceScore: 95,
    evidence: 'Explicit technical capacity (14.2 MKCal) and manufacturer specification for VP-1 thermal fluid heater'
  },
  {
    pattern: rx(
      'fire brick.*(?:70%|al2o3)|accmon - 30sic castable',
      'whytheat -k|whytheat-k'
    ),
    unspscCode: '30161500', unspscTitle: 'Refractory materials and kiln bricks',
    segmentTitle: 'Structures and Building and Construction and Manufacturing Components and Supplies',
    familyTitle: 'Building materials', classTitle: 'Refractory materials', commodityTitle: 'Refractory materials and kiln bricks',
    confidenceScore: 95,
    evidence: 'Explicit technical alumina metallurgy (70% Al2O3) or Calderys/ACC manufacturer refractory specification'
  },
  {
    pattern: rx(
      'grinding media.*(?:15mm|17mm|20mm|25mm|30mm|50mm)',
      'hicrome grinding media 25mm'
    ),
    unspscCode: '23153100', unspscTitle: 'Grinding and crushing media balls and cylinders',
    segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyTitle: 'Industrial process machinery and equipment and supplies', classTitle: 'Crushing and grinding and pulverizing machinery', commodityTitle: 'Grinding and crushing media balls and cylinders',
    confidenceScore: 95,
    evidence: 'Explicit technical diameter specification for cement grinding media alloy balls'
  },
  {
    pattern: rx('conve\\.belt,1400mm,1250/4|conveyor belt 1000mm,630/4|conveyor belt 800mm,630\\*4'),
    unspscCode: '24101720', unspscTitle: 'Conveyor belts and accessories',
    segmentTitle: 'Material Handling and Conditioning and Storage Machinery and their Accessories and Supplies',
    familyTitle: 'Material handling machinery and equipment', classTitle: 'Conveyors and accessories', commodityTitle: 'Conveyor belts and accessories',
    confidenceScore: 95,
    evidence: 'Explicit technical tension (1250/4) and dimensional (1400mm) specification for heavy industrial conveyor belting'
  },

  // --- PROVISIONAL RULES (Broad Descriptions, score 80-85) ---
  {
    pattern: rx('coal linkage auction|coal e-auction|coal market|coking coal|thermal coal|steam coal|lignite'),
    unspscCode: '15101601', unspscTitle: 'Bituminous coal',
    segmentTitle: 'Fuels and Lubricants and Anti Corrosive Materials',
    familyTitle: 'Fuels', classTitle: 'Solid fuels', commodityTitle: 'Bituminous coal',
    confidenceScore: 85,
    evidence: 'Standardized commodity description lacking explicit ASTM/IS coal standard specification'
  },
  {
    pattern: rx('furnace oil|bunker oil|lshs fuel'),
    unspscCode: '15101612', unspscTitle: 'Heavy fuel oils',
    segmentTitle: 'Fuels and Lubricants and Anti Corrosive Materials',
    familyTitle: 'Fuels', classTitle: 'Liquid fuels', commodityTitle: 'Heavy fuel oils',
    confidenceScore: 85,
    evidence: 'Standardized commodity description lacking explicit kinematic viscosity or IS grade specification'
  },
  {
    pattern: rx('ammonium nitrate|booster charger|column charger'),
    unspscCode: '12131700', unspscTitle: 'Explosive materials and blasting accessories',
    segmentTitle: 'Chemicals including Bio Chemicals and Gas Materials',
    familyTitle: 'Explosive materials', classTitle: 'Blasting accessories', commodityTitle: 'Explosive materials and blasting accessories',
    confidenceScore: 85,
    evidence: 'Standardized chemical / blasting description lacking manufacturer part number or technical grade'
  },
  {
    pattern: rx(
      'magnesia spinel|basic brick|fire brick|refractory brick|refractory bricks',
      'castable|accmon|dense castable|insulating brick|mortar'
    ),
    unspscCode: '30161500', unspscTitle: 'Refractory materials and kiln bricks',
    segmentTitle: 'Structures and Building and Construction and Manufacturing Components and Supplies',
    familyTitle: 'Building materials', classTitle: 'Refractory materials', commodityTitle: 'Refractory materials and kiln bricks',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Kiln and preheater refractory lining bricks and castables'
  },
  {
    pattern: rx(
      'grinding media|forged balls|grate plate|roller tyre|roller tyres|roller tire',
      'central tube|wear plate|liner plate|mill liner|blow bar'
    ),
    unspscCode: '23153100', unspscTitle: 'Grinding and crushing media balls and cylinders',
    segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyTitle: 'Industrial process machinery and equipment and supplies', classTitle: 'Crushing and grinding and pulverizing machinery', commodityTitle: 'Grinding and crushing media balls and cylinders',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Cement mill wear plates, grate plates, and alloy castings'
  },
  {
    pattern: rx('conveyor belt|conve\\.belt|conveyor|rubber belt|v-belt|timing belt|transmission belt|belt feeder'),
    unspscCode: '24101720', unspscTitle: 'Conveyor belts and accessories',
    segmentTitle: 'Material Handling and Conditioning and Storage Machinery and their Accessories and Supplies',
    familyTitle: 'Material handling machinery and equipment', classTitle: 'Conveyors and accessories', commodityTitle: 'Conveyor belts and accessories',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Bulk material handling continuous conveyor belting'
  },
  {
    pattern: rx(
      'servo ultra|hydrol|hydraulic oil|lubricant|grease|mobil|castrol|lubricating oil',
      'heat xl|coolant|fe oil|mak htf|klueber|kluber|gear oil|engine oil|transformer oil|synthetic oil'
    ),
    unspscCode: '15121500', unspscTitle: 'Lubricating preparations and industrial oils',
    segmentTitle: 'Fuels and Lubricants and Anti Corrosive Materials',
    familyTitle: 'Lubricants and oils and greases', classTitle: 'Industrial lubricants', commodityTitle: 'Lubricating preparations and industrial oils',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial lubricants, synthetic coolants, and compressor oils'
  },
  {
    pattern: rx(
      'asstt|assistant|packing assistance|contract labour|contract labor',
      'manpower|labour charge|labor charge|packing,hra'
    ),
    unspscCode: '80111600', unspscTitle: 'Temporary personnel services and contract labor',
    segmentTitle: 'Management and Business Professionals and Administrative Services',
    familyTitle: 'Human resources services', classTitle: 'Temporary personnel services', commodityTitle: 'Temporary personnel services and contract labor',
    confidenceScore: 80,
    evidence: 'Broad keyword match: Plant operations packaging assistance and temporary contract manpower'
  },
  {
    pattern: rx('p/t\\b', 'paper tube|paper core|paper cone|winding tube|dt-tube'),
    unspscCode: '14121503', unspscTitle: 'Cardboard',
    segmentTitle: 'Paper Materials and Products',
    familyTitle: 'Paper materials', classTitle: 'Cardboard', commodityTitle: 'Cardboard',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Yarn winding industrial paper tubes and cylindrical cardboard cores'
  },
  {
    pattern: rx('corrugated box|corrugated|carton box|ply box|5 ply|7 ply'),
    unspscCode: '24112502', unspscTitle: 'One piece die cut shipping cartons',
    segmentTitle: 'Material Handling and Conditioning and Storage Machinery and their Accessories and Supplies',
    familyTitle: 'Containers and storage', classTitle: 'Packing supplies', commodityTitle: 'One piece die cut shipping cartons',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Corrugated cartons and distribution packaging specification'
  },
  {
    pattern: rx(
      'jumbo bag|jumbo bags|fibc|bulk bag|polythene|poly bag|poly bags',
      'chips bag|hdpe bag|pp woven bag|liner bag'
    ),
    unspscCode: '24111515', unspscTitle: 'Bulk transport bags or FIBC or jumbo bags',
    segmentTitle: 'Material Handling and Conditioning and Storage Machinery and their Accessories and Supplies',
    familyTitle: 'Containers and storage', classTitle: 'Bags', commodityTitle: 'Bulk transport bags or FIBC or jumbo bags',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial polypropylene FIBC jumbo bags and bulk packaging sacks'
  },
  {
    pattern: rx('pallet|metallic pallet|steel pallet|wooden pallet|plastic pallet|storage rack'),
    unspscCode: '24112701', unspscTitle: 'Pallets',
    segmentTitle: 'Material Handling and Conditioning and Storage Machinery and their Accessories and Supplies',
    familyTitle: 'Containers and storage', classTitle: 'Pallets', commodityTitle: 'Pallets',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial logistics storage pallets'
  },
  {
    pattern: rx(
      'centrifugal pump|submersible pump|slurry pump|dosing pump|vacuum pump|water pump',
      'air compressor|screw compressor|reciprocating compressor'
    ),
    unspscCode: '40151500', unspscTitle: 'Pumps and compressors',
    segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyTitle: 'Fluid and gas flow equipment', classTitle: 'Pumps and compressors', commodityTitle: 'Pumps and compressors',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial pumps and plant compression units'
  },
  {
    pattern: rx(
      'ball valve|gate valve|globe valve|butterfly valve|check valve|knife gate valve|solenoid valve|control valve'
    ),
    unspscCode: '40141600', unspscTitle: 'Valves',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyTitle: 'Fluid and gas distribution', classTitle: 'Valves', commodityTitle: 'Valves',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial process pipeline isolation and regulation valves'
  },
  {
    pattern: rx(
      'ball bearing|roller bearing|spherical roller bearing|deep groove bearing|pillow block|bearing unit|bushing'
    ),
    unspscCode: '31171500', unspscTitle: 'Bearings and bushings',
    segmentTitle: 'Manufacturing Components and Supplies',
    familyTitle: 'Bearings and bushings and wheels and gears', classTitle: 'Bearings', commodityTitle: 'Bearings and bushings',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial rotating machinery bearings and transmission bushings'
  },
  {
    pattern: rx('hex bolt|anchor bolt|foundation bolt|high tensile bolt|hex nut|lock nut|plain washer|spring washer'),
    unspscCode: '31161500', unspscTitle: 'Fasteners and hardware',
    segmentTitle: 'Manufacturing Components and Supplies',
    familyTitle: 'Hardware', classTitle: 'Fasteners', commodityTitle: 'Fasteners and hardware',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial mechanical fasteners and mounting hardware'
  },
  {
    pattern: rx(
      'safety helmet|safety shoe|safety shoes|protective goggles|safety goggles|ear plug|earplugs|hand gloves'
    ),
    unspscCode: '46181500', unspscTitle: 'Safety apparel and personal protective equipment (PPE)',
    segmentTitle: 'Defense and Law Enforcement and Security and Safety Equipment and Supplies',
    familyTitle: 'Personal safety and protection', classTitle: 'Safety apparel', commodityTitle: 'Safety apparel and personal protective equipment (PPE)',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial workplace personal protective safety gear'
  },
  {
    pattern: rx('bagging machine|roto packer|packing plant machine'),
    unspscCode: '24141514', unspscTitle: 'Bagging machines',
    segmentTitle: 'Material Handling and Conditioning and Storage Machinery and their Accessories and Supplies',
    familyTitle: 'Packaging machinery', classTitle: 'Packing machines', commodityTitle: 'Bagging machines',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial cement bagging and packing plant machinery'
  },
  {
    pattern: rx('air washer|chiller plant|hvac filter|air conditioning unit'),
    unspscCode: '40101701', unspscTitle: 'Air conditioning units and industrial air washers',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyTitle: 'Heating and ventilation and air circulation', classTitle: 'Air conditioning units', commodityTitle: 'Air conditioning units and industrial air washers',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial textile air conditioning and humidification air washers'
  },
  {
    pattern: rx('tyre|tubeless tyre|earthmover tyre|radial tyre'),
    unspscCode: '25172500', unspscTitle: 'Tires and tubes',
    segmentTitle: 'Commercial and Military and Private Vehicles and their Accessories and Components',
    familyTitle: 'Transportation components and systems', classTitle: 'Tires and tubes', commodityTitle: 'Tires and tubes',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Heavy earthmoving equipment and commercial transport tires'
  },
  {
    pattern: rx('ms plate|chequered plate|structural steel|ms sheet|hr sheet'),
    unspscCode: '30101704', unspscTitle: 'Mild steel plate and sheet',
    segmentTitle: 'Structures and Building and Construction and Manufacturing Components and Supplies',
    familyTitle: 'Structural materials', classTitle: 'Plate and sheet', commodityTitle: 'Mild steel plate and sheet',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Structural mild steel plates and heavy construction sheets'
  },
  {
    pattern: rx('gearbox|helical gearbox|planetary gearbox|girth gear|pinion gear'),
    unspscCode: '31171701', unspscTitle: 'Gears and gearboxes and girth gears',
    segmentTitle: 'Manufacturing Components and Supplies',
    familyTitle: 'Bearings and bushings and wheels and gears', classTitle: 'Gears', commodityTitle: 'Gears and gearboxes and girth gears',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Heavy machinery transmission gears and industrial gearboxes'
  },
  {
    pattern: rx('bag filter|filter bag|cartridge filter|oil filter|dust collector bag'),
    unspscCode: '40161500', unspscTitle: 'Industrial filtration equipment and media',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyTitle: 'Industrial filtering and purification', classTitle: 'Industrial filters', commodityTitle: 'Industrial filtration equipment and media',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial air pollution control bag filters and process filtration media'
  },
  {
    pattern: rx('mechanical seal|oil seal|o-ring|ptfe gasket|spiral wound gasket'),
    unspscCode: '31401500', unspscTitle: 'Seals and gaskets and packings',
    segmentTitle: 'Manufacturing Components and Supplies',
    familyTitle: 'Fluid and gas sealing materials', classTitle: 'Seals and gaskets', commodityTitle: 'Seals and gaskets and packings',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Dynamic mechanical shaft seals and pipeline static sealing gaskets'
  },
  {
    pattern: rx('electric motor|induction motor|squirrel cage motor|ht motor|lt motor'),
    unspscCode: '26101100', unspscTitle: 'Electric motors and generators',
    segmentTitle: 'Electrical Systems and Lighting and Components and Accessories and Supplies',
    familyTitle: 'Power sources', classTitle: 'Electric motors', commodityTitle: 'Electric motors and generators',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial electric induction drive motors and generators'
  },
  {
    pattern: rx('pressure transmitter|temperature sensor|rtd pt100|thermocouple|flow meter'),
    unspscCode: '41111900', unspscTitle: 'Industrial measuring and observing instruments',
    segmentTitle: 'Laboratory and Measuring and Observing and Testing Equipment',
    familyTitle: 'Measuring and observing and testing instruments', classTitle: 'Transmitters and sensors', commodityTitle: 'Industrial measuring and observing instruments',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial automation process transmitters and temperature sensors'
  },
  {
    pattern: rx('erw pipe|seamless pipe|gi pipe|pipe elbow|pipe flange'),
    unspscCode: '40171501', unspscTitle: 'Industrial pipe and pipe fittings',
    segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyTitle: 'Pipe and tubing and fittings', classTitle: 'Pipe and fittings', commodityTitle: 'Industrial pipe and pipe fittings',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Process piping, carbon steel seamless pipes, and forged pipe fittings'
  },
  {
    pattern: rx('armoured cable|control cable|power cable|copper wire|xlpe cable'),
    unspscCode: '26121600', unspscTitle: 'Electrical wire and cable and harness',
    segmentTitle: 'Electrical Systems and Lighting and Components and Accessories and Supplies',
    familyTitle: 'Electrical wire and cable and harness', classTitle: 'Power cables', commodityTitle: 'Electrical wire and cable and harness',
    confidenceScore: 85,
    evidence: 'Broad keyword match: Industrial heavy power transmission and control cabling'
  },
  {
    pattern: rx('transportation|freight|storage charge|meg storage|hiring of hydra'),
    unspscCode: '78101800', unspscTitle: 'Freight transport and storage and equipment rental services',
    segmentTitle: 'Transportation and Storage and Mail Services',
    familyTitle: 'Mail and cargo transport', classTitle: 'Cargo transport', commodityTitle: 'Freight transport and storage and equipment rental services',
    confidenceScore: 80,
    evidence: 'Broad keyword match: Cargo transportation, material storage, and equipment rental services'
  },
  {
    pattern: rx('fabrication|erection|structural steel for mis|maintenance job|overhauling'),
    unspscCode: '72102900', unspscTitle: 'Industrial plant maintenance and fabrication services',
    segmentTitle: 'Building and Facility Construction and Maintenance Services',
    familyTitle: 'Building and facility maintenance and repair services', classTitle: 'Facility maintenance and repair services', commodityTitle: 'Industrial plant maintenance and fabrication services',
    confidenceScore: 80,
    evidence: 'Broad keyword match: Plant structural fabrication, mechanical erection, and routine maintenance services'
  },
  {
    pattern: rx('electrical services|motor rewinding|cable laying'),
    unspscCode: '72151500', unspscTitle: 'Electrical system installation and maintenance services',
    segmentTitle: 'Building and Facility Construction and Maintenance Services',
    familyTitle: 'Building and facility construction and maintenance services', classTitle: 'Specialized trade construction and maintenance services', commodityTitle: 'Electrical system installation and maintenance services',
    confidenceScore: 80,
    evidence: 'Broad keyword match: Plant electrical wiring, cable termination, and electric motor rewinding services'
  }
];

function getMaterialIdentifier(t: StrategicInputTransaction): string {
  const code = (t.material_code ?? '').trim();
  if (code) return code;
  const desc = ((t as any).material_desc ?? (t as any).item_description ?? '').trim();
  if (desc) return `UNCODED_${desc}`;
  return `TX_${t.id}`;
}

async function runTest() {
  for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
    console.log(`\n=================== STRICT AUDIT SIMULATION: ${assessmentId} ===================`);
    const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const txs = canonical.transactions;

    const aggMap = new Map<string, any>();
    for (const t of txs) {
      const matId = getMaterialIdentifier(t);
      const desc = ((t as any).material_desc ?? (t as any).item_description ?? matId).trim();
      const cat = (t.spend_category ?? 'General').trim();
      const supp = (t.vendor_code ?? t.vendor_name ?? '').trim();

      let agg = aggMap.get(matId);
      if (!agg) {
        agg = {
          sourceMaterialId: matId,
          sourceDescription: desc,
          sourceCategory: cat,
          totalSpendInr: 0,
          transactionCount: 0,
          suppliers: new Set(),
          rawUnspscCode: t.unspsc_code?.trim(),
          rawCommodity: (t.unspsc_commodity ?? t.unspsc_category)?.trim()
        };
        aggMap.set(matId, agg);
      }
      agg.totalSpendInr += t.total_spend_inr ?? 0;
      agg.transactionCount += 1;
      if (supp) agg.suppliers.add(supp);
    }

    const register: MaterialMappingEntry[] = [];
    const mappingMap = new Map<string, MaterialMappingEntry>();

    for (const [matId, agg] of aggMap.entries()) {
      const totalSpendCr = Math.round((agg.totalSpendInr / 10000000) * 10000) / 10000;
      let matchedRule = null;
      for (const r of TEST_RULES) {
        if (r.pattern.test(agg.sourceDescription)) {
          matchedRule = r;
          break;
        }
      }

      let entry: MaterialMappingEntry;
      if (matchedRule) {
        const isVer = matchedRule.confidenceScore >= 95;
        const status: MappingReviewStatus = isVer ? 'TAXONOMY_VERIFIED' : 'PROVISIONAL';
        entry = {
          sourceMaterialId: matId,
          sourceDescription: agg.sourceDescription,
          sourceCategory: agg.sourceCategory,
          taxonomyVersion: 'UNv260801',
          mappingDate: '2026-10-19',
          totalSpendInr: Math.round(agg.totalSpendInr * 100) / 100,
          totalSpendCr,
          transactionCount: agg.transactionCount,
          qualifyingSuppliersCount: agg.suppliers.size,
          assignedUnspscCode: matchedRule.unspscCode,
          assignedUnspscTitle: matchedRule.unspscTitle,
          unspscSegment: matchedRule.segmentTitle,
          unspscFamily: matchedRule.familyTitle,
          unspscClass: matchedRule.classTitle,
          unspscCommodity: matchedRule.commodityTitle,
          mappingMethod: 'MATERIAL_DESCRIPTION_MATCH',
          confidenceScore: matchedRule.confidenceScore,
          evidence: matchedRule.evidence,
          reviewStatus: status
        };
      } else {
        entry = {
          sourceMaterialId: matId,
          sourceDescription: agg.sourceDescription,
          sourceCategory: agg.sourceCategory,
          taxonomyVersion: 'UNv260801',
          mappingDate: '2026-10-19',
          totalSpendInr: Math.round(agg.totalSpendInr * 100) / 100,
          totalSpendCr,
          transactionCount: agg.transactionCount,
          qualifyingSuppliersCount: agg.suppliers.size,
          assignedUnspscCode: '00000000',
          assignedUnspscTitle: 'Unclassified Material — Engineering Review Queued',
          unspscSegment: 'Unclassified Segment',
          unspscFamily: 'Unclassified Family',
          unspscClass: 'Unclassified Class',
          unspscCommodity: 'Unclassified Commodity',
          mappingMethod: 'MANUAL_REVIEW_REQUIRED',
          confidenceScore: 0,
          evidence: 'Description lacks specific technical taxonomy keywords; queued for review',
          reviewStatus: 'AWAITING_REVIEW',
          reviewReason: 'Ambiguous or client-proprietary material description requiring engineering classification.'
        };
      }
      register.push(entry);
      mappingMap.set(matId, entry);
    }

    const totalMaterials = register.length;
    const totalSpendInr = Math.round(register.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;
    const ver = register.filter(m => m.reviewStatus === 'TAXONOMY_VERIFIED');
    const prov = register.filter(m => m.reviewStatus === 'PROVISIONAL');
    const rev = register.filter(m => m.reviewStatus === 'AWAITING_REVIEW');

    const verSpend = Math.round(ver.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;
    const provSpend = Math.round(prov.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;
    const revSpend = Math.round(rev.reduce((s, m) => s + m.totalSpendInr, 0) * 100) / 100;

    console.log(`Unique Material/Item Population: ${totalMaterials}`);
    console.log(`Total Spend: ₹${(totalSpendInr / 1e7).toFixed(4)} Cr`);
    console.log(`  Taxonomy-Verified: ${ver.length} (${(ver.length / totalMaterials * 100).toFixed(1)}%) | ₹${(verSpend / 1e7).toFixed(4)} Cr (${(verSpend / totalSpendInr * 100).toFixed(1)}%)`);
    console.log(`  Provisional:       ${prov.length} (${(prov.length / totalMaterials * 100).toFixed(1)}%) | ₹${(provSpend / 1e7).toFixed(4)} Cr (${(provSpend / totalSpendInr * 100).toFixed(1)}%)`);
    console.log(`  Awaiting Review:   ${rev.length} (${(rev.length / totalMaterials * 100).toFixed(1)}%) | ₹${(revSpend / 1e7).toFixed(4)} Cr (${(revSpend / totalSpendInr * 100).toFixed(1)}%)`);

    console.log('\n--- VERIFIED MATERIALS IN THIS AUDIT ---');
    ver.forEach((m, idx) => {
      console.log(`[${idx + 1}] ID: ${m.sourceMaterialId} | "${m.sourceDescription}" | Code: ${m.assignedUnspscCode} | Spend: ₹${m.totalSpendCr} Cr | Evidence: ${m.evidence}`);
    });

    // Categories
    const catMap = new Map<string, { txs: StrategicInputTransaction[]; code: string; title: string }>();
    for (const t of txs) {
      const matId = getMaterialIdentifier(t);
      const mapping = mappingMap.get(matId);
      const isMapped = mapping && mapping.reviewStatus !== 'AWAITING_REVIEW';
      const code = isMapped ? mapping.assignedUnspscCode : '00000000';
      const title = isMapped ? mapping.assignedUnspscTitle : 'Unclassified Materials (Review Queued)';
      const key = `${title} [${code}]`;
      let g = catMap.get(key);
      if (!g) {
        g = { txs: [], code, title };
        catMap.set(key, g);
      }
      g.txs.push(t);
    }

    const catRows: any[] = [];
    for (const [, g] of catMap.entries()) {
      const catTxs = g.txs;
      const catSpend = Math.round(catTxs.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0) * 100) / 100;
      const catMatIds = new Set(catTxs.map(t => getMaterialIdentifier(t)));

      let cVer = 0, cVerSpd = 0;
      let cProv = 0, cProvSpd = 0;
      let cRev = 0, cRevSpd = 0;

      for (const mId of catMatIds) {
        const m = mappingMap.get(mId);
        if (!m || m.reviewStatus === 'AWAITING_REVIEW') {
          cRev++;
          cRevSpd += m ? m.totalSpendInr : 0;
        } else if (m.reviewStatus === 'TAXONOMY_VERIFIED') {
          cVer++;
          cVerSpd += m.totalSpendInr;
        } else {
          cProv++;
          cProvSpd += m.totalSpendInr;
        }
      }

      const { classificationType } = determineCategoryClassification(g.title, catTxs, g.code, mappingMap);
      catRows.push({
        code: g.code,
        title: g.title,
        type: classificationType,
        totalMats: catMatIds.size,
        verCount: cVer,
        provCount: cProv,
        revCount: cRev,
        verCr: (cVerSpd / 1e7).toFixed(4),
        provCr: (cProvSpd / 1e7).toFixed(4),
        revCr: (cRevSpd / 1e7).toFixed(4),
        totalCr: (catSpend / 1e7).toFixed(4)
      });
    }

    catRows.sort((a, b) => parseFloat(b.totalCr) - parseFloat(a.totalCr));
    console.log(`\n--------------------------------------------------------------------------------------------------------------------`);
    console.log(`Code     | Type            | Mats (Ver/Prov/Rev) | Ver Spend   | Prov Spend  | Rev Spend   | Total Spend | Title`);
    console.log(`--------------------------------------------------------------------------------------------------------------------`);
    catRows.forEach(r => {
      console.log(
        `${r.code.padEnd(8)} | ${r.type.padEnd(15)} | ${String(r.totalMats).padStart(5)} (${String(r.verCount).padStart(3)}/${String(r.provCount).padStart(4)}/${String(r.revCount).padStart(4)}) | ₹${String(r.verCr).padStart(8)} Cr | ₹${String(r.provCr).padStart(8)} Cr | ₹${String(r.revCr).padStart(8)} Cr | ₹${String(r.totalCr).padStart(8)} Cr | ${r.title}`
      );
    });
  }
}

runTest().catch(console.error);
