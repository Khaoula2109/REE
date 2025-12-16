import Reading from '../../../models/Reading';
import { TestFactory } from '../../helpers/factories';

describe('Reading Model', () => {
  describe('Creation', () => {
    it('should create a reading with valid data', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      const reading = await Reading.create({
        meterId: meter.id,
        agentId: agent.id,
        previousIndex: 100.00,
        currentIndex: 150.00,
        readingDate: new Date(),
      });

      expect(reading.id).toBeDefined();
      expect(reading.meterId).toBe(meter.id);
      expect(reading.agentId).toBe(agent.id);
      expect(Number(reading.previousIndex)).toBe(100.00);
      expect(Number(reading.currentIndex)).toBe(150.00);
      expect(Number(reading.consumption)).toBe(50.00);
    });

    it('should auto-calculate consumption using beforeValidate hook', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      const reading = await Reading.create({
        meterId: meter.id,
        agentId: agent.id,
        previousIndex: 200.50,
        currentIndex: 350.75,
        readingDate: new Date(),
      });

      expect(Number(reading.consumption)).toBe(150.25);
    });

    it('should allow manual consumption value', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      const reading = await Reading.create({
        meterId: meter.id,
        agentId: agent.id,
        previousIndex: 100,
        currentIndex: 150,
        consumption: 50,
        readingDate: new Date(),
      });

      expect(Number(reading.consumption)).toBe(50);
    });

    it('should calculate zero consumption for same index', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      const reading = await Reading.create({
        meterId: meter.id,
        agentId: agent.id,
        previousIndex: 100,
        currentIndex: 100,
        readingDate: new Date(),
      });

      expect(Number(reading.consumption)).toBe(0);
    });

    it('should fail to create reading without meterId', async () => {
      const agent = await TestFactory.createAgent();

      await expect(
        Reading.create({
          agentId: agent.id,
          previousIndex: 100,
          currentIndex: 150,
          readingDate: new Date(),
        } as any)
      ).rejects.toThrow();
    });

    it('should fail to create reading without agentId', async () => {
      const meter = await TestFactory.createMeter();

      await expect(
        Reading.create({
          meterId: meter.id,
          previousIndex: 100,
          currentIndex: 150,
          readingDate: new Date(),
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('calculateConsumption static method', () => {
    it('should calculate positive consumption', () => {
      const consumption = Reading.calculateConsumption(150, 100);
      expect(consumption).toBe(50);
    });

    it('should calculate zero consumption', () => {
      const consumption = Reading.calculateConsumption(100, 100);
      expect(consumption).toBe(0);
    });

    it('should return zero for negative consumption (meter rollback)', () => {
      const consumption = Reading.calculateConsumption(50, 100);
      expect(consumption).toBe(0);
    });

    it('should handle decimal values', () => {
      const consumption = Reading.calculateConsumption(150.75, 100.25);
      expect(consumption).toBe(50.5);
    });
  });

  describe('Update', () => {
    it('should recalculate consumption when currentIndex changes', async () => {
      const reading = await TestFactory.createReading({
        previousIndex: 100,
        currentIndex: 150,
      });

      expect(Number(reading.consumption)).toBe(50);

      await reading.update({ currentIndex: 200 });
      await reading.reload();

      expect(Number(reading.currentIndex)).toBe(200);
      expect(Number(reading.consumption)).toBe(100);
    });

    it('should recalculate consumption when previousIndex changes', async () => {
      const reading = await TestFactory.createReading({
        previousIndex: 100,
        currentIndex: 150,
      });

      await reading.update({ previousIndex: 120 });
      await reading.reload();

      expect(Number(reading.previousIndex)).toBe(120);
      expect(Number(reading.consumption)).toBe(30);
    });

    it('should not recalculate consumption when other fields change', async () => {
      const reading = await TestFactory.createReading({
        previousIndex: 100,
        currentIndex: 150,
      });

      const originalConsumption = Number(reading.consumption);
      const newDate = new Date();

      await reading.update({ readingDate: newDate });
      await reading.reload();

      expect(Number(reading.consumption)).toBe(originalConsumption);
    });
  });

  describe('Associations', () => {
    it('should load meter association', async () => {
      const reading = await TestFactory.createReading();
      const readingWithMeter = await Reading.findByPk(reading.id, {
        include: ['meter'],
      });

      expect(readingWithMeter?.meter).toBeDefined();
      expect(readingWithMeter?.meter?.id).toBe(reading.meterId);
    });

    it('should load agent association', async () => {
      const reading = await TestFactory.createReading();
      const readingWithAgent = await Reading.findByPk(reading.id, {
        include: ['agent'],
      });

      expect(readingWithAgent?.agent).toBeDefined();
      expect(readingWithAgent?.agent?.id).toBe(reading.agentId);
    });
  });

  describe('Query', () => {
    it('should find readings by meterId', async () => {
      const meter = await TestFactory.createMeter();
      const agent = await TestFactory.createAgent();

      await TestFactory.createReading({ meterId: meter.id, agentId: agent.id });
      await TestFactory.createReading({ meterId: meter.id, agentId: agent.id });

      const readings = await Reading.findAll({ where: { meterId: meter.id } });

      expect(readings.length).toBe(2);
    });

    it('should find readings by agentId', async () => {
      const agent = await TestFactory.createAgent();

      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });
      await TestFactory.createReading({ agentId: agent.id });

      const readings = await Reading.findAll({ where: { agentId: agent.id } });

      expect(readings.length).toBe(3);
    });

    it('should find readings by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await TestFactory.createReading({ readingDate: today });
      await TestFactory.createReading({ readingDate: yesterday });

      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const todayReadings = await Reading.findAll({
        where: {
          readingDate: {
            $between: [startOfToday, endOfToday],
          } as any,
        },
      });

      expect(todayReadings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Deletion', () => {
    it('should delete a reading', async () => {
      const reading = await TestFactory.createReading();
      const readingId = reading.id;

      await reading.destroy();

      const deletedReading = await Reading.findByPk(readingId);
      expect(deletedReading).toBeNull();
    });
  });
});
