const fs = require('fs');
const path = require('path');

const pdfPath = path.resolve(__dirname, '../aiCEV_UltraTech_Executive_Opportunity_Brief.pdf');
const pptxPath = path.resolve(__dirname, '../aiCEV_UltraTech_Executive_Opportunity_Brief.pptx');

console.log('=== INSPECTION OF 10-SLIDE EXECUTIVE OPPORTUNITY BRIEF ===');
console.log('PDF exists:', fs.existsSync(pdfPath), 'Size:', fs.statSync(pdfPath).size, 'bytes');
console.log('PPTX exists:', fs.existsSync(pptxPath), 'Size:', fs.statSync(pptxPath).size, 'bytes');

const pdfBuf = fs.readFileSync(pdfPath);
const pdfStr = pdfBuf.toString('utf-8');

// 1. Page count
const pages = (pdfStr.match(/\/Type\s*\/Page\b/g) || []).length;
console.log('Page Count:', pages, pages === 10 ? 'PASS' : 'FAIL');

// 2. Mojibake check
const mojibakePatterns = ['â†', 'âˆ', 'â€“', 'â€”', 'â€¢', 'Â', 'Ã', 'ï¿½'];
let mojibakeFound = [];
for (const p of mojibakePatterns) {
  if (pdfStr.includes(p)) {
    mojibakeFound.push(p);
  }
}
console.log('Mojibake Check:', mojibakeFound.length === 0 ? 'PASS (Zero mojibake)' : 'FAIL: ' + mojibakeFound.join(', '));

// 3. Logo asset (/Im1 Do) calls
const logoCalls = (pdfStr.match(/\/Im1\s+Do/g) || []).length;
console.log('Official Logo Asset Draws (/Im1 Do):', logoCalls, logoCalls === 10 ? 'PASS (1 per slide)' : 'FAIL');

// 4. Financial constants check
const expectedMetrics = [
  { label: 'Direct Savings', pattern: '78.72' },
  { label: 'Net Pipeline', pattern: '93.60' },
  { label: 'Strategic Value', pattern: '14.88' },
  { label: 'Total Spend', pattern: '5,920.35' },
  { label: 'Gross Opportunity', pattern: '173.12' },
  { label: 'Overlap Deductions', pattern: '62.80' },
  { label: 'Policy Exclusions', pattern: '16.72' },
  { label: 'Wave 1 Target', pattern: '47.90' },
  { label: '824 POs Unmonetized', pattern: '824' },
  { label: 'Spend De-risked', pattern: '420' }
];

expectedMetrics.forEach(m => {
  const found = pdfStr.includes(m.pattern);
  console.log(`Financial Metric [${m.label} -> ${m.pattern}]:`, found ? 'PASS' : 'FAIL');
});

// 5. Cross-references check
const expectedCrossRefs = [
  'Detailed evidence: Boardroom & Evidence Edition - Slides 7-10',
  'Detailed sourcing evidence: Boardroom & Evidence Edition - Slides 9, 14-19',
  'Full financial reconciliation: Boardroom & Evidence Edition - Slide 10',
  'Full methodology and audit trail: Boardroom & Evidence Edition - Slides 7 & 30',
  'Detailed initiative ledger: Boardroom & Evidence Edition - Slide 24',
  'Detailed roadmap: Boardroom & Evidence Edition - Slides 24-25'
];

expectedCrossRefs.forEach((ref, idx) => {
  const found = pdfStr.includes(ref);
  console.log(`Cross-Reference ${idx + 1} [${ref}]:`, found ? 'PASS' : 'FAIL');
});

// 6. Footer check
const footerMatch = pdfStr.includes('Management Confidential | CFO / CEO Discussion Edition') &&
                    pdfStr.includes('PAGE 10 OF 10');
console.log('10-Slide Footer Differentiation:', footerMatch ? 'PASS' : 'FAIL');

// 7. Master deck 30-slide check
const masterPdfPath = path.resolve(__dirname, '../EXECUTIVE_BRIEF.pdf');
const masterPdfStr = fs.readFileSync(masterPdfPath).toString('utf-8');
const masterPages = (masterPdfStr.match(/\/Type\s*\/Page\b/g) || []).length;
console.log('Master 30-Slide Deck Count:', masterPages, masterPages === 30 ? 'PASS (Unchanged)' : 'FAIL');
