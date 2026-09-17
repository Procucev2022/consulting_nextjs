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

  // 1. Tenant (Zero State Baseline)
  console.log('Seeding Tenant with clean zero-state baseline...');
  await prisma.tenantMaster.upsert({
    where: { tenant_id: 'TNT-GLOBAL-8902' },
    update: {
      tenant_id: 'TNT-GLOBAL-8902',
      enterprise_name: 'Enterprise Client',
      region: 'GLOBAL',
      base_currency: 'INR',
      status: 'ACTIVE',
      total_spend_evaluated: 0,
      total_spend_evaluated_inr: 0,
      major_sector: 'Direct & Indirect Procurement',
      minor_sector: 'Strategic Sourcing'
    },
    create: {
      tenant_id: 'TNT-GLOBAL-8902',
      enterprise_name: 'Enterprise Client',
      region: 'GLOBAL',
      base_currency: 'INR',
      status: 'ACTIVE',
      total_spend_evaluated: 0,
      total_spend_evaluated_inr: 0,
      major_sector: 'Direct & Indirect Procurement',
      minor_sector: 'Strategic Sourcing'
    }
  });

  // 2. Clean any stale dummy rows in other procurement tables
  console.log('Ensuring clean zero state for procurement datasets...');
  await prisma.rawDocumentIngestion.deleteMany({}).catch(() => {});
  await prisma.validationPreCheckRecord.deleteMany({}).catch(() => {});
  await prisma.spendCategorySummary.deleteMany({}).catch(() => {});
  await prisma.categoryYearDetail.deleteMany({}).catch(() => {});
  await prisma.vendorYearDetail.deleteMany({}).catch(() => {});
  await prisma.vendorPriceRank.deleteMany({}).catch(() => {});
  await prisma.lineItemMapping.deleteMany({}).catch(() => {});
  await prisma.savingsOpportunity.deleteMany({}).catch(() => {});
  await prisma.conversionFunnelPhase.deleteMany({}).catch(() => {});

  // 3. Seed Users (Admin & Enterprise Users)
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
      name: 'Enterprise Buyer',
      mobile_number: '+91 98450 12345',
      email: 'buyer@procucev.com',
      company_name: 'Enterprise Client Ltd.',
      company_address: 'Plot 45, Industrial Suburb, Peenya 2nd Stage, Bengaluru 560058, Karnataka, India',
      password_hash: hashPw('User@123456', 'b2c3d4e5f60718293a4b5c6d7e8f90a1'),
      role: 'USER',
      status: 'ACTIVE'
    },
    {
      id: 'usr-user-002',
      name: 'Srinivas Mukku',
      mobile_number: '+91 98450 12346',
      email: 'user@procucev.com',
      company_name: 'Apex Industrial Dynamics Ltd.',
      company_address: 'Plot 45, Industrial Suburb, Peenya 2nd Stage, Bengaluru 560058, Karnataka, India',
      password_hash: hashPw('User@123456', 'b2c3d4e5f60718293a4b5c6d7e8f90a1'),
      role: 'USER',
      status: 'ACTIVE'
    },
    {
      id: 'usr-user-003',
      name: 'Priya Sharma',
      mobile_number: '+91 97123 45678',
      email: 'priya.sharma@tatasupply.com',
      company_name: 'Tata Strategic Procurement Corp',
      company_address: 'Bombay House, 24 Homi Mody Street, Fort, Mumbai 400001, Maharashtra, India',
      password_hash: hashPw('User@123456', 'c3d4e5f60718293a4b5c6d7e8f90a1b2'),
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
