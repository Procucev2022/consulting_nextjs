import * as fs from 'fs';

// Helper to format rules cleanly under 120 characters per line
export function formatRule(r: {
  patternStr: string;
  code: string;
  title: string;
  segCode: string;
  segTitle: string;
  famCode: string;
  famTitle: string;
  clsCode: string;
  clsTitle: string;
  commCode: string;
  commTitle: string;
  score: number;
  evidence: string;
}): string {
  return [
    `  {`,
    `    pattern: ${r.patternStr},`,
    `    unspscCode: '${r.code}', unspscTitle: '${r.title}',`,
    `    segmentCode: '${r.segCode}', segmentTitle: '${r.segTitle}',`,
    `    familyCode: '${r.famCode}', familyTitle: '${r.famTitle}',`,
    `    classCode: '${r.clsCode}', classTitle: '${r.clsTitle}',`,
    `    commodityCode: '${r.commCode}', commodityTitle: '${r.commTitle}',`,
    `    confidenceScore: ${r.score}, evidence: '${r.evidence}'`,
    `  }`
  ].join('\n');
}
