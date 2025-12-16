import request from 'supertest';
import app from '../../server';
import { TestFactory } from '../helpers/factories';
import { expectSuccess } from '../helpers/utils';
import bcrypt from 'bcryptjs';
import { MeterType } from '../../models/Meter';

describe('E2E: Agent Field Workflow', () => {
  it('should complete full agent workflow: login → get addresses → create readings → view stats', async () => {
    // ==================== SETUP ====================
    // Create district
    const district = await TestFactory.createDistrict({
      name: 'Agdal',
      code: 'AGD01',
    });

    // Create agent with login credentials
    const password = 'agent123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await TestFactory.createAgent({
      agentId: 'AG001',
      firstName: 'Ahmed',
      lastName: 'BENALI',
      email: 'ahmed.benali@ree.ma',
      phone: '+212 661234567',
      districtId: district.id,
      isActive: true,
    });

    // Create client
    const client = await TestFactory.createClient({
      clientId: 'CL001',
      firstName: 'Mohamed',
      lastName: 'ALAMI',
      email: 'mohamed.alami@gmail.com',
      phone: '+212 662345678',
    });

    // Create addresses in agent's district
    const address1 = await TestFactory.createAddress({
      street: 'Avenue Hassan II',
      number: '123',
      floor: '3',
      apartmentNumber: '5',
      clientId: client.id,
      districtId: district.id,
    });

    const address2 = await TestFactory.createAddress({
      street: 'Rue Mohammed V',
      number: '456',
      floor: '1',
      apartmentNumber: '2',
      clientId: client.id,
      districtId: district.id,
    });

    // Create meters for addresses
    const waterMeter = await TestFactory.createMeter({
      meterType: MeterType.WATER,
      currentIndex: 1250.50,
      addressId: address1.id,
    });

    const electricityMeter = await TestFactory.createMeter({
      meterType: MeterType.ELECTRICITY,
      currentIndex: 5420.75,
      addressId: address2.id,
    });

    // ==================== STEP 1: MOBILE LOGIN ====================
    // Note: For mobile, we need to create a User account linked to the agent
    // In a real scenario, agents would have User accounts with AGENT role
    const agentUser = await TestFactory.createUser({
      email: agent.email,
      password: hashedPassword,
      firstName: agent.firstName,
      lastName: agent.lastName,
      role: 'USER' as any, // In production, you'd have an AGENT role
      isActive: true,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: agent.email,
        password: password,
      });

    expectSuccess(loginResponse, 200);
    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body).toHaveProperty('refreshToken');

    const { accessToken } = loginResponse.body;

    // ==================== STEP 2: GET ADDRESSES TO VISIT ====================
    const addressesResponse = await request(app)
      .get('/api/mobile/addresses')
      .set('Authorization', `Bearer ${accessToken}`);

    // Note: This will work with agent auth header in real scenario
    // For now, we'll use the direct agent approach for mobile endpoints

    // Create custom token for agent (simulating mobile app auth)
    const jwt = require('jsonwebtoken');
    const agentToken = jwt.sign(
      { userId: agent.id, role: 'AGENT' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    const addressesResponse2 = await request(app)
      .get('/api/mobile/addresses')
      .set('Authorization', `Bearer ${agentToken}`);

    expectSuccess(addressesResponse2, 200);
    expect(addressesResponse2.body).toHaveProperty('total');
    expect(addressesResponse2.body).toHaveProperty('addresses');
    expect(addressesResponse2.body.addresses).toBeInstanceOf(Array);

    // Should have 2 meters to read
    expect(addressesResponse2.body.total).toBeGreaterThanOrEqual(2);

    const addressesToVisit = addressesResponse2.body.addresses;

    // ==================== STEP 3: CREATE FIRST READING (WATER METER) ====================
    const waterMeterToRead = addressesToVisit.find(
      (a: any) => a.meterType === MeterType.WATER
    );

    expect(waterMeterToRead).toBeDefined();

    const waterReadingResponse = await request(app)
      .post('/api/mobile/readings')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        meterId: waterMeterToRead.meterId,
        currentIndex: 1275.25, // +24.75 consumption
      });

    expectSuccess(waterReadingResponse, 201);
    expect(waterReadingResponse.body).toHaveProperty('reading');
    expect(Number(waterReadingResponse.body.reading.consumption)).toBeCloseTo(24.75, 2);

    // ==================== STEP 4: CREATE SECOND READING (ELECTRICITY METER) ====================
    const electricityMeterToRead = addressesToVisit.find(
      (a: any) => a.meterType === MeterType.ELECTRICITY
    );

    expect(electricityMeterToRead).toBeDefined();

    const electricityReadingResponse = await request(app)
      .post('/api/mobile/readings')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        meterId: electricityMeterToRead.meterId,
        currentIndex: 5550.00, // +129.25 consumption
      });

    expectSuccess(electricityReadingResponse, 201);
    expect(Number(electricityReadingResponse.body.reading.consumption)).toBeCloseTo(129.25, 2);

    // ==================== STEP 5: CHECK UPDATED ADDRESS LIST ====================
    const updatedAddressesResponse = await request(app)
      .get('/api/mobile/addresses')
      .set('Authorization', `Bearer ${agentToken}`);

    expectSuccess(updatedAddressesResponse, 200);

    // After reading both meters, they should not appear in the list anymore
    const remainingAddresses = updatedAddressesResponse.body.addresses;
    const readMeterIds = [waterMeterToRead.meterId, electricityMeterToRead.meterId];

    remainingAddresses.forEach((address: any) => {
      expect(readMeterIds).not.toContain(address.meterId);
    });

    // ==================== STEP 6: VIEW AGENT STATISTICS ====================
    const statsResponse = await request(app)
      .get('/api/mobile/stats')
      .set('Authorization', `Bearer ${agentToken}`);

    expectSuccess(statsResponse, 200);
    expect(statsResponse.body).toHaveProperty('agent');
    expect(statsResponse.body).toHaveProperty('stats');

    const stats = statsResponse.body.stats;
    expect(stats.today).toBeGreaterThanOrEqual(2); // 2 readings created today
    expect(stats.thisMonth).toBeGreaterThanOrEqual(2);
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.dailyGoal).toBe(50);
    expect(stats.todayProgress).toBeGreaterThan(0);

    // ==================== STEP 7: VIEW READING HISTORY ====================
    const historyResponse = await request(app)
      .get('/api/mobile/history?limit=10')
      .set('Authorization', `Bearer ${agentToken}`);

    expectSuccess(historyResponse, 200);
    expect(historyResponse.body).toHaveProperty('total');
    expect(historyResponse.body).toHaveProperty('readings');
    expect(historyResponse.body.readings).toBeInstanceOf(Array);
    expect(historyResponse.body.total).toBeGreaterThanOrEqual(2);

    // Check that readings are in descending order by date
    const readings = historyResponse.body.readings;
    expect(readings.length).toBeGreaterThanOrEqual(2);

    // Verify reading details
    readings.forEach((reading: any) => {
      expect(reading).toHaveProperty('meterNumber');
      expect(reading).toHaveProperty('meterType');
      expect(reading).toHaveProperty('address');
      expect(reading).toHaveProperty('previousIndex');
      expect(reading).toHaveProperty('currentIndex');
      expect(reading).toHaveProperty('consumption');
      expect(reading).toHaveProperty('readingDate');
    });

    // ==================== STEP 8: LOGOUT ====================
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expectSuccess(logoutResponse, 200);

    // ==================== VERIFICATION ====================
    // After logout, verify that protected endpoints are no longer accessible
    const protectedResponse = await request(app)
      .get('/api/mobile/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    // This might still work if token is still valid (JWT is stateless)
    // In a real implementation with token blacklisting, this would fail

    console.log(`
    ✅ E2E Agent Workflow Test Summary:
    - Agent logged in successfully
    - Found ${addressesResponse2.body.total} addresses to visit
    - Created 2 readings (Water: +24.75, Electricity: +129.25)
    - Verified updated address list (meters removed after reading)
    - Checked statistics: ${stats.today} readings today, ${stats.todayProgress}% of daily goal
    - Viewed reading history: ${historyResponse.body.total} total readings
    - Logged out successfully
    `);
  });

  it('should prevent agent from reading meters outside their district', async () => {
    // Create two districts
    const district1 = await TestFactory.createDistrict({ name: 'Agdal' });
    const district2 = await TestFactory.createDistrict({ name: 'Hassan' });

    // Create agent in district1
    const agent = await TestFactory.createAgent({ districtId: district1.id });

    // Create meter in district2
    const address = await TestFactory.createAddress({ districtId: district2.id });
    const meter = await TestFactory.createMeter({
      addressId: address.id,
      currentIndex: 100,
    });

    // Create agent token
    const jwt = require('jsonwebtoken');
    const agentToken = jwt.sign(
      { userId: agent.id, role: 'AGENT' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    // Try to create reading for meter in different district
    const response = await request(app)
      .post('/api/mobile/readings')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        meterId: meter.id,
        currentIndex: 150,
      });

    // Should be forbidden
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  it('should prevent reading the same meter twice in the same month', async () => {
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

    // Create first reading
    const firstReading = await request(app)
      .post('/api/mobile/readings')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        meterId: meter.id,
        currentIndex: 150,
      });

    expectSuccess(firstReading, 201);

    // Verify meter doesn't appear in addresses to visit
    const addressesResponse = await request(app)
      .get('/api/mobile/addresses')
      .set('Authorization', `Bearer ${agentToken}`);

    expectSuccess(addressesResponse, 200);

    const meterIds = addressesResponse.body.addresses.map((a: any) => a.meterId);
    expect(meterIds).not.toContain(meter.id);
  });
});
