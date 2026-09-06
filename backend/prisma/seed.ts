import { PrismaClient } from '@prisma/client';
import {
  mockTenant,
  initialIngestionQueue,
  initialValidationRecords,
  spendCategoriesData,
  categoryYearWiseDetails,
  vendorYearWiseDetails,
  vendorVolatilityRankings,
  initialLineItemMappings,
  initialSavingsOpportunities,
  conversionFunnelStages
} from '../src/data/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PostgreSQL database seed...');

  // 1. Tenant
  console.log('Seeding Tenant...');
  await prisma.tenantMaster.upsert({
    where: { tenant_id: mockTenant.tenant_id },
    update: { ...mockTenant },
    create: { ...mockTenant }
  });

  // 2. Ingestion Queue
  console.log('Seeding Ingestion Queue...');
  for (const item of initialIngestionQueue) {
    await prisma.rawDocumentIngestion.upsert({
      where: { doc_id: item.doc_id },
      update: {
        ...item,
        uploaded_at: new Date(item.uploaded_at)
      },
      create: {
        ...item,
        uploaded_at: new Date(item.uploaded_at)
      }
    });
  }

  // 3. Validation Records
  console.log('Seeding Validation Records...');
  for (const r of initialValidationRecords) {
    await prisma.validationPreCheckRecord.upsert({
      where: { record_id: r.record_id },
      update: { ...r },
      create: { ...r }
    });
  }

  // 4. Spend Categories Summary
  console.log('Seeding Spend Category Summaries...');
  for (const c of spendCategoriesData) {
    await prisma.spendCategorySummary.upsert({
      where: { id: c.id },
      update: { ...c },
      create: { ...c }
    });
  }

  // 5. Category Year Details
  console.log('Seeding Category Year Details...');
  for (const c of categoryYearWiseDetails) {
    const id = c.id || c.category.toLowerCase().replace(/\s+/g, '-');
    await prisma.categoryYearDetail.upsert({
      where: { id },
      update: {
        ...c,
        id,
        balance_items: c.balance_items ? (c.balance_items as any) : undefined,
        top_items: c.top_items ? (c.top_items as any) : undefined
      },
      create: {
        ...c,
        id,
        balance_items: c.balance_items ? (c.balance_items as any) : undefined,
        top_items: c.top_items ? (c.top_items as any) : undefined
      }
    });
  }

  // 6. Vendor Year Details
  console.log('Seeding Vendor Year Details...');
  for (const v of vendorYearWiseDetails) {
    await prisma.vendorYearDetail.upsert({
      where: { id: v.id },
      update: {
        ...v,
        balance_vendors: v.balance_vendors ? (v.balance_vendors as any) : undefined,
        top_items: v.top_items ? (v.top_items as any) : undefined
      },
      create: {
        ...v,
        balance_vendors: v.balance_vendors ? (v.balance_vendors as any) : undefined,
        top_items: v.top_items ? (v.top_items as any) : undefined
      }
    });
  }

  // 7. Vendor Volatility Rankings
  console.log('Seeding Vendor Price Rankings...');
  for (const [idx, v] of vendorVolatilityRankings.entries()) {
    const rank = (v as any).rank || idx + 1;
    await prisma.vendorPriceRank.upsert({
      where: { rank },
      update: {
        vendor_name: v.vendor_name,
        category: v.category,
        total_spend_inr_cr: v.total_spend_inr_cr || 0,
        price_creep_pct: v.price_creep_pct,
        variance_leakage_inr_cr: v.variance_leakage_inr_cr || 0,
        risk_status: v.risk_status
      },
      create: {
        rank,
        vendor_name: v.vendor_name,
        category: v.category,
        total_spend_inr_cr: v.total_spend_inr_cr || 0,
        price_creep_pct: v.price_creep_pct,
        variance_leakage_inr_cr: v.variance_leakage_inr_cr || 0,
        risk_status: v.risk_status
      }
    });
  }

  // 8. Line Item Mappings
  console.log('Seeding Line Item Mappings...');
  for (const l of initialLineItemMappings) {
    await prisma.lineItemMapping.upsert({
      where: { mapping_id: l.mapping_id },
      update: { ...l },
      create: { ...l }
    });
  }

  // 9. Savings Opportunities
  console.log('Seeding Savings Opportunities...');
  for (const o of initialSavingsOpportunities) {
    await prisma.savingsOpportunity.upsert({
      where: { opp_id: o.opp_id },
      update: { ...o },
      create: { ...o }
    });
  }

  // 10. Funnel Stages
  console.log('Seeding Conversion Funnel Phases...');
  for (const f of conversionFunnelStages) {
    const stage = (f as any).stage || `Phase ${f.phase_num}`;
    await prisma.conversionFunnelPhase.upsert({
      where: { stage },
      update: {
        title: f.phase_name,
        spend_reach_inr_cr: 100,
        conversion_rate: f.completion_pct,
        status: f.status,
        action_item: f.platform_actionable_focus
      },
      create: {
        stage,
        title: f.phase_name,
        spend_reach_inr_cr: 100,
        conversion_rate: f.completion_pct,
        status: f.status,
        action_item: f.platform_actionable_focus
      }
    });
  }

  console.log('✅ PostgreSQL database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
