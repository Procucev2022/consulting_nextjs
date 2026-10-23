import fs from 'fs';
import path from 'path';
import { executiveBriefExportService } from '../src/services/executiveBriefExportService';
import { ExecutiveOpportunityBriefExportService } from '../src/services/executiveOpportunityBriefExportService';

async function main() {
  console.log('=== GENERATING FRESH PDF & PPTX EXPORTS FOR ABC TEXTILE LTD ===');
  
  // 1. 30-slide Executive Brief
  const execResult = await executiveBriefExportService.generateDualFormatExport('ABC Textile Ltd');
  console.log('30-slide Executive Brief Status:', execResult.audit.exportStatus);
  console.log(' - PDF path:', execResult.pdfPath, `(${execResult.pdfBuffer.length} bytes)`);
  console.log(' - PPTX path:', execResult.pptxPath, `(${execResult.pptxBuffer.length} bytes)`);
  console.log(' - Page count:', execResult.audit.pageCount, 'Slide count:', execResult.audit.slideCount);

  // 2. 10-slide Management Brief
  const oppResult = await ExecutiveOpportunityBriefExportService.generateOpportunityBrief('ABC Textile Ltd');
  console.log('10-slide Management Brief:');
  console.log(' - PDF path:', oppResult.pdfPath, `(${oppResult.pdfBuffer.length} bytes)`);
  console.log(' - PPTX path:', oppResult.pptxPath, `(${oppResult.pptxBuffer.length} bytes)`);
  console.log(' - PDF filename:', oppResult.pdfFilename);

  // 3. Inspect text content of PDF buffers for forbidden/contamination terms
  const execPdfText = execResult.pdfBuffer.toString('binary');
  const oppPdfText = oppResult.pdfBuffer.toString('binary');

  function checkContamination(name: string, text: string) {
    const issues: string[] = [];
    if (text.includes('UltraTech') || text.includes('ultratech')) {
      issues.push('Found "UltraTech" in output');
    }
    if (text.includes('VGT') || text.includes('vgt')) {
      issues.push('Found "VGT" in output');
    }
    if (text.includes('5920.35') || text.includes('5,920.35')) {
      issues.push('Found demonstration spend ₹5,920.35 Cr in output');
    }
    if (text.includes('173.12') || text.includes('173.1')) {
      issues.push('Found demonstration gross opp ₹173.12 Cr in output');
    }
    if (text.includes('93.60') || text.includes('93.6')) {
      issues.push('Found demonstration net opp ₹93.60 Cr in output');
    }
    if (text.includes('47.90') || text.includes('47.9')) {
      issues.push('Found demonstration validated savings ₹47.90 Cr in output');
    }
    if (text.includes('68.00') || text.includes('68.0')) {
      issues.push('Found demonstration realized savings ₹68.00 Cr in output');
    }
    console.log(`Contamination check for ${name}:`, issues.length === 0 ? 'CLEAN (0 issues)' : issues);
  }

  checkContamination('30-slide Executive Brief PDF', execPdfText);
  checkContamination('10-slide Management Brief PDF', oppPdfText);

  // 4. Verify customer-specific KPIs in both PDFs
  function checkRequiredKpis(name: string, text: string) {
    const checks = [
      { kpi: 'Evaluated Spend (613.8805)', found: text.includes('613.8805') },
      { kpi: 'Net Modelled Opportunity (85.641)', found: text.includes('85.641') },
      { kpi: 'Proven Opportunity (82.380 or 82.38)', found: text.includes('82.380') || text.includes('82.38') },
      { kpi: 'Realized Savings (0.00 or 0 Cr)', found: text.includes('0.00') || text.includes('Rs. 0') },
      { kpi: 'PCBI UNAVAILABLE', found: text.includes('UNAVAILABLE') }
    ];
    console.log(`KPI verification for ${name}:`);
    checks.forEach(c => console.log(` - ${c.kpi}: ${c.found ? 'FOUND' : 'MISSING'}`));
  }

  checkRequiredKpis('30-slide Executive Brief PDF', execPdfText);
  checkRequiredKpis('10-slide Management Brief PDF', oppPdfText);
}

main().catch(console.error);
