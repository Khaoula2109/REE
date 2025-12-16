import Meter, { MeterType } from '../../../models/Meter';
import { TestFactory } from '../../helpers/factories';

describe('Meter Model', () => {
  describe('Creation', () => {
    it('should create a meter with valid data', async () => {
      const address = await TestFactory.createAddress();

      const meter = await Meter.create({
        meterType: MeterType.WATER,
        currentIndex: 100.50,
        installationDate: new Date('2020-01-01'),
        isActive: true,
        addressId: address.id,
      });

      expect(meter.id).toBeDefined();
      expect(meter.meterId).toBeDefined(); // Auto-generated
      expect(meter.meterType).toBe(MeterType.WATER);
      expect(Number(meter.currentIndex)).toBe(100.50);
      expect(meter.isActive).toBe(true);
    });

    it('should auto-generate meterId after creation', async () => {
      const meter = await TestFactory.createMeter();

      expect(meter.meterId).toBeDefined();
      expect(typeof meter.meterId).toBe('string');
      expect(meter.meterId.length).toBeGreaterThan(0);
    });

    it('should create WATER meter', async () => {
      const meter = await TestFactory.createMeter({ meterType: MeterType.WATER });
      expect(meter.meterType).toBe(MeterType.WATER);
    });

    it('should create ELECTRICITY meter', async () => {
      const meter = await TestFactory.createMeter({ meterType: MeterType.ELECTRICITY });
      expect(meter.meterType).toBe(MeterType.ELECTRICITY);
    });

    it('should set default currentIndex to 0', async () => {
      const address = await TestFactory.createAddress();

      const meter = await Meter.create({
        meterType: MeterType.WATER,
        installationDate: new Date(),
        addressId: address.id,
      });

      expect(Number(meter.currentIndex)).toBe(0);
    });

    it('should set default isActive to true', async () => {
      const address = await TestFactory.createAddress();

      const meter = await Meter.create({
        meterType: MeterType.WATER,
        currentIndex: 0,
        installationDate: new Date(),
        addressId: address.id,
      });

      expect(meter.isActive).toBe(true);
    });

    it('should fail to create meter without addressId', async () => {
      await expect(
        Meter.create({
          meterType: MeterType.WATER,
          currentIndex: 100,
          installationDate: new Date(),
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate meterType enum', async () => {
      const address = await TestFactory.createAddress();

      await expect(
        Meter.create({
          meterType: 'INVALID_TYPE' as MeterType,
          currentIndex: 100,
          installationDate: new Date(),
          addressId: address.id,
        })
      ).rejects.toThrow();
    });

    it('should require installationDate', async () => {
      const address = await TestFactory.createAddress();

      await expect(
        Meter.create({
          meterType: MeterType.WATER,
          currentIndex: 100,
          addressId: address.id,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('Update', () => {
    it('should update currentIndex', async () => {
      const meter = await TestFactory.createMeter({ currentIndex: 100 });

      await meter.update({ currentIndex: 200 });
      await meter.reload();

      expect(Number(meter.currentIndex)).toBe(200);
    });

    it('should update lastReadingDate', async () => {
      const meter = await TestFactory.createMeter();
      const newDate = new Date();

      await meter.update({ lastReadingDate: newDate });
      await meter.reload();

      expect(meter.lastReadingDate).toBeDefined();
    });

    it('should deactivate meter', async () => {
      const meter = await TestFactory.createMeter({ isActive: true });

      await meter.update({ isActive: false });
      await meter.reload();

      expect(meter.isActive).toBe(false);
    });
  });

  describe('Associations', () => {
    it('should load address association', async () => {
      const meter = await TestFactory.createMeter();
      const meterWithAddress = await Meter.findByPk(meter.id, {
        include: ['address'],
      });

      expect(meterWithAddress?.address).toBeDefined();
      expect(meterWithAddress?.address?.id).toBe(meter.addressId);
    });

    it('should load readings association', async () => {
      const meter = await TestFactory.createMeter();
      await TestFactory.createReading({ meterId: meter.id });
      await TestFactory.createReading({ meterId: meter.id });

      const meterWithReadings = await Meter.findByPk(meter.id, {
        include: ['readings'],
      });

      expect(meterWithReadings?.readings).toBeDefined();
      expect(meterWithReadings?.readings?.length).toBe(2);
    });
  });

  describe('Query', () => {
    it('should find meters by type', async () => {
      await TestFactory.createMeter({ meterType: MeterType.WATER });
      await TestFactory.createMeter({ meterType: MeterType.WATER });
      await TestFactory.createMeter({ meterType: MeterType.ELECTRICITY });

      const waterMeters = await Meter.findAll({
        where: { meterType: MeterType.WATER },
      });

      expect(waterMeters.length).toBe(2);
    });

    it('should find active meters', async () => {
      await TestFactory.createMeter({ isActive: true });
      await TestFactory.createMeter({ isActive: true });
      await TestFactory.createMeter({ isActive: false });

      const activeMeters = await Meter.findAll({
        where: { isActive: true },
      });

      expect(activeMeters.length).toBe(2);
    });

    it('should find meters by addressId', async () => {
      const address = await TestFactory.createAddress();

      await TestFactory.createMeter({ addressId: address.id });
      await TestFactory.createMeter({ addressId: address.id });

      const meters = await Meter.findAll({
        where: { addressId: address.id },
      });

      expect(meters.length).toBe(2);
    });

    it('should find meter by meterId', async () => {
      const meter = await TestFactory.createMeter();

      const foundMeter = await Meter.findOne({
        where: { meterId: meter.meterId },
      });

      expect(foundMeter).toBeDefined();
      expect(foundMeter?.id).toBe(meter.id);
    });
  });

  describe('Deletion', () => {
    it('should delete a meter', async () => {
      const meter = await TestFactory.createMeter();
      const meterId = meter.id;

      await meter.destroy();

      const deletedMeter = await Meter.findByPk(meterId);
      expect(deletedMeter).toBeNull();
    });
  });
});
