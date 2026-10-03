/**
 * Prompt 289 §8 & §9: API Entitlement Bypass & Report Export Security Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateAuthToken } from '../../src/utils/auth';
import { subscriptionService } from '../../src/services/subscriptionService';

describe('Prompt 289: API Entitlement Bypass & Export Security Tests', () => {
  const bronzeToken = generateAuthToken(
    'usr-bronze',
    'bronze@client.com',
    'USER',
    'BRONZE',
    'TNT-BRONZE-CLIENT'
  );

  const silverToken = generateAuthToken(
    'usr-silver',
    'silver@client.com',
    'USER',
    'SILVER',
    'TNT-SILVER-CLIENT'
  );

  const goldToken = generateAuthToken(
    'usr-gold',
    'gold@client.com',
    'USER',
    'GOLD',
    'TNT-GLOBAL-8902'
  );

  beforeEach(() => {
    subscriptionService.reset();
  });

  describe('Section 8: Direct API Access & Bypass Tests', () => {
    it('BRONZE -> Gold-only API (/api/reports/executive-brief/download/pdf) = 403', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/pdf')
        .set('Authorization', `Bearer ${bronzeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });

    it('SILVER -> Gold-only API (/api/reports/executive-brief/download/pdf) = 403', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/pdf')
        .set('Authorization', `Bearer ${silverToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });

    it('GOLD -> Gold-only API (/api/reports/executive-brief/download/pdf) = 200 or permitted', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/pdf')
        .set('Authorization', `Bearer ${goldToken}`);

      // Entitlement check passes (either 200 or valid processing, not 403)
      expect(res.status).not.toBe(403);
    });

    it('BRONZE user adding header tier override (x-subscription-tier: GOLD) is REJECTED (403)', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/pdf')
        .set('Authorization', `Bearer ${bronzeToken}`)
        .set('x-subscription-tier', 'GOLD');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });

    it('BRONZE user modifying query parameter (tier=GOLD&entitlement=true) is REJECTED (403)', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/pdf?tier=GOLD&entitlement=true')
        .set('Authorization', `Bearer ${bronzeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });

    it('BRONZE user requesting Action Tracker update (/api/savings/action-plan/update) = 403', async () => {
      const res = await request(app)
        .post('/api/savings/action-plan/update')
        .set('Authorization', `Bearer ${bronzeToken}`)
        .send({
          initiativeId: 'INIT-001',
          status: 'IN_PROGRESS',
          owner: 'Procurement Lead',
          targetQuarter: 'Q2',
          targetDate: '2026-06-30'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });

    it('SILVER user requesting Action Tracker update (/api/savings/action-plan/update) = 403 (Gold only)', async () => {
      const res = await request(app)
        .post('/api/savings/action-plan/update')
        .set('Authorization', `Bearer ${silverToken}`)
        .send({
          initiativeId: 'INIT-001',
          status: 'IN_PROGRESS',
          owner: 'Procurement Lead',
          targetQuarter: 'Q2',
          targetDate: '2026-06-30'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });

    it('BRONZE user attempting Module 4 Opportunity status update = 403', async () => {
      const res = await request(app)
        .post('/api/savings/opportunity/status')
        .set('Authorization', `Bearer ${bronzeToken}`)
        .send({
          opportunityId: 'OPP-001',
          status: 'ACTIVE'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });

    it('SILVER user permitted for Management Quick Summary PDF export (/download/opportunity-brief/pdf)', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/opportunity-brief/pdf')
        .set('Authorization', `Bearer ${silverToken}`);

      expect(res.status).not.toBe(403);
    });

    it('BRONZE user rejected for Management Quick Summary PDF export (/download/opportunity-brief/pdf) = 403', async () => {
      const res = await request(app)
        .get('/api/reports/executive-brief/download/opportunity-brief/pdf')
        .set('Authorization', `Bearer ${bronzeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FEATURE_LOCKED');
    });
  });
});
