import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import Agent from '../../models/Agent';
import District from '../../models/District';
import Client from '../../models/Client';
import Address from '../../models/Address';
import Meter from '../../models/Meter';
import Reading from '../../models/Reading';
import { UserRole } from '../../models/User';
import { MeterType } from '../../models/Meter';

export class TestFactory {
  /**
   * Create a test user
   */
  static async createUser(overrides: Partial<any> = {}) {
    const password = await bcrypt.hash('password123', 10);
    return User.create({
      email: faker.internet.email(),
      password,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName().toUpperCase(),
      role: UserRole.USER,
      isActive: true,
      ...overrides,
    });
  }

  /**
   * Create a super admin user
   */
  static async createSuperAdmin(overrides: Partial<any> = {}) {
    return this.createUser({
      role: UserRole.SUPERADMIN,
      ...overrides,
    });
  }

  /**
   * Create a test district
   */
  static async createDistrict(overrides: Partial<any> = {}) {
    return District.create({
      name: faker.location.city(),
      code: faker.string.alphanumeric(5).toUpperCase(),
      ...overrides,
    });
  }

  /**
   * Create a test agent
   */
  static async createAgent(overrides: Partial<any> = {}) {
    let districtId = overrides.districtId;

    if (!districtId) {
      const district = await this.createDistrict();
      districtId = district.id;
    }

    return Agent.create({
      agentId: faker.string.alphanumeric(8).toUpperCase(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName().toUpperCase(),
      email: faker.internet.email(),
      phone: faker.phone.number('+212 6## ## ## ##'),
      districtId,
      isActive: true,
      ...overrides,
    });
  }

  /**
   * Create a test client
   */
  static async createClient(overrides: Partial<any> = {}) {
    return Client.create({
      clientId: faker.string.alphanumeric(10).toUpperCase(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName().toUpperCase(),
      email: faker.internet.email(),
      phone: faker.phone.number('+212 6## ## ## ##'),
      ...overrides,
    });
  }

  /**
   * Create a test address
   */
  static async createAddress(overrides: Partial<any> = {}) {
    let clientId = overrides.clientId;
    let districtId = overrides.districtId;

    if (!clientId) {
      const client = await this.createClient();
      clientId = client.id;
    }

    if (!districtId) {
      const district = await this.createDistrict();
      districtId = district.id;
    }

    return Address.create({
      street: faker.location.street(),
      number: faker.number.int({ min: 1, max: 999 }).toString(),
      floor: faker.number.int({ min: 1, max: 10 }).toString(),
      apartmentNumber: faker.number.int({ min: 1, max: 50 }).toString(),
      clientId,
      districtId,
      ...overrides,
    });
  }

  /**
   * Create a test meter
   */
  static async createMeter(overrides: Partial<any> = {}) {
    let addressId = overrides.addressId;

    if (!addressId) {
      const address = await this.createAddress();
      addressId = address.id;
    }

    const meter = await Meter.create({
      meterType: MeterType.WATER,
      currentIndex: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
      installationDate: faker.date.past({ years: 5 }),
      isActive: true,
      addressId,
      ...overrides,
    });

    return meter;
  }

  /**
   * Create a test reading
   */
  static async createReading(overrides: Partial<any> = {}) {
    let meterId = overrides.meterId;
    let agentId = overrides.agentId;

    if (!meterId) {
      const meter = await this.createMeter();
      meterId = meter.id;
    }

    if (!agentId) {
      const agent = await this.createAgent();
      agentId = agent.id;
    }

    const previousIndex = faker.number.float({ min: 0, max: 5000, fractionDigits: 2 });
    const currentIndex = faker.number.float({
      min: previousIndex,
      max: previousIndex + 1000,
      fractionDigits: 2
    });

    return Reading.create({
      meterId,
      agentId,
      previousIndex,
      currentIndex,
      consumption: currentIndex - previousIndex,
      readingDate: faker.date.recent({ days: 30 }),
      ...overrides,
    });
  }

  /**
   * Create multiple entities
   */
  static async createMany<T>(
    count: number,
    factory: () => Promise<T>
  ): Promise<T[]> {
    const promises = Array.from({ length: count }, () => factory());
    return Promise.all(promises);
  }
}
