import request from 'supertest';
import app from '../../app';
import { TestFactory } from '../helpers/factories';
import { MeterType } from '../../models/Meter';

describe('E2E: Agent Workflow', () => {
  it('should complete agent workflow: get addresses → create reading → check stats', async () => {
    // Setup
    const district = await TestFactory.createDistrict();
    const agent = await TestFactory.createAgent({ districtId: district.id });
    const address = await TestFactory.createAddress({ districtId: district.id });
    const meter = await TestFactory.createMeter({
      addressId: address.id,
      meterType: MeterType.WATER,
      currentIndex: 100,
    });

    // Generate agent token
    const jwt = require('jsonwebtoken');
    const agentToken = jwt.sign(
      { userId: agent.id, role: 'AGENT' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    // Step 1: Get addresses to visit
    const addressesResponse = await request(app)
      .get('/api/mobile/addresses')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(addressesResponse.status).toBe(200);
    expect(addressesResponse.body.total).toBeGreaterThan(0);

    // Step 2: Create reading
    const readingResponse = await request(app)
      .post('/api/mobile/readings')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        meterId: meter.id,
        currentIndex: 150,
      });

    expect(readingResponse.status).toBe(201);
    expect(Number(readingResponse.body.reading.consumption)).toBe(50);

    // Step 3: Check stats
    const statsResponse = await request(app)
      .get('/api/mobile/stats')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.stats.today).toBeGreaterThanOrEqual(1);
    expect(statsResponse.body.stats.total).toBeGreaterThanOrEqual(1);

    // Step 4: Verify address is no longer in list (read this month)
    const updatedAddressesResponse = await request(app)
      .get('/api/mobile/addresses')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(updatedAddressesResponse.status).toBe(200);
    const meterIds = updatedAddressesResponse.body.addresses.map((a: any) => a.meterId);
    expect(meterIds).not.toContain(meter.id);
  });

  it('should prevent agent from reading meters outside their district', async () => {
    const district1 = await TestFactory.createDistrict();
    const district2 = await TestFactory.createDistrict();
    const agent = await TestFactory.createAgent({ districtId: district1.id });
    const address = await TestFactory.createAddress({ districtId: district2.id });
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

    expect(response.status).toBe(403);
  });
});
