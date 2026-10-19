import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { OFFICIAL_UNSPSC_TAXONOMY_RULES } from '../src/constants/module2MaterialMappingTaxonomy';

export const PROPOSED_ENHANCED_RULES_V2 = [
  ...OFFICIAL_UNSPSC_TAXONOMY_RULES,

  // 1. Manpower / Packing assistance services (High spend in Textile: ₹204.97 Cr!)
  {
    pattern: /\b(?:asstt|assistant|packing assistance|contract labour|contract labor|manpower|labour charge|labor charge|packing,hra)\b/i,
    unspscCode: '80111600', unspscTitle: 'Temporary personnel services and contract labor',
    segmentCode: '80000000', segmentTitle: 'Management and Business Professionals and Administrative Services',
    familyCode: '80110000', familyTitle: 'Human resources services',
    classCode: '80111600', classTitle: 'Temporary personnel services',
    commodityCode: '80111600', commodityTitle: 'Temporary personnel services and contract labor',
    confidenceScore: 92, evidence: 'Plant operations packaging assistance and temporary contract manpower services'
  },

  // 2. Synthetic yarn draw texturising machinery & spinning machines (Textile: ₹43.64 Cr)
  {
    pattern: /\b(?:draw texturising|draw texturing|texturising machine|texturing machine|spindle aft|spindle afd|spinning machine|autoloom|winding machine)\b/i,
    unspscCode: '23131506', unspscTitle: 'Yarn texturing machines',
    segmentCode: '23000000', segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyCode: '23130000', familyTitle: 'Textile and fabric machinery and accessories',
    classCode: '23131500', classTitle: 'Textile spinning and winding and twisting and texturising machinery',
    commodityCode: '23131506', commodityTitle: 'Yarn texturing machines',
    confidenceScore: 94, evidence: 'Synthetic yarn Draw Texturising Machine (DTM/DTY) multi-spindle equipment'
  },

  // 3. Industrial thermal fluid / vapor heaters & heat exchangers (Textile: ₹16.57 Cr)
  {
    pattern: /\b(?:thermal fluid heater|vapor heater|vapour heater|vp-1 heater|oil heater|heat exchanger|air preheater|aph|economiser|economizer)\b/i,
    unspscCode: '40101827', unspscTitle: 'Thermal fluid heaters',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40100000', familyTitle: 'Heating and ventilation and air circulation',
    classCode: '40101800', classTitle: 'Industrial boilers and thermal heaters',
    commodityCode: '40101827', commodityTitle: 'Thermal fluid heaters',
    confidenceScore: 93, evidence: 'Continuous polymerization plant thermal fluid / vapor heater and heat exchanger equipment'
  },

  // 4. FIBC Jumbo Bags and Polypropylene bags (Textile: ₹8.78 Cr)
  {
    pattern: /\b(?:jumbo bag|jumbo bags|fibc|bulk bag|polythene|poly bag|poly bags|chips bag|hdpe bag|pp woven bag|liner bag)\b/i,
    unspscCode: '24111515', unspscTitle: 'Bulk transport bags or FIBC or jumbo bags',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24110000', familyTitle: 'Containers and storage',
    classCode: '24111500', classTitle: 'Bags',
    commodityCode: '24111515', commodityTitle: 'Bulk transport bags or FIBC or jumbo bags',
    confidenceScore: 92, evidence: 'Industrial polypropylene FIBC jumbo bags and poly bulk packaging sacks'
  },

  // 5. Paper tubes / cores with P/T notation (Textile: ₹17.0 Cr)
  {
    pattern: /\b(?:p\/t\b|paper tube|paper core|paper cone|winding tube|dt-tube)\b/i,
    unspscCode: '14111601', unspscTitle: 'Paper tubes or cores',
    segmentCode: '14000000', segmentTitle: 'Paper Materials and Products',
    familyCode: '14110000', familyTitle: 'Paper products',
    classCode: '14111600', classTitle: 'Novelty and specialty paper products',
    commodityCode: '14111601', commodityTitle: 'Paper tubes or cores',
    confidenceScore: 95, evidence: 'Synthetic yarn winding dimensional paper tubes and cylindrical cores (P/T)'
  },

  // 6. Pallets and Material Handling structures (Textile: ₹3.04 Cr)
  {
    pattern: /\b(?:pallet|metallic pallet|steel pallet|wooden pallet|plastic pallet|storage rack)\b/i,
    unspscCode: '24101904', unspscTitle: 'Pallets',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24100000', familyTitle: 'Material handling machinery and equipment',
    classCode: '24101900', classTitle: 'Lifting and moving equipment and accessories',
    commodityCode: '24101904', commodityTitle: 'Pallets',
    confidenceScore: 93, evidence: 'Material handling and storage transport pallets'
  },

  // 7. HVAC & Humidification Air Washer Units (Textile: ₹2.87 Cr)
  {
    pattern: /\b(?:air washer|humidification|scrubber|spray system|ahu|dehumidifier)\b/i,
    unspscCode: '40101701', unspscTitle: 'Air conditioning units and industrial air washers',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40100000', familyTitle: 'Heating and ventilation and air circulation',
    classCode: '40101700', classTitle: 'Cooling systems and accessories',
    commodityCode: '40101701', commodityTitle: 'Air conditioning units and industrial air washers',
    confidenceScore: 90, evidence: 'Textile processing climate and humidity control air washer units'
  },

  // 8. Packaging & Weighing / Bagging Machinery (Textile: ₹2.28 Cr)
  {
    pattern: /\b(?:bagging machine|packing machine|strapping machine|wrapping machine|checkweigher|weighing machine|filling machine)\b/i,
    unspscCode: '24141514', unspscTitle: 'Bagging machines',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24140000', familyTitle: 'Packaging machinery',
    classCode: '24141500', classTitle: 'Industrial packaging machinery',
    commodityCode: '24141514', commodityTitle: 'Bagging machines',
    confidenceScore: 92, evidence: 'Automatic weighing, bagging and packaging machinery'
  },

  // 9. Steel pipes & fittings (Textile: ₹1.81 Cr)
  {
    pattern: /\b(?:pipe|seamless pipe|erw pipe|pipe fitting|flange|elbow|tee|nipple|bushing)\b/i,
    unspscCode: '40171501', unspscTitle: 'Industrial pipe and pipe fittings',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40170000', familyTitle: 'Pipe and tubing and accessories',
    classCode: '40171500', classTitle: 'Industrial pipe and fittings',
    commodityCode: '40171501', commodityTitle: 'Industrial pipe and pipe fittings',
    confidenceScore: 90, evidence: 'Industrial process piping, seamless pipe and ASME fittings'
  },

  // 10. Packaging strapping & polyester strap (Textile: ₹1.80 Cr)
  {
    pattern: /\b(?:pet strap|polyester strap|steel strap|strapping band|cord strap|packaging strip)\b/i,
    unspscCode: '24121512', unspscTitle: 'Packaging strapping and tape',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24120000', familyTitle: 'Packaging supplies',
    classCode: '24121500', classTitle: 'Packaging boxes and bags and pouches',
    commodityCode: '24121512', commodityTitle: 'Packaging strapping and tape',
    confidenceScore: 93, evidence: 'Bale and carton packaging strapping bands and PET straps'
  },

  // 11. Conveyor Belting & Belt systems (Cement: ₹1.80 Cr)
  {
    pattern: /\b(?:conveyor belt|conve\.belt|conveyor|rubber belt|v-belt|timing belt|transmission belt|belt feeder)\b/i,
    unspscCode: '24101720', unspscTitle: 'Conveyor belts and accessories',
    segmentCode: '24000000', segmentTitle: 'Material Handling and Conditioning Machinery and Accessories',
    familyCode: '24100000', familyTitle: 'Material handling machinery and equipment',
    classCode: '24101700', classTitle: 'Conveyors and accessories',
    commodityCode: '24101720', commodityTitle: 'Conveyor belts and accessories',
    confidenceScore: 92, evidence: 'Bulk material handling continuous conveyor belting'
  },

  // 12. Gears, Gearboxes & Girth Gears (Cement: ₹2.49 Cr)
  {
    pattern: /\b(?:girth gear|gear wheel|gearbox|pinion|spur gear|helical gear|bevel gear|reduction gear|gear)\b/i,
    unspscCode: '31171701', unspscTitle: 'Gears and gearboxes and girth gears',
    segmentCode: '31000000', segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    familyCode: '31170000', familyTitle: 'Bearings and bushings and wheels and gears',
    classCode: '31171700', classTitle: 'Gears',
    commodityCode: '31171701', commodityTitle: 'Gears and gearboxes and girth gears',
    confidenceScore: 93, evidence: 'Kiln and mill mechanical drive gears, girth gears and gear wheel assemblies'
  },

  // 13. Enhanced Refractory bricks and castables (Cement: ₹4.47 Cr)
  {
    pattern: /\b(?:magnesia spinel|basic brick|whytheat|fire brick|wedge brick|wedge bricks|refractory brick|refractory bricks|castable|accmon|dense castable|insulating brick|mortar)\b/i,
    unspscCode: '30161500', unspscTitle: 'Refractory materials and kiln bricks',
    segmentCode: '30000000', segmentTitle: 'Structures and Building and Construction and Manufacturing Components',
    familyCode: '30160000', familyTitle: 'Interior finishing materials',
    classCode: '30161500', classTitle: 'Refractory materials and kiln bricks',
    commodityCode: '30161500', commodityTitle: 'Refractory materials and kiln bricks',
    confidenceScore: 94, evidence: 'Cement rotary kiln and preheater refractory lining bricks and dense castables'
  },

  // 14. Enhanced Industrial Coolants, HTF, Specialty lubricants (Cement: ₹2.31 Cr)
  {
    pattern: /\b(?:heat xl|coolant|fe oil|mak htf|klueber|kluber|hydraulic oil|lubricant|grease|gear oil|engine oil|transformer oil|synthetic oil)\b/i,
    unspscCode: '15121500', unspscTitle: 'Lubricating preparations and industrial oils',
    segmentCode: '15000000', segmentTitle: 'Fuels and Lubricants and Related Products',
    familyCode: '15120000', familyTitle: 'Lubricants and oils and greases and anti corrosives',
    classCode: '15121500', classTitle: 'Lubricating preparations',
    commodityCode: '15121500', commodityTitle: 'Lubricating preparations and industrial oils',
    confidenceScore: 93, evidence: 'Compressor synthetic coolants, heat transfer fluids and industrial lubricants'
  },

  // 15. Mill / Kiln Castings and Wear Liners (Cement: ₹2.26 Cr)
  {
    pattern: /\b(?:grate plate|roller tyre|roller tyres|roller tire|central tube|wear plate|liner plate|mill liner|blow bar|hammer|diaphragm)\b/i,
    unspscCode: '23153100', unspscTitle: 'Grinding and crushing media balls and cylinders',
    segmentCode: '23000000', segmentTitle: 'Industrial Manufacturing and Processing Machinery and Accessories',
    familyCode: '23150000', familyTitle: 'Industrial process machinery',
    classCode: '23153100', classTitle: 'Grinding and crushing media balls and cylinders',
    commodityCode: '23153100', commodityTitle: 'Grinding and crushing media balls and cylinders',
    confidenceScore: 91, evidence: 'Cement clinker cooler grate plates, vertical mill tyres and kiln alloy castings'
  },

  // 16. Heavy duty mining & vehicle tyres (Cement: ₹0.58 Cr)
  {
    pattern: /\b(?:tyre|tire|tubeless tyre|radial tyre)\b/i,
    unspscCode: '25172500', unspscTitle: 'Tires and tubes',
    segmentCode: '25000000', segmentTitle: 'Commercial and Military and Private Vehicles and their Accessories and Components',
    familyCode: '25170000', familyTitle: 'Transportation components and systems',
    classCode: '25172500', classTitle: 'Tires and tubes',
    commodityCode: '25172500', commodityTitle: 'Tires and tubes',
    confidenceScore: 92, evidence: 'Heavy mining equipment dump truck and loader off-road tyres'
  },

  // 17. Fasteners & Hardware (Bolts, nuts, washers, studs, screws)
  {
    pattern: /\b(?:bolt|nut|washer|fastener|stud|hex bolt|anchor bolt|screw|rivet)\b/i,
    unspscCode: '31161500', unspscTitle: 'Fasteners and hardware',
    segmentCode: '31000000', segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    familyCode: '31160000', familyTitle: 'Hardware',
    classCode: '31161500', classTitle: 'Fasteners',
    commodityCode: '31161500', commodityTitle: 'Fasteners and hardware',
    confidenceScore: 90, evidence: 'Standard industrial threaded fasteners, bolts, nuts and washers'
  },

  // 18. Seals, Gaskets & Packings (O-rings, oil seals, mechanical seals, gland packing)
  {
    pattern: /\b(?:gasket|o-ring|oil seal|mechanical seal|seal kit|gland packing|teflon tape|ptfe sheet)\b/i,
    unspscCode: '31401500', unspscTitle: 'Seals and gaskets and packings',
    segmentCode: '31000000', segmentTitle: 'Manufacturing and Processing Machinery and Accessories',
    familyCode: '31400000', familyTitle: 'Gaskets and seals',
    classCode: '31401500', classTitle: 'Gaskets and seals',
    commodityCode: '31401500', commodityTitle: 'Seals and gaskets and packings',
    confidenceScore: 91, evidence: 'Fluid containment industrial gaskets, elastomeric O-rings and mechanical seals'
  },

  // 19. Filters & Filtration media (Air filter, oil filter, bag filter, filter cartridge, strainer)
  {
    pattern: /\b(?:filter element|air filter|oil filter|filter bag|filter cage|filter cartridge|strainer|filter cloth)\b/i,
    unspscCode: '40161500', unspscTitle: 'Industrial filtration equipment and media',
    segmentCode: '40000000', segmentTitle: 'Distribution and Conditioning Systems and Equipment and Components',
    familyCode: '40160000', familyTitle: 'Industrial filtering and purification',
    classCode: '40161500', classTitle: 'Filtering and purifying machinery and equipment',
    commodityCode: '40161500', commodityTitle: 'Industrial filtration equipment and media',
    confidenceScore: 90, evidence: 'Baghouse dust collection filter bags, fluid filter elements and strainers'
  },

  // 20. Instruments, Sensors & Gauges (Pressure gauge, transmitter, thermocouple, RTD, flow meter)
  {
    pattern: /\b(?:pressure gauge|temp\.gauge|thermocouple|rtd|transmitter|flow meter|transducer|sensor|level switch|limit switch)\b/i,
    unspscCode: '41111900', unspscTitle: 'Industrial measuring and observing instruments',
    segmentCode: '41000000', segmentTitle: 'Laboratory and Measuring and Observing and Testing Equipment',
    familyCode: '41110000', familyTitle: 'Measuring and observing and testing instruments',
    classCode: '41111900', classTitle: 'Pressure measuring instruments',
    commodityCode: '41111900', commodityTitle: 'Industrial measuring and observing instruments',
    confidenceScore: 90, evidence: 'Plant process automation sensors, gauges and temperature transmitters'
  },

  // 21. Safety PPE & Workwear (Safety shoes, helmet, goggles, hand gloves, safety harness)
  {
    pattern: /\b(?:safety shoe|safety helmet|goggle|hand glove|safety harness|ear plug|mask|apron|coverall)\b/i,
    unspscCode: '46181500', unspscTitle: 'Safety apparel and personal protective equipment (PPE)',
    segmentCode: '46000000', segmentTitle: 'Defense and Law Enforcement and Security and Safety Equipment and Supplies',
    familyCode: '46180000', familyTitle: 'Personal safety and protection',
    classCode: '46181500', classTitle: 'Safety apparel',
    commodityCode: '46181500', commodityTitle: 'Safety apparel and personal protective equipment (PPE)',
    confidenceScore: 91, evidence: 'Industrial workplace personal protective equipment and safety gear'
  }
];

