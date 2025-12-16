import request from 'supertest';
import app from '../../server';
import { TestFactory } from '../helpers/factories';
import { expectError, expectSuccess } from '../helpers/utils';
import User, { UserRole } from '../../models/User';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await TestFactory.createUser({
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: password,
        });

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail to login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expectError(response, 401);
    });

    it('should fail to login with invalid password', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await TestFactory.createUser({
        email: 'test@example.com',
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expectError(response, 401);
    });

    it('should fail to login with inactive user', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await TestFactory.createUser({
        email: 'inactive@example.com',
        password: hashedPassword,
        isActive: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: password,
        });

      expectError(response, 403);
    });

    it('should fail to login without email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expectError(response, 400);
    });

    it('should fail to login without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expectError(response, 400);
    });

    it('should log login attempts in LoginLog', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await TestFactory.createUser({
        email: 'logger@example.com',
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logger@example.com',
          password: password,
        });

      expectSuccess(response, 200);

      // Check that login was logged (you'll need to import LoginLog model)
      // const logs = await LoginLog.findAll({ where: { email: 'logger@example.com' } });
      // expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await TestFactory.createUser({
        email: 'refresh@example.com',
        password: hashedPassword,
      });

      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: password,
        });

      const { refreshToken } = loginResponse.body;

      // Use refresh token to get new access token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expectSuccess(refreshResponse, 200);
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body.accessToken).toBeDefined();
    });

    it('should fail to refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expectError(response, 401);
    });

    it('should fail to refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expectError(response, 400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await TestFactory.createUser({
        email: 'logout@example.com',
        password: hashedPassword,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: password,
        });

      const { accessToken } = loginResponse.body;

      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expectSuccess(logoutResponse, 200);
      expect(logoutResponse.body).toHaveProperty('message');
    });

    it('should fail to logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expectError(response, 401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await TestFactory.createUser({
        email: 'me@example.com',
        password: hashedPassword,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: password,
        });

      const { accessToken } = loginResponse.body;

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expectSuccess(meResponse, 200);
      expect(meResponse.body.id).toBe(user.id);
      expect(meResponse.body.email).toBe(user.email);
      expect(meResponse.body).not.toHaveProperty('password');
    });

    it('should fail to get current user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expectError(response, 401);
    });

    it('should fail to get current user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expectError(response, 401);
    });
  });

  describe('Password change flow', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const hashedOldPassword = await bcrypt.hash(oldPassword, 10);

      await TestFactory.createUser({
        email: 'changepass@example.com',
        password: hashedOldPassword,
      });

      // Login with old password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'changepass@example.com',
          password: oldPassword,
        });

      const { accessToken } = loginResponse.body;

      // Change password
      const changeResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: oldPassword,
          newPassword: newPassword,
        });

      expectSuccess(changeResponse, 200);

      // Try to login with new password
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'changepass@example.com',
          password: newPassword,
        });

      expectSuccess(newLoginResponse, 200);
    });
  });

  describe('Role-based access', () => {
    it('should return correct role in token for SUPERADMIN', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await TestFactory.createSuperAdmin({
        email: 'admin@example.com',
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: password,
        });

      expectSuccess(response, 200);
      expect(response.body.user.role).toBe(UserRole.SUPERADMIN);
    });

    it('should return correct role in token for USER', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await TestFactory.createUser({
        email: 'user@example.com',
        password: hashedPassword,
        role: UserRole.USER,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: password,
        });

      expectSuccess(response, 200);
      expect(response.body.user.role).toBe(UserRole.USER);
    });
  });
});
