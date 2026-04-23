const request = require('supertest');
const { app } = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

describe('Authentication API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with firstName and lastName', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
        language: 'en'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.displayName).toBe('Test User');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should register a user without firstName/lastName and use username as displayName', async () => {
      const userData = {
        email: 'test2@example.com',
        username: 'testuser2',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.displayName).toBe(userData.username);
    });

    it('should not register user with existing email', async () => {
      // First register a user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'user1',
          password: 'TestPassword123'
        })
        .expect(201);

      // Try to register with same email
      const userData = {
        email: 'duplicate@example.com',
        username: 'differentuser',
        password: 'TestPassword123'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);
    });

    it('should not register user with existing username', async () => {
      // First register a user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user1@example.com',
          username: 'duplicateuser',
          password: 'TestPassword123'
        })
        .expect(201);

      // Try to register with same username
      const userData = {
        email: 'different@example.com',
        username: 'duplicateuser',
        password: 'TestPassword123'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate password length', async () => {
      const userData = {
        email: 'test3@example.com',
        username: 'testuser3',
        password: '123'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let user;

    beforeEach(async () => {
      const passwordHash = await bcrypt.hash('TestPassword123', 12);
      user = await prisma.user.create({
        data: {
          email: 'login@example.com',
          username: 'loginuser',
          passwordHash,
          displayName: 'Login User'
        }
      });
    });

    it('should login with email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'login@example.com',
          password: 'TestPassword123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should login with username', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'loginuser',
          password: 'TestPassword123'
        })
        .expect(200);

      expect(response.body.user.username).toBe('loginuser');
    });

    it('should not login with wrong password', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'login@example.com',
          password: 'WrongPassword'
        })
        .expect(401);
    });

    it('should not login with non-existent user', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'TestPassword123'
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let tokens;

    beforeEach(async () => {
      // Register a user and get tokens
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh@example.com',
          username: 'refreshuser',
          password: 'TestPassword123',
          firstName: 'Refresh',
          lastName: 'User'
        });

      tokens = response.body;
    });

    it('should refresh tokens with valid refresh token', async () => {
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(tokens.accessToken);
      expect(response.body.refreshToken).not.toBe(tokens.refreshToken);
    });

    it('should not refresh with invalid token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(401);
    });

    it('should not refresh without token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let tokens;

    beforeEach(async () => {
      // Register a user and get tokens
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logout@example.com',
          username: 'logoutuser',
          password: 'TestPassword123'
        });

      tokens = response.body;
    });

    it('should logout with valid refresh token', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken: tokens.refreshToken
        })
        .expect(204);

      // Token should now be invalid
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken
        })
        .expect(401);
    });

    it('should logout without token (no error)', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .send({})
        .expect(204);
    });
  });
});
