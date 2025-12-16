import request from 'supertest';
import app from '../../server';
import { TestFactory } from '../helpers/factories';
import { getAgentAuthHeader } from '../helpers/auth';
import { expectError, expectSuccess } from '../helpers/utils';
import { MeterType } from '../../models/Meter';

describe('Mobile API', () => {
  describe('GET /api/mobile/addresses', () => {
    it('should get addresses to visit for agent in their district', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });

      // Create addresses in agent's district
      const address1 = await TestFactory.createAddress({ districtId: district.id });
      const address2 = await TestFactory.createAddress({ districtId: district.id });

      // Create meters for these addresses
      await TestFactory.createMeter({ addressId: address1.id });
      await TestFactory.createMeter({ addressId: address2.id });

      const response = await request(app)
        .get('/api/mobile/addresses')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('addresses');
      expect(response.body).toHaveProperty('period');
      expect(response.body.addresses).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should exclude addresses already read this month', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });

      const address = await TestFactory.createAddress({ districtId: district.id });
      const meter = await TestFactory.createMeter({ addressId: address.id });

      // Create a reading for this month
      await TestFactory.createReading({
        meterId: meter.id,
        agentId: agent.id,
        readingDate: new Date(),
      });

      const response = await request(app)
        .get('/api/mobile/addresses')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);

      // This meter should not be in the list
      const meterIds = response.body.addresses.map((a: any) => a.meterId);
      expect(meterIds).not.toContain(meter.id);
    });

    it('should only show addresses in agent district', async () => {
      const district1 = await TestFactory.createDistrict();
      const district2 = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district1.id });

      // Create address in another district
      const address2 = await TestFactory.createAddress({ districtId: district2.id });
      await TestFactory.createMeter({ addressId: address2.id });

      const response = await request(app)
        .get('/api/mobile/addresses')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);

      // Should not include meters from other districts
      const addressIds = response.body.addresses.map((a: any) => a.address.id);
      expect(addressIds).not.toContain(address2.id);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/mobile/addresses');

      expectError(response, 401);
    });
  });

  describe('POST /api/mobile/readings', () => {
    it('should create a reading successfully', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });
      const address = await TestFactory.createAddress({ districtId: district.id });
      const meter = await TestFactory.createMeter({
        addressId: address.id,
        currentIndex: 100,
      });

      const response = await request(app)
        .post('/api/mobile/readings')
        .set(getAgentAuthHeader(agent))
        .send({
          meterId: meter.id,
          currentIndex: 150,
        });

      expectSuccess(response, 201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('reading');
      expect(response.body.reading.meterId).toBe(meter.id);
      expect(Number(response.body.reading.currentIndex)).toBe(150);
      expect(Number(response.body.reading.previousIndex)).toBe(100);
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

      const response = await request(app)
        .post('/api/mobile/readings')
        .set(getAgentAuthHeader(agent))
        .send({
          meterId: meter.id,
          currentIndex: 50, // Less than current 100
        });

      expectError(response, 400);
    });

    it('should fail if agent is not assigned to meter district', async () => {
      const district1 = await TestFactory.createDistrict();
      const district2 = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district1.id });
      const address = await TestFactory.createAddress({ districtId: district2.id });
      const meter = await TestFactory.createMeter({ addressId: address.id });

      const response = await request(app)
        .post('/api/mobile/readings')
        .set(getAgentAuthHeader(agent))
        .send({
          meterId: meter.id,
          currentIndex: 150,
        });

      expectError(response, 403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/mobile/readings')
        .send({
          meterId: 1,
          currentIndex: 150,
        });

      expectError(response, 401);
    });

    it('should fail without meterId', async () => {
      const agent = await TestFactory.createAgent();

      const response = await request(app)
        .post('/api/mobile/readings')
        .set(getAgentAuthHeader(agent))
        .send({
          currentIndex: 150,
        });

      expectError(response, 400);
    });

    it('should fail without currentIndex', async () => {
      const agent = await TestFactory.createAgent();
      const meter = await TestFactory.createMeter();

      const response = await request(app)
        .post('/api/mobile/readings')
        .set(getAgentAuthHeader(agent))
        .send({
          meterId: meter.id,
        });

      expectError(response, 400);
    });

    it('should update meter currentIndex and lastReadingDate', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });
      const address = await TestFactory.createAddress({ districtId: district.id });
      const meter = await TestFactory.createMeter({
        addressId: address.id,
        currentIndex: 100,
      });

      const response = await request(app)
        .post('/api/mobile/readings')
        .set(getAgentAuthHeader(agent))
        .send({
          meterId: meter.id,
          currentIndex: 200,
        });

      expectSuccess(response, 201);

      // Reload meter to check updates
      await meter.reload();
      expect(Number(meter.currentIndex)).toBe(200);
      expect(meter.lastReadingDate).toBeDefined();
    });
  });

  describe('GET /api/mobile/stats', () => {
    it('should get agent statistics', async () => {
      const agent = await TestFactory.createAgent();

      // Create some readings
      await TestFactory.createReading({
        agentId: agent.id,
        readingDate: new Date(),
      });
      await TestFactory.createReading({
        agentId: agent.id,
        readingDate: new Date(),
      });

      const response = await request(app)
        .get('/api/mobile/stats')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('agent');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('today');
      expect(response.body.stats).toHaveProperty('thisMonth');
      expect(response.body.stats).toHaveProperty('total');
      expect(response.body.stats).toHaveProperty('averagePerDay');
      expect(response.body.stats).toHaveProperty('dailyGoal');
      expect(response.body.stats).toHaveProperty('todayProgress');
      expect(response.body.stats.dailyGoal).toBe(50);
    });

    it('should calculate today readings correctly', async () => {
      const agent = await TestFactory.createAgent();

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Create readings for today and yesterday
      await TestFactory.createReading({ agentId: agent.id, readingDate: today });
      await TestFactory.createReading({ agentId: agent.id, readingDate: today });
      await TestFactory.createReading({ agentId: agent.id, readingDate: yesterday });

      const response = await request(app)
        .get('/api/mobile/stats')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);
      expect(response.body.stats.today).toBeGreaterThanOrEqual(2);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/mobile/stats');

      expectError(response, 401);
    });
  });

  describe('GET /api/mobile/history', () => {
    it('should get agent reading history', async () => {
      const agent = await TestFactory.createAgent();

      // Create some readings
      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });

      const response = await request(app)
        .get('/api/mobile/history')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('readings');
      expect(response.body.readings).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination with limit and offset', async () => {
      const agent = await TestFactory.createAgent();

      // Create 10 readings
      for (let i = 0; i < 10; i++) {
        await TestFactory.createReading({ agentId: agent.id });
      }

      const response = await request(app)
        .get('/api/mobile/history?limit=5&offset=0')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);
      expect(response.body.readings.length).toBeLessThanOrEqual(5);
    });

    it('should return readings in descending order by date', async () => {
      const agent = await TestFactory.createAgent();

      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      await TestFactory.createReading({ agentId: agent.id, readingDate: date1 });
      await TestFactory.createReading({ agentId: agent.id, readingDate: date2 });
      await TestFactory.createReading({ agentId: agent.id, readingDate: date3 });

      const response = await request(app)
        .get('/api/mobile/history')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);

      const dates = response.body.readings.map((r: any) => new Date(r.readingDate));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });

    it('should only return agent own readings', async () => {
      const agent1 = await TestFactory.createAgent();
      const agent2 = await TestFactory.createAgent();

      await TestFactory.createReading({ agentId: agent1.id });
      await TestFactory.createReading({ agentId: agent1.id });
      await TestFactory.createReading({ agentId: agent2.id });

      const response = await request(app)
        .get('/api/mobile/history')
        .set(getAgentAuthHeader(agent1));

      expectSuccess(response, 200);
      expect(response.body.total).toBe(2);

      response.body.readings.forEach((reading: any) => {
        // All readings should belong to agent1 (but agentId is not returned in response)
        // So we just check that we got exactly 2 readings
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/mobile/history');

      expectError(response, 401);
    });

    it('should include meter and address information', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });
      const address = await TestFactory.createAddress({ districtId: district.id });
      const meter = await TestFactory.createMeter({
        addressId: address.id,
        meterType: MeterType.WATER,
      });

      await TestFactory.createReading({ agentId: agent.id, meterId: meter.id });

      const response = await request(app)
        .get('/api/mobile/history')
        .set(getAgentAuthHeader(agent));

      expectSuccess(response, 200);
      expect(response.body.readings.length).toBeGreaterThan(0);

      const reading = response.body.readings[0];
      expect(reading).toHaveProperty('meterNumber');
      expect(reading).toHaveProperty('meterType');
      expect(reading).toHaveProperty('address');
    });
  });
});
