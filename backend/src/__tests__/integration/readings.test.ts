import request from 'supertest';
import app from '../../server';
import { TestFactory } from '../helpers/factories';
import { getUserAuthHeader } from '../helpers/auth';
import { expectError, expectSuccess, expectPagination } from '../helpers/utils';
import { UserRole } from '../../models/User';

describe('Readings API', () => {
  let superadmin: any;
  let regularUser: any;

  beforeEach(async () => {
    superadmin = await TestFactory.createSuperAdmin();
    regularUser = await TestFactory.createUser({ role: UserRole.USER });
  });

  describe('GET /api/readings', () => {
    it('should get all readings as SUPERADMIN', async () => {
      await TestFactory.createReading();
      await TestFactory.createReading();
      await TestFactory.createReading();

      const response = await request(app)
        .get('/api/readings')
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expectPagination(response.body);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 15; i++) {
        await TestFactory.createReading();
      }

      const response = await request(app)
        .get('/api/readings?page=1&limit=10')
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter readings by meterId', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      await TestFactory.createReading({ meterId: meter.id, agentId: agent.id });
      await TestFactory.createReading({ meterId: meter.id, agentId: agent.id });
      await TestFactory.createReading(); // Different meter

      const response = await request(app)
        .get(`/api/readings?meterId=${meter.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      response.body.data.forEach((reading: any) => {
        expect(reading.meterId).toBe(meter.id);
      });
    });

    it('should filter readings by agentId', async () => {
      const agent = await TestFactory.createAgent();

      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading(); // Different agent

      const response = await request(app)
        .get(`/api/readings?agentId=${agent.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      response.body.data.forEach((reading: any) => {
        expect(reading.agentId).toBe(agent.id);
      });
    });

    it('should filter readings by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await TestFactory.createReading({ readingDate: new Date('2024-01-15') });
      await TestFactory.createReading({ readingDate: new Date('2024-02-15') }); // Outside range

      const response = await request(app)
        .get(`/api/readings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      // Readings should be within date range
    });

    it('should include meter and agent associations', async () => {
      await TestFactory.createReading();

      const response = await request(app)
        .get('/api/readings')
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body.data.length).toBeGreaterThan(0);

      const reading = response.body.data[0];
      expect(reading).toHaveProperty('meter');
      expect(reading).toHaveProperty('agent');
    });

    it('should work as regular USER', async () => {
      await TestFactory.createReading();

      const response = await request(app)
        .get('/api/readings')
        .set(getUserAuthHeader(regularUser));

      expectSuccess(response, 200);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/readings');

      expectError(response, 401);
    });
  });

  describe('GET /api/readings/:id', () => {
    it('should get reading by id', async () => {
      const reading = await TestFactory.createReading();

      const response = await request(app)
        .get(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body.id).toBe(reading.id);
      expect(Number(response.body.consumption)).toBe(Number(reading.consumption));
    });

    it('should include meter and agent details', async () => {
      const reading = await TestFactory.createReading();

      const response = await request(app)
        .get(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('meter');
      expect(response.body).toHaveProperty('agent');
    });

    it('should fail to get non-existent reading', async () => {
      const response = await request(app)
        .get('/api/readings/99999')
        .set(getUserAuthHeader(superadmin));

      expectError(response, 404);
    });
  });

  describe('POST /api/readings', () => {
    it('should create a new reading', async () => {
      const meter = await TestFactory.createMeter({ currentIndex: 100 });
      const agent = await TestFactory.createAgent();

      const readingData = {
        meterId: meter.id,
        agentId: agent.id,
        currentIndex: 150,
      };

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send(readingData);

      expectSuccess(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.meterId).toBe(meter.id);
      expect(response.body.agentId).toBe(agent.id);
      expect(Number(response.body.currentIndex)).toBe(150);
      expect(Number(response.body.previousIndex)).toBe(100);
      expect(Number(response.body.consumption)).toBe(50);
    });

    it('should auto-calculate consumption', async () => {
      const meter = await TestFactory.createMeter({ currentIndex: 200 });
      const agent = await TestFactory.createAgent();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send({
          meterId: meter.id,
          agentId: agent.id,
          currentIndex: 350,
        });

      expectSuccess(response, 201);
      expect(Number(response.body.consumption)).toBe(150);
    });

    it('should fail if currentIndex less than meter currentIndex', async () => {
      const meter = await TestFactory.createMeter({ currentIndex: 100 });
      const agent = await TestFactory.createAgent();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send({
          meterId: meter.id,
          agentId: agent.id,
          currentIndex: 50,
        });

      expectError(response, 400);
    });

    it('should fail without meterId', async () => {
      const agent = await TestFactory.createAgent();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send({
          agentId: agent.id,
          currentIndex: 150,
        });

      expectError(response, 400);
    });

    it('should fail without agentId', async () => {
      const meter = await TestFactory.createMeter();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send({
          meterId: meter.id,
          currentIndex: 150,
        });

      expectError(response, 400);
    });

    it('should fail without currentIndex', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send({
          meterId: meter.id,
          agentId: agent.id,
        });

      expectError(response, 400);
    });

    it('should fail with non-existent meter', async () => {
      const agent = await TestFactory.createAgent();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send({
          meterId: 99999,
          agentId: agent.id,
          currentIndex: 150,
        });

      expectError(response, 404);
    });

    it('should fail with non-existent agent', async () => {
      const meter = await TestFactory.createMeter();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(superadmin))
        .send({
          meterId: meter.id,
          agentId: 99999,
          currentIndex: 150,
        });

      expectError(response, 404);
    });

    it('should work as regular USER', async () => {
      const meter = await TestFactory.createMeter({ currentIndex: 100 });
      const agent = await TestFactory.createAgent();

      const response = await request(app)
        .post('/api/readings')
        .set(getUserAuthHeader(regularUser))
        .send({
          meterId: meter.id,
          agentId: agent.id,
          currentIndex: 150,
        });

      expectSuccess(response, 201);
    });
  });

  describe('PUT /api/readings/:id', () => {
    it('should update reading as SUPERADMIN', async () => {
      const reading = await TestFactory.createReading({
        previousIndex: 100,
        currentIndex: 150,
      });

      const response = await request(app)
        .put(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(superadmin))
        .send({
          currentIndex: 200,
        });

      expectSuccess(response, 200);
      expect(Number(response.body.currentIndex)).toBe(200);
      expect(Number(response.body.consumption)).toBe(100);
    });

    it('should recalculate consumption on update', async () => {
      const reading = await TestFactory.createReading({
        previousIndex: 100,
        currentIndex: 150,
      });

      const response = await request(app)
        .put(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(superadmin))
        .send({
          previousIndex: 120,
        });

      expectSuccess(response, 200);
      expect(Number(response.body.previousIndex)).toBe(120);
      expect(Number(response.body.consumption)).toBe(30);
    });

    it('should fail as regular USER', async () => {
      const reading = await TestFactory.createReading();

      const response = await request(app)
        .put(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(regularUser))
        .send({
          currentIndex: 200,
        });

      expectError(response, 403);
    });
  });

  describe('DELETE /api/readings/:id', () => {
    it('should delete reading as SUPERADMIN', async () => {
      const reading = await TestFactory.createReading();

      const response = await request(app)
        .delete(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(superadmin));

      expectError(getResponse, 404);
    });

    it('should fail to delete non-existent reading', async () => {
      const response = await request(app)
        .delete('/api/readings/99999')
        .set(getUserAuthHeader(superadmin));

      expectError(response, 404);
    });

    it('should fail as regular USER', async () => {
      const reading = await TestFactory.createReading();

      const response = await request(app)
        .delete(`/api/readings/${reading.id}`)
        .set(getUserAuthHeader(regularUser));

      expectError(response, 403);
    });
  });

  describe('Statistics', () => {
    it('should calculate total consumption for a meter', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      await TestFactory.createReading({
        meterId: meter.id,
        agentId: agent.id,
        previousIndex: 0,
        currentIndex: 100,
      });

      await TestFactory.createReading({
        meterId: meter.id,
        agentId: agent.id,
        previousIndex: 100,
        currentIndex: 250,
      });

      const response = await request(app)
        .get(`/api/readings?meterId=${meter.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);

      const totalConsumption = response.body.data.reduce(
        (sum: number, reading: any) => sum + Number(reading.consumption),
        0
      );

      expect(totalConsumption).toBe(250); // 100 + 150
    });

    it('should track reading history for an agent', async () => {
      const agent = await TestFactory.createAgent();

      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });

      const response = await request(app)
        .get(`/api/readings?agentId=${agent.id}`)
        .set(getUserAuthHeader(superadmin));

      expectSuccess(response, 200);
      expect(response.body.pagination.total).toBe(3);
    });
  });
});
