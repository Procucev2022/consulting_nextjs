import * as fs from 'fs';
import * as path from 'path';

const bucketMapping: Record<string, string> = {
  '15101505': 'Indirect & MRO',
  '15101601': 'Direct Materials',
  '15101612': 'Indirect & MRO',
  '15121500': 'Indirect & MRO',
  '14111601': 'Packaging Materials',
  '24121502': 'Packaging Materials',
  '24121500': 'Packaging Materials',
  '24111515': 'Packaging Materials',
  '24101904': 'Packaging Materials',
  '24141514': 'Indirect & MRO',
  '24121512': 'Packaging Materials',
  '24101720': 'Indirect & MRO',
  '23131506': 'Indirect & MRO',
  '23153100': 'Direct Materials',
  '25172500': 'Indirect & MRO',
  '12131700': 'Direct Materials',
  '30161500': 'Indirect & MRO',
  '30101704': 'Indirect & MRO',
  '31171500': 'Indirect & MRO',
  '31171701': 'Indirect & MRO',
  '31161500': 'Indirect & MRO',
  '31401500': 'Indirect & MRO',
  '40101827': 'Indirect & MRO',
  '40101701': 'Indirect & MRO',
  '40141600': 'Indirect & MRO',
  '40151500': 'Indirect & MRO',
  '40161500': 'Indirect & MRO',
  '40171501': 'Indirect & MRO',
  '41111900': 'Indirect & MRO',
  '26121600': 'Indirect & MRO',
  '26101100': 'Indirect & MRO',
  '46181500': 'Indirect & MRO',
  '72102900': 'Indirect & MRO',
  '72151500': 'Indirect & MRO',
  '78101800': 'Logistics & Freight',
  '80111600': 'Indirect & MRO'
};

function fixTaxonomyTs(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  for (const [code, validBucket] of Object.entries(bucketMapping)) {
    // Find block for this commodityCode and replace coreBucket
    const regex = new RegExp(`("commodityCode":\\s*"${code}"[\\s\\S]*?"coreBucket":\\s*")[^"]+(")`, 'g');
    content = content.replace(regex, `$1${validBucket}$2`);
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed coreBuckets in ${filePath}`);
}

function fixDictionaryJson(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const arr = JSON.parse(raw);
  for (const item of arr) {
    if (bucketMapping[item.commodityCode]) {
      item.coreBucket = bucketMapping[item.commodityCode];
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf-8');
  console.log(`Fixed coreBuckets in ${filePath}`);
}

const root = path.resolve(__dirname, '..');
fixTaxonomyTs(path.join(root, 'src', 'data', 'unspscTaxonomy.ts'));
fixTaxonomyTs(path.resolve(root, '..', 'frontend', 'src', 'data', 'unspscTaxonomy.ts'));
fixDictionaryJson(path.join(root, 'src', 'data', 'unspscDictionary.json'));
fixDictionaryJson(path.resolve(root, '..', 'frontend', 'src', 'data', 'unspscDictionary.json'));
console.log('Finished updating CoreBuckets.');
