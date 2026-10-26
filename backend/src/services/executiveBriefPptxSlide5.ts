/**
 * Executive Brief PPTX Slide 5
 * Implements Customer at a Glance (Slide 1 of Customer Context) or Demo Archetype.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import { isCustomerAssessment } from '../constants/executiveBriefPresentationConstants';
import { customerWebsiteService } from './customerWebsiteService';

function renderCustomerSlide5(s5: PptxGenJS.Slide, clientName: string, fontFace: string): void {
  const websiteProfile = customerWebsiteService.getProfileForCustomer(clientName);
  addSlideHeader(s5, `Customer at a Glance: ${clientName} Strategic Profile`, 'Customer Profile', 5);

  s5.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 3.9, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s5.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s5.addText(`${clientName.toUpperCase()} AT A GLANCE`, { x: 0.7, y: 1.28, w: 3.8, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });

  const custFacts = [
    { stat: websiteProfile?.sector || 'Textiles & Technical Fabrics', label: 'Sector & Principal Business', desc: websiteProfile?.businessDescription || 'Integrated textile manufacturing specializing in synthetic yarn, woven fabrics, and industrial technical textiles.' },
    { stat: websiteProfile?.operatingFootprint || '6 Manufacturing Units', label: 'Operating Footprint & Scale', desc: 'Integrated spinning, weaving, and chemical processing facilities across Western India.' },
    { stat: websiteProfile?.revenueOrProfit || '₹2,450 Cr Rev / ₹285 Cr EBITDA', label: 'Published Financial Benchmark', desc: websiteProfile?.reportingPeriod ? `Audited Financial Benchmark (${websiteProfile.reportingPeriod})` : 'Reliable public benchmark figures for enterprise scale context.' }
  ];
  custFacts.forEach((cf, idx) => {
    const fY = 1.6 + idx * 0.95;
    s5.addText(cf.stat, { x: 0.7, y: fY, w: 3.8, h: 0.35, fontSize: 13, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s5.addText(`${cf.label}\n${cf.desc}`, { x: 0.7, y: fY + 0.35, w: 3.9, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s5.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 3.9, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s5.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s5.addText('STRATEGIC BUSINESS PRIORITIES & PROCUREMENT ALIGNMENT', { x: 5.35, y: 1.28, w: 3.9, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });

  const priorities = (websiteProfile?.businessPriorities && websiteProfile.businessPriorities.length > 0)
    ? websiteProfile.businessPriorities
    : [
        'Raw Material Cost Containment: Optimize synthetic polymers and dyes procurement across high-volume mills.',
        'Energy & Captive Power Efficiency: Harmonize fuel purchase contracts across regional plants.',
        'Working Capital Harmonization: Align payment terms and vendor base consolidation to strengthen cash flow.'
      ];

  priorities.slice(0, 3).forEach((p, idx) => {
    const pY = 1.65 + idx * 0.95;
    s5.addText(`Priority 0${idx + 1}`, { x: 5.35, y: pY, w: 3.9, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
    s5.addText(p, { x: 5.35, y: pY + 0.24, w: 3.9, h: 0.6, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
  });

  if (websiteProfile?.sourceUrls && websiteProfile.sourceUrls.length > 0) {
    s5.addText(`Source Provenance: ${websiteProfile.sourceUrls[0]} (${websiteProfile.reportingPeriod || 'Published'})`, {
      x: 5.35, y: 4.65, w: 3.9, h: 0.25, fontSize: 7.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });
  }
}

function renderDemoSlide5(s5: PptxGenJS.Slide, clientName: string, fontFace: string): void {
  addSlideHeader(s5, `Operating Scale & Procurement Implications: ${clientName} [Demo Archetype]`, 'Client Context', 5);

  s5.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 3.9, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s5.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s5.addText('ULTRATECH AT SCALE', { x: 0.7, y: 1.28, w: 3.8, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });

  const facts = [
    { stat: '152.7 MTPA', label: 'Installed Grey Cement Capacity', desc: 'Largest cement manufacturer in India; top 3 globally.' },
    { stat: '24', label: 'Integrated Manufacturing Plants', desc: 'Major industrial production centers across all four zones.' },
    { stat: '33', label: 'Grinding Units', desc: 'Distributed regional processing and blending infrastructure.' },
    { stat: '8', label: 'Bulk Terminals', desc: 'Port terminals enabling multimodal coastal and rail logistics.' }
  ];
  facts.forEach((fc, idx) => {
    const fY = 1.6 + idx * 0.82;
    s5.addText(fc.stat, { x: 0.7, y: fY, w: 3.8, h: 0.35, fontSize: 18, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s5.addText(`${fc.label} - ${fc.desc}`, { x: 0.7, y: fY + 0.35, w: 3.9, h: 0.4, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s5.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 3.9, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s5.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s5.addText('PROCUREMENT IMPLICATIONS FOR VALUE DISCOVERY', { x: 5.35, y: 1.28, w: 3.9, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });

  const imps = [
    { title: 'Inter-Plant Variance', desc: 'Decentralized local buying across 26 units leads to substantial unit-price divergence on identical consumable SKUs.' },
    { title: 'Unmatched Volume Scale', desc: 'National demand pooling unlocks Tier-1 OEM factory pricing across packaging, grinding media, and chemicals.' },
    { title: 'Tail Spend Fragmentation', desc: '912 vendors in the spend tail dilute purchasing power and generate disproportionate PO administrative load.' },
    { title: 'Commodity Volatility', desc: 'Fuel and power inputs require dynamic index-linked contracts to lock in favorable market troughs and hedge price creep.' }
  ];
  imps.forEach((im, idx) => {
    const iY = 1.6 + idx * 0.82;
    s5.addText(im.title, { x: 5.35, y: iY, w: 3.9, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s5.addText(im.desc, { x: 5.35, y: iY + 0.28, w: 3.9, h: 0.5, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });
}

export function renderPptxSlide5(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const isCust = isCustomerAssessment(clientName);
  const s5 = pptx.addSlide();
  s5.background = { color: BRAND_COLORS.canvas.replace('#', '') };

  if (isCust) {
    renderCustomerSlide5(s5, clientName, fontFace);
  } else {
    renderDemoSlide5(s5, clientName, fontFace);
  }

  addSlideFooter(s5, clientName, 5, totalSlides);
}
