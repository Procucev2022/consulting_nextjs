import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateAuthToken } from '../../src/utils/auth';

describe('Auth Controller Integration Tests', () => {
  let uniqueEmail = `prakash.${Date.now()}@innovate.com`;
  const getTestUser = () => ({
    name: 'Prakash Rao',
    mobile_number: '+91 91234 56780',
    email: uniqueEmail,
    company_name: 'Innovate Procurement Solutions',
    company_address: 'Plot 10, HITEC City, Hyderabad 500081, Telangana, India',
    password: 'SecurePassword@123'
  });

  beforeEach(() => {
    // Keep email consistent for login tests after registration
  });

  it('should register a new user successfully', async () => {
    const user = getTestUser();
    const res = await request(app)
      .post('/api/auth/register')
      .send(user);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(user.email.toLowerCase());
    expect(res.body.user.name).toBe(user.name);
    expect(res.body.user.company_name).toBe(user.company_name);
    expect(res.body.user.role).toBe('USER');
    expect(res.body.user.subscription_tier).toBe('BRONZE');
    expect(res.body.token).toBeDefined();
  });

  it('should reject registration if email already exists', async () => {
    const user = getTestUser();
    const res = await request(app)
      .post('/api/auth/register')
      .send(user);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('should reject registration with invalid fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        mobile_number: '123'
      });

    if (!res.body.errors) {
      // Print what was received if errors is undefined
      // eslint-disable-next-line no-console
      console.error('DEBUG INVALID REGISTRATION BODY:', res.status, res.body);
    }

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors || res.body.message).toBeDefined();
  });

  it('should log in successfully with valid credentials', async () => {
    const user = getTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(user.email.toLowerCase());
  });

  it('should log in successfully with seeded admin account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@procucev.com',
        password: 'Admin@123456'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('should reject login with wrong password', async () => {
    const user = getTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login if user does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@company.com',
        password: 'AnyPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should get current user profile with valid Bearer token', async () => {
    const user = getTestUser();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe(user.email.toLowerCase());
  });

  it('should reject /me request without auth header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject /me request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 on /me if user id in token is not found in database', async () => {
    const orphanToken = generateAuthToken('usr-does-not-exist', 'orphan@test.com', 'USER');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${orphanToken}`);

    expect(res.status).toBe(404);
  });
});
