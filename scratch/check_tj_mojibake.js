const fs = require('fs');
const path = require('path');

const pdfPath = path.resolve(__dirname, '../aiCEV_UltraTech_Executive_Opportunity_Brief.pdf');
const pdfBuf = fs.readFileSync(pdfPath);
const pdfStr = pdfBuf.toString('binary');

// Extract all text inside ( ... ) Tj
const tjMatches = pdfStr.match(/\((.*?)\)\s*Tj/g) || [];
console.log('Total text Tj operators found:', tjMatches.length);

let textWithMojibake = [];
for (const tj of tjMatches) {
  if (tj.includes('Â') || tj.includes('Ã') || tj.includes('â†') || tj.includes('âˆ') || tj.includes('â€“') || tj.includes('â€¢')) {
    textWithMojibake.push(tj);
  }
}

if (textWithMojibake.length === 0) {
  console.log('ALL DISPLAYED TEXT IN TJ OPERATORS IS 100% CLEAN OF MOJIBAKE!');
} else {
  console.log('Found mojibake in Tj:', textWithMojibake);
}