function classifyWithRules(txs: any[], rules: any[]) {
  const map = new Map<string, any>();
  for (const t of txs) {
    const matId = (t.material_code ?? '').trim();
    const desc = (t.material_desc ?? matId).trim();
    const cat = (t.spend_category ?? 'General').trim();
    let agg = map.get(matId);
    if (!agg) {
      agg = {
        matId,
        desc,
        cat,
        spendInr: 0,
        txCount: 0,
        rawUnspscCode: t.unspsc_code?.trim(),
        rawCommodity: (t.unspsc_commodity ?? t.unspsc_category)?.trim()
      };
      map.set(matId, agg);
    }
    agg.spendInr += t.total_spend_inr ?? 0;
    agg.txCount += 1;
  }

  let appCount = 0;
  let appSpend = 0;
  let provCount = 0;
  let provSpend = 0;
  let revCount = 0;
  let revSpend = 0;

  const unresolved: any[] = [];

  for (const agg of map.values()) {
    if (agg.rawUnspscCode && agg.rawUnspscCode.length === 8 && agg.rawUnspscCode !== '00000000') {
      appCount++;
      appSpend += agg.spendInr;
      continue;
    }

    let matchedRule: any = null;
    for (const r of rules) {
      if (r.pattern.test(agg.desc)) {
        matchedRule = r;
        break;
      }
    }

    if (matchedRule) {
      if (matchedRule.confidenceScore >= 90) {
        appCount++;
        appSpend += agg.spendInr;
      } else {
        provCount++;
        provSpend += agg.spendInr;
      }
    } else {
      revCount++;
      revSpend += agg.spendInr;
      unresolved.push(agg);
    }
  }

  const totalCount = map.size;
  const totalSpend = appSpend + provSpend + revSpend;

  return {
    totalCount,
    totalSpendCr: totalSpend / 1e7,
    appCount,
    appSpendCr: appSpend / 1e7,
    appPct: (appCount / totalCount) * 100,
    appSpendPct: (appSpend / totalSpend) * 100,
    provCount,
    provSpendCr: provSpend / 1e7,
    provPct: (provCount / totalCount) * 100,
    provSpendPct: (provSpend / totalSpend) * 100,
    revCount,
    revSpendCr: revSpend / 1e7,
    revPct: (revCount / totalCount) * 100,
    revSpendPct: (revSpend / totalSpend) * 100,
    unresolved: unresolved.sort((a, b) => b.spendInr - a.spendInr)
  };
}

