import request from 'supertest';
import app from '../../server';
import { TestFactory } from '../helpers/factories';
import { getUserAuthHeader } from '../helpers/auth';
import { expectError, expectSuccess, expectPagination } from '../helpers/utils';
import { UserRole } from '../../models/User';

describe('Users API', () => {
  let superadmin: any;
  let regularUser: any;

  beforeEach(async () => {
    superadmin = await TestFactory.createSuperAdmin();
    regularUser = await TestFactory.createUser({ role: UserRole.USER });
  });

  describe('GET /api/users', () => {
    it('should get all users as SUPERADMIN', async () => {
      await TestFactory.createUser();
      await TestFactory.createUser();

      const response = await request(app)
        .get('/api/users')
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expectPagination(response.body);
    });

    it('should support pagination', async () => {
      // Create 15 users
      for (let i = 0; i < 15; i++) {
        await TestFactory.createUser();
      }

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter users by role', async () => {
      await TestFactory.createSuperAdmin();
      await TestFactory.createUser({ role: UserRole.USER });
      await TestFactory.createUser({ role: UserRole.USER });

      const response = await request(app)
        .get(`/api/users?role=${UserRole.USER}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe(UserRole.USER);
      });
    });

    it('should filter users by active status', async () => {
      await TestFactory.createUser({ isActive: true });
      await TestFactory.createUser({ isActive: true });
      await TestFactory.createUser({ isActive: false });

      const response = await request(app)
        .get('/api/users?isActive=true')
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      response.body.data.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should fail as regular USER', async () => {
      const response = await request(app)
        .get('/api/users')
        .set(getUserAuthHeader(regularUser));

      expectError(response, 403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expectError(response, 401);
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get('/api/users')
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      response.body.data.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id as SUPERADMIN', async () => {
      const user = await TestFactory.createUser();

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body.id).toBe(user.id);
      expect(response.body.email).toBe(user.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to get non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/99999')
        .set(getUserAuthHeader(superadmin));

      expectError(response, 404);
    });

    it('should fail as regular USER', async () => {
      const user = await TestFactory.createUser();

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set(getUserAuthHeader(regularUser));

      expectError(response, 403);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user as SUPERADMIN', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'USER',
        role: UserRole.USER,
        isActive: true,
      };

      const response = await request(app)
        .post('/api/users')
        .set(getUserAuthHeader(superadmin))
        .send(userData);

      expectSuccess(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to create user with duplicate email', async () => {
      const existingUser = await TestFactory.createUser({ email: 'exists@example.com' });

      const response = await request(app)
        .post('/api/users')
        .set(getUserAuthHeader(superadmin))
        .send({
          email: 'exists@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        });

      expectError(response, 400);
    });

    it('should fail to create user without email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(getUserAuthHeader(superadmin))
        .send({
          password: 'password123',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        });

      expectError(response, 400);
    });

    it('should fail to create user without password', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(getUserAuthHeader(superadmin))
        .send({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        });

      expectError(response, 400);
    });

    it('should fail to create user with invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(getUserAuthHeader(superadmin))
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        });

      expectError(response, 400);
    });

    it('should hash password before saving', async () => {
      const userData = {
        email: 'hashtest@example.com',
        password: 'plainpassword',
        firstName: 'Hash',
        lastName: 'TEST',
        role: UserRole.USER,
      };

      const response = await request(app)
        .post('/api/users')
        .set(getUserAuthHeader(superadmin))
        .send(userData);

      expectSuccess(response, 201);

      // Password should not be returned
      expect(response.body).not.toHaveProperty('password');

      // Try to login with the plain password to verify hashing worked
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      expectSuccess(loginResponse, 200);
    });

    it('should fail as regular USER', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(getUserAuthHeader(regularUser))
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        });

      expectError(response, 403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user as SUPERADMIN', async () => {
      const user = await TestFactory.createUser();

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .set(getUserAuthHeader(superadmin))
        .send({
          firstName: 'Updated',
          lastName: 'NAME',
        });

      expectSuccess(response, 200);
      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('NAME');
    });

    it('should update user role', async () => {
      const user = await TestFactory.createUser({ role: UserRole.USER });

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .set(getUserAuthHeader(superadmin))
        .send({
          role: UserRole.SUPERADMIN,
        });

      expectSuccess(response, 200);
      expect(response.body.role).toBe(UserRole.SUPERADMIN);
    });

    it('should deactivate user', async () => {
      const user = await TestFactory.createUser({ isActive: true });

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .set(getUserAuthHeader(superadmin))
        .send({
          isActive: false,
        });

      expectSuccess(response, 200);
      expect(response.body.isActive).toBe(false);
    });

    it('should fail to update with duplicate email', async () => {
      const user1 = await TestFactory.createUser({ email: 'user1@example.com' });
      const user2 = await TestFactory.createUser({ email: 'user2@example.com' });

      const response = await request(app)
        .put(`/api/users/${user1.id}`)
        .set(getUserAuthHeader(superadmin))
        .send({
          email: 'user2@example.com',
        });

      expectError(response, 400);
    });

    it('should fail as regular USER', async () => {
      const user = await TestFactory.createUser();

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .set(getUserAuthHeader(regularUser))
        .send({
          firstName: 'Updated',
        });

      expectError(response, 403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as SUPERADMIN', async () => {
      const user = await TestFactory.createUser();

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('message');

      // Verify user is deleted
      const getResponse = await request(app)
        .get(`/api/users/${user.id}`)
        .set(getUserAuthHeader(superadmin));

      expectError(getResponse, 404);
    });

    it('should fail to delete non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/99999')
        .set(getUserAuthHeader(superadmin));

      expectError(response, 404);
    });

    it('should fail as regular USER', async () => {
      const user = await TestFactory.createUser();

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set(getUserAuthHeader(regularUser));

      expectError(response, 403);
    });
  });
});
