import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateAuthToken } from '../../src/utils/auth';

describe('Admin Controller Integration Tests', () => {
  const adminToken = generateAuthToken('usr-admin-001', 'admin@procucev.com', 'ADMIN');
  const userToken = generateAuthToken('usr-user-001', 'srinivas@apexindustrial.com', 'USER');

  it('should list all registered users for admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.activeCount).toBeGreaterThanOrEqual(1);
    expect(res.body.companiesCount).toBeGreaterThanOrEqual(1);

    const firstUser = res.body.users[0];
    expect(firstUser.name).toBeDefined();
    expect(firstUser.email).toBeDefined();
    expect(firstUser.company_name).toBeDefined();
    expect(firstUser.company_address).toBeDefined();
    expect(firstUser.mobile_number).toBeDefined();
  });

  it('should filter users by search term', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=srinivas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users.some((u: any) => u.email.includes('srinivas'))).toBe(true);
  });

  it('should filter users by role and status', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=ADMIN&status=ACTIVE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.every((u: any) => u.role === 'ADMIN')).toBe(true);
  });

  it('should support x-auth-token header and raw token without Bearer prefix', async () => {
    const resWithCustomHeader = await request(app)
      .get('/api/admin/users')
      .set('x-auth-token', adminToken);

    expect(resWithCustomHeader.status).toBe(200);

    const resWithRawToken = await request(app)
      .get('/api/admin/users')
      .set('Authorization', adminToken);

    expect(resWithRawToken.status).toBe(200);

    const resWithoutHeader = await request(app)
      .get('/api/admin/users');

    expect(resWithoutHeader.status).toBe(200);
  });

  it('should reject non-admin users with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Administrator');
  });

  it('should reject invalid query parameters', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=INVALID_ROLE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('should update user status to SUSPENDED and back to ACTIVE', async () => {
    // 1. Suspend user
    const res = await request(app)
      .patch('/api/admin/users/usr-user-001/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.status).toBe('SUSPENDED');

    // Verify suspended user cannot log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'srinivas@apexindustrial.com',
        password: 'User@123456'
      });
    expect(loginRes.status).toBe(403);

    // 2. Reactivate user
    const reactivateRes = await request(app)
      .patch('/api/admin/users/usr-user-001/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.user.status).toBe('ACTIVE');
  }, 20000);


  it('should return 400 if user status update payload is invalid', async () => {
    const res = await request(app)
      .patch('/api/admin/users/usr-user-001/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'UNKNOWN_STATUS' });

    expect(res.status).toBe(400);
  });

  it('should filter users by search term, role, and status', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=srinivas&role=USER&status=ACTIVE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('should return 400 when updating status with blank user id', async () => {
    const res = await request(app)
      .patch('/api/admin/users/%20/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 when updating status of non-existent user', async () => {
    const res = await request(app)
      .patch('/api/admin/users/usr-does-not-exist/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(404);
  });

  it('should filter users by subscription tier', async () => {
    const res = await request(app)
      .get('/api/admin/users?tier=BRONZE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users.every((u: any) => u.subscription_tier === 'BRONZE')).toBe(true);
  });

  it('should update user subscription tier to GOLD and BRONZE', async () => {
    // 1. Upgrade user to GOLD
    const res = await request(app)
      .patch('/api/admin/users/usr-user-002/tier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tier: 'GOLD' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.subscription_tier).toBe('GOLD');

    // 2. Downgrade back to SILVER
    const resSilver = await request(app)
      .patch('/api/admin/users/usr-user-002/tier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tier: 'SILVER' });

    expect(resSilver.status).toBe(200);
    expect(resSilver.body.user.subscription_tier).toBe('SILVER');
  });

  it('should return 400 if user tier update payload is invalid', async () => {
    const res = await request(app)
      .patch('/api/admin/users/usr-user-001/tier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tier: 'DIAMOND' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when updating tier with blank user id', async () => {
    const res = await request(app)
      .patch('/api/admin/users/%20/tier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tier: 'GOLD' });

    expect(res.status).toBe(400);
  });

  it('should return 404 when updating tier of non-existent user', async () => {
    const res = await request(app)
      .patch('/api/admin/users/usr-does-not-exist/tier')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tier: 'GOLD' });

    expect(res.status).toBe(404);
  });
});
