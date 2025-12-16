import { UserRole } from '../../models/User';
import { MeterType } from '../../models/Meter';
import Reading from '../../models/Reading';
import { TestFactory } from '../helpers/factories';

describe('Models', () => {
  describe('User Model', () => {
    it('should create a user', async () => {
      const user = await TestFactory.createUser({
        email: 'test@example.com',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.USER);
    });

    it('should create a superadmin', async () => {
      const admin = await TestFactory.createSuperAdmin();
      expect(admin.role).toBe(UserRole.SUPERADMIN);
    });
  });

  describe('Agent Model', () => {
    it('should create an agent', async () => {
      const agent = await TestFactory.createAgent();

      expect(agent.id).toBeDefined();
      expect(agent.firstName).toBeDefined();
      expect(agent.lastName).toBeDefined();
      expect(agent.personalPhone).toBeDefined();
      expect(agent.districtId).toBeDefined();
    });

    it('should associate agent with district', async () => {
      const district = await TestFactory.createDistrict();
      const agent = await TestFactory.createAgent({ districtId: district.id });

      expect(agent.districtId).toBe(district.id);
    });
  });

  describe('Meter Model', () => {
    it('should create a meter', async () => {
      const meter = await TestFactory.createMeter({
        meterType: MeterType.WATER,
        currentIndex: 100,
      });

      expect(meter.id).toBeDefined();
      expect(meter.meterId).toBeDefined();
      expect(meter.meterType).toBe(MeterType.WATER);
      expect(Number(meter.currentIndex)).toBe(100);
    });

    it('should auto-generate meterId', async () => {
      const meter = await TestFactory.createMeter();
      expect(meter.meterId).toBeDefined();
      expect(typeof meter.meterId).toBe('string');
    });
  });

  describe('Reading Model', () => {
    it('should create a reading and calculate consumption', async () => {
      const meter = await TestFactory.createMeter({ currentIndex: 100 });
      const agent = await TestFactory.createAgent();

      const reading = await Reading.create({
        meterId: meter.id,
        agentId: agent.id,
        previousIndex: 100,
        currentIndex: 150,
        readingDate: new Date(),
      });

      expect(reading.id).toBeDefined();
      expect(Number(reading.consumption)).toBe(50);
    });

    it('should auto-calculate consumption if not provided', async () => {
      const reading = await TestFactory.createReading({
        previousIndex: 200,
        currentIndex: 350,
      });

      expect(Number(reading.consumption)).toBe(150);
    });
  });
});
