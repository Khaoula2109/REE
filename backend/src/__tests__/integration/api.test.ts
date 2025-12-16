import request from 'supertest';
import app from '../../app';
import { TestFactory } from '../helpers/factories';
import bcrypt from 'bcryptjs';

describe('API Integration Tests', () => {
  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await TestFactory.createUser({
        email: 'test@example.com',
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(user.email);
    });

    it('should fail to login with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      await TestFactory.createUser({
        email: 'test2@example.com',
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Mobile API', () => {
    it('should get addresses for agent district', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });

      // Create meter in same district
      const address = await TestFactory.createAddress({ districtId: district.id });
      await TestFactory.createMeter({ addressId: address.id });

      // Generate agent token
      const jwt = require('jsonwebtoken');
      const agentToken = jwt.sign(
        { userId: agent.id, role: 'AGENT' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/mobile/addresses')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('addresses');
    });

    it('should create a reading from mobile', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });
      const address = await TestFactory.createAddress({ districtId: district.id });
      const meter = await TestFactory.createMeter({
        addressId: address.id,
        currentIndex: 100,
      });

      const jwt = require('jsonwebtoken');
      const agentToken = jwt.sign(
        { userId: agent.id, role: 'AGENT' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/mobile/readings')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          meterId: meter.id,
          currentIndex: 150,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('reading');
      expect(Number(response.body.reading.consumption)).toBe(50);
    });

    it('should fail if currentIndex is less than previousIndex', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });
      const address = await TestFactory.createAddress({ districtId: district.id });
      const meter = await TestFactory.createMeter({
        addressId: address.id,
        currentIndex: 100,
      });

      const jwt = require('jsonwebtoken');
      const agentToken = jwt.sign(
        { userId: agent.id, role: 'AGENT' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/mobile/readings')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          meterId: meter.id,
          currentIndex: 50,
        });

      expect(response.status).toBe(400);
    });

    it('should get agent statistics', async () => {
      const agent = await TestFactory.createAgent();
      await TestFactory.createReading({ agentId: agent.id });

      const jwt = require('jsonwebtoken');
      const agentToken = jwt.sign(
        { userId: agent.id, role: 'AGENT' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/mobile/stats')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('today');
      expect(response.body.stats).toHaveProperty('thisMonth');
      expect(response.body.stats).toHaveProperty('total');
    });
  });
});