async function run() {
  for (const id of ['AIC-2026-0002', 'AIC-2026-0003']) {
    const canonical = await Module2CanonicalService.getCanonicalInput(id);
    const before = classifyWithRules(canonical.transactions, OFFICIAL_UNSPSC_TAXONOMY_RULES);
    const after = classifyWithRules(canonical.transactions, PROPOSED_ENHANCED_RULES_V2);

    console.log(`\n=================== ${id} CLASSIFICATION SIMULATION V2 ===================`);
    console.log(`BEFORE:`);
    console.log(`  Approved: ${before.appCount} (${before.appPct.toFixed(1)}%), Spend: ₹${before.appSpendCr.toFixed(4)} Cr (${before.appSpendPct.toFixed(1)}%)`);
    console.log(`  Provisional: ${before.provCount} (${before.provPct.toFixed(1)}%), Spend: ₹${before.provSpendCr.toFixed(4)} Cr (${before.provSpendPct.toFixed(1)}%)`);
    console.log(`  Awaiting Review: ${before.revCount} (${before.revPct.toFixed(1)}%), Spend: ₹${before.revSpendCr.toFixed(4)} Cr (${before.revSpendPct.toFixed(1)}%)`);

    console.log(`\nAFTER:`);
    console.log(`  Approved: ${after.appCount} (${after.appPct.toFixed(1)}%), Spend: ₹${after.appSpendCr.toFixed(4)} Cr (${after.appSpendPct.toFixed(1)}%)`);
    console.log(`  Provisional: ${after.provCount} (${after.provPct.toFixed(1)}%), Spend: ₹${after.provSpendCr.toFixed(4)} Cr (${after.provSpendPct.toFixed(1)}%)`);
    console.log(`  Awaiting Review: ${after.revCount} (${after.revPct.toFixed(1)}%), Spend: ₹${after.revSpendCr.toFixed(4)} Cr (${after.revSpendPct.toFixed(1)}%)`);

    console.log(`\nTop 5 Remaining Unresolved Materials After:`);
    for (const u of after.unresolved.slice(0, 5)) {
      console.log(`  Mat: "${u.matId}" | Desc: "${u.desc}" | Cat: "${u.cat}" | Spend: ₹${(u.spendInr / 1e7).toFixed(4)} Cr | Reason: Technical engineering description lacks standard taxonomy keywords`);
    }
  }
}

run().catch(console.error);
