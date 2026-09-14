import crypto from 'crypto';
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
    const raw_line_text = (l as any).raw_line_text || (l as any).raw_desc || l.material_desc;
    const mapped_unspsc_code = (l as any).mapped_unspsc_code || (l as any).unspsc_code || '14121506';
    const unspsc_title = (l as any).unspsc_title || (l as any).unspsc_commodity_title || (l as any).unspsc_category_name || 'Packaging';
    const confidence_score = (l as any).confidence_score || (l as any).ai_confidence || 95;
    const suggested_bucket = (l as any).suggested_bucket || (l as any).core_bucket || 'Direct Materials';
    const payload = {
      mapping_id: l.mapping_id,
      raw_line_text,
      mapped_unspsc_code,
      unspsc_title,
      confidence_score,
      suggested_bucket,
      human_verified: (l as any).human_verified ?? false,
      vendor_identified: l.vendor_identified || 'Vendor',
      master_supplier_id: l.master_supplier_id || null
    };
    await prisma.lineItemMapping.upsert({
      where: { mapping_id: l.mapping_id },
      update: payload,
      create: payload
    });
  }

  // 9. Savings Opportunities
  console.log('Seeding Savings Opportunities...');
  for (const o of initialSavingsOpportunities) {
    const payload = {
      opp_id: o.opp_id,
      category: o.category,
      current_spend_inr_cr: o.current_spend_inr_cr,
      target_savings_pct: o.target_savings_pct,
      est_savings_inr_cr: o.est_savings_inr_cr,
      benchmark_source: (o as any).benchmark_source || (o as any).recommended_action || 'Global Market Index',
      risk_level: o.risk_level,
      status: o.status
    };
    await prisma.savingsOpportunity.upsert({
      where: { opp_id: o.opp_id },
      update: payload,
      create: payload
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

  // 11. Seed Users (Admin & Enterprise Users)
  console.log('Seeding Users (Admin & Enterprise Users)...');
  const hashPw = (pw: string, salt: string) => {
    const h = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${h}`;
  };

  const seedUsers = [
    {
      id: 'usr-admin-001',
      name: 'System Administrator',
      mobile_number: '+91 98765 43210',
      email: 'admin@procucev.com',
      company_name: 'aiCEV Procucev Enterprise Inc.',
      company_address: 'Floor 14, Brigade Gateway, Malleshwaram, Bengaluru, Karnataka 560055, India',
      password_hash: hashPw('Admin@123456', 'a1b2c3d4e5f60718293a4b5c6d7e8f90'),
      role: 'ADMIN',
      status: 'ACTIVE'
    },
    {
      id: 'usr-user-001',
      name: 'Srinivas Mukku',
      mobile_number: '+91 98450 12345',
      email: 'srinivas@apexindustrial.com',
      company_name: 'Apex Industrial Dynamics Ltd.',
      company_address: 'Plot 45, Industrial Suburb, Peenya 2nd Stage, Bengaluru 560058, Karnataka, India',
      password_hash: hashPw('User@123456', 'b2c3d4e5f60718293a4b5c6d7e8f90a1'),
      role: 'USER',
      status: 'ACTIVE'
    },
    {
      id: 'usr-user-002',
      name: 'Priya Sharma',
      mobile_number: '+91 97123 45678',
      email: 'priya.sharma@tatasupply.com',
      company_name: 'Tata Strategic Procurement Corp',
      company_address: 'Bombay House, 24 Homi Mody Street, Fort, Mumbai 400001, Maharashtra, India',
      password_hash: hashPw('User@123456', 'c3d4e5f60718293a4b5c6d7e8f90a1b2'),
      role: 'USER',
      status: 'ACTIVE'
    },
    {
      id: 'usr-user-003',
      name: 'Rajesh Verma',
      mobile_number: '+91 98234 56789',
      email: 'rajesh.verma@reliancesupply.com',
      company_name: 'Reliance Global Logistics & Procurement',
      company_address: 'Maker Chambers IV, Nariman Point, Mumbai 400021, Maharashtra, India',
      password_hash: hashPw('User@123456', 'd4e5f60718293a4b5c6d7e8f90a1b2c3'),
      role: 'USER',
      status: 'ACTIVE'
    }
  ];

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        mobile_number: u.mobile_number,
        company_name: u.company_name,
        company_address: u.company_address,
        password_hash: u.password_hash,
        role: u.role,
        status: u.status
      },
      create: u
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
