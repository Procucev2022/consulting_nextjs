import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';
import { OFFICIAL_UNSPSC_TAXONOMY_RULES } from '../src/constants/module2MaterialMappingTaxonomy';

const allCommodityCodes = new Set(unspscOfficialDictionary.map(r => r.commodityCode));
const allClasses = new Map<string, string>();
const allFamilies = new Map<string, string>();
const allSegments = new Map<string, string>();

for (const r of unspscOfficialDictionary) {
  allClasses.set(r.classCode, r.classTitle);
  allFamilies.set(r.familyCode, r.familyTitle);
  allSegments.set(r.segmentCode, r.segmentTitle);
}

console.log(`Unique Commodities: ${allCommodityCodes.size}`);
console.log(`Unique Classes: ${allClasses.size}`);
console.log(`Unique Families: ${allFamilies.size}`);
console.log(`Unique Segments: ${allSegments.size}`);

console.log('\n--- Checking OFFICIAL_UNSPSC_TAXONOMY_RULES against taxonomy ---');
for (const rule of OFFICIAL_UNSPSC_TAXONOMY_RULES) {
  const code = rule.unspscCode;
  const isCommodity = allCommodityCodes.has(code);
  const isClass = allClasses.has(code);
  const isFamily = allFamilies.has(code);
  const isSegment = allSegments.has(code);
  const exists = isCommodity || isClass || isFamily || isSegment;
  const level = isCommodity ? 'Commodity' : isClass ? 'Class' : isFamily ? 'Family' : isSegment ? 'Segment' : 'NOT FOUND';
  console.log(`Code: ${code} | Title: "${rule.unspscTitle}" | Level in loaded taxonomy: ${level} | Exists: ${exists}`);
}
