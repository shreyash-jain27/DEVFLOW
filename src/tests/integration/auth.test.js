const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Auth Endpoints', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      expect(res.status).toBe(201);
      expect(res.body.email).toBe(validUser.email);
      expect(res.body.accessToken).toBeDefined();
      
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
    });

    it('should fail with duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      expect(res.status).toBe(400); 
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' });
      
      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toMatch(/invalid email/i);
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: 'weak' });
      
      expect(res.status).toBe(400);
      expect(res.body.errors.some(e => e.message.includes('8 characters'))).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword123' });
      
      expect(res.status).toBe(401);
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'Password123' });
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshTokenCookie;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      refreshTokenCookie = res.headers['set-cookie'];
    });

    it('should succeed with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', refreshTokenCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalid_token_string']);
      
      expect(res.status).toBe(403);
    });

    it('should fail without token', async () => {
      const res = await request(app).post('/api/auth/refresh-token');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;
    let refreshTokenCookie;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      accessToken = res.body.accessToken;
      refreshTokenCookie = res.headers['set-cookie'];
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshTokenCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
      
      
      const cookies = res.headers['set-cookie'];
      expect(cookies[0]).toMatch(/refreshToken=;/);
    });

    it('should fail without access token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(401);
    });
  });
});
