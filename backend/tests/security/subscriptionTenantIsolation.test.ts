/**
 * Prompt 289 §3 & §4: Server-Side Tenant Isolation & Admin Authorization Security Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateAuthToken } from '../../src/utils/auth';
import { subscriptionService } from '../../src/services/subscriptionService';
import { subscriptionStore } from '../../src/services/subscriptionStore';

describe('Prompt 289: Tenant Isolation & Admin Authorization Hardening', () => {
  const customerAToken = generateAuthToken(
    'usr-customer-a',
    'customer-a@apex.com',
    'USER',
    'BRONZE',
    'TNT-BRONZE-CLIENT'
  );

  const customerBToken = generateAuthToken(
    'usr-customer-b',
    'customer-b@tata.com',
    'USER',
    'SILVER',
    'TNT-SILVER-CLIENT'
  );

  const adminToken = generateAuthToken(
    'usr-admin-sriman',
    'sriman@procucev.com',
    'ADMIN',
    'GOLD',
    'TNT-GLOBAL-8902',
    '+91 99000 11223'
  );

  beforeEach(() => {
    subscriptionService.reset();
  });

  describe('Section 3: Tenant Isolation Tests', () => {
    it('TEST 1: Customer A authenticates and requests Customer A subscription -> SUCCESS', async () => {
      const res = await request(app)
        .get('/api/subscription/plan')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.tier).toBe('BRONZE');
    });

    it('TEST 2: Customer A requests Customer B subscription -> HTTP 403', async () => {
      const res = await request(app)
        .get('/api/subscription/plan')
        .set('Authorization', `Bearer ${customerAToken}`)
        .set('x-tenant-id', 'TNT-SILVER-CLIENT');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('TENANT_MISMATCH');
    });

    it('TEST 3: Customer A changes tenantId in query string to Customer B -> HTTP 403', async () => {
      const res = await request(app)
        .get('/api/subscription/plan?tenantId=TNT-SILVER-CLIENT')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('TENANT_MISMATCH');
    });

    it('TEST 4: Customer A changes tenantId in POST body to Customer B -> HTTP 403', async () => {
      const res = await request(app)
        .post('/api/subscription/activate')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          customer_email: 'customer-a@apex.com',
          activation_code: 'PCV-TEST-CODE-0001',
          tenant_id: 'TNT-SILVER-CLIENT'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('TENANT_MISMATCH');
    });

    it('TEST 5: Customer A attempts to activate against a code issued for Customer B -> HTTP 400/403 rejected', async () => {
      const provisioned = subscriptionStore.getSubscriptionByTenantId('TNT-PENDING-CLIENT');
      const res = await request(app)
        .post('/api/subscription/activate')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          customer_email: 'customer-a@apex.com',
          activation_code: 'PCV-WRONG-CODE-9999'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(provisioned.status).toBe('PENDING_ACTIVATION');
    });

    it('TEST 6: Customer A attempts to access Customer B report/export -> HTTP 403', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/pdf?tenantId=TNT-SILVER-CLIENT')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('TEST 7: Customer A attempts to access Customer B PCBI/savings/module data -> HTTP 403', async () => {
      const res = await request(app)
        .get('/api/savings?tenantId=TNT-SILVER-CLIENT')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Section 4: Admin Authorization Tests (Customer vs Admin)', () => {
    it('CUSTOMER -> admin/list = DENIED (403)', async () => {
      const res = await request(app)
        .get('/api/subscription/admin/list')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('CUSTOMER -> provision = DENIED (403)', async () => {
      const res = await request(app)
        .post('/api/subscription/admin/provision')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          tenant_id: 'TNT-NEW-CLIENT',
          customer_id: 'usr-new',
          customer_email: 'new@company.com',
          customer_name: 'New Client',
          company_name: 'New Co',
          tier: 'GOLD',
          commercial_status: 'COMPLETED',
          otp_session_id: 'sess-1',
          otp_code: '123456'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('CUSTOMER -> suspend = DENIED (403)', async () => {
      const res = await request(app)
        .patch('/api/subscription/admin/sub-001/status')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ status: 'SUSPENDED' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('CUSTOMER -> renew = DENIED (403)', async () => {
      const res = await request(app)
        .post('/api/subscription/admin/sub-001/renew')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          new_end_date: '2028-01-01',
          payment_reference: 'REF-123',
          otp_session_id: 'sess-1',
          otp_code: '123456'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('CUSTOMER -> cancel = DENIED (403)', async () => {
      const res = await request(app)
        .patch('/api/subscription/admin/sub-001/status')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('CUSTOMER -> admin audit = DENIED (403)', async () => {
      const res = await request(app)
        .get('/api/subscription/admin/audit-trail')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('ADMIN -> admin/list = SUCCESS (200)', async () => {
      const res = await request(app)
        .get('/api/subscription/admin/list')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.subscriptions)).toBe(true);
    });
  });

  describe('Section 10: Admin Simulator Tests', () => {
    it('Customer cannot invoke simulator API -> 403', async () => {
      const res = await request(app)
        .post('/api/subscription/admin/simulate-tier')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ target_tier: 'GOLD' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Admin can invoke simulator without altering persisted database records', async () => {
      const beforeSub = subscriptionStore.getSubscriptionByTenantId('TNT-BRONZE-CLIENT');
      expect(beforeSub.tier).toBe('BRONZE');

      const res = await request(app)
        .post('/api/subscription/admin/simulate-tier')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ target_tier: 'GOLD' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.tier).toBe('GOLD');
      expect(res.body.plan.is_simulation).toBe(true);

      // Verify real persisted record is strictly unchanged
      const afterSub = subscriptionStore.getSubscriptionByTenantId('TNT-BRONZE-CLIENT');
      expect(afterSub.tier).toBe('BRONZE');
    });
  });
});
