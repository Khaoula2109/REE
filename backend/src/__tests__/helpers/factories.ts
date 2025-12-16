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
import { AddressType } from '../../models/Address';

let counter = 0;

export class TestFactory {
  /**
   * Create a test user
   */
  static async createUser(overrides: Partial<any> = {}) {
    counter++;
    const password = await bcrypt.hash('password123', 10);
    return User.create({
      email: `user${counter}@example.com`,
      password,
      firstName: 'Test',
      lastName: 'USER',
      role: UserRole.USER,
      mustChangePassword: false,
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
    counter++;
    return District.create({
      name: `District ${counter}`,
      code: `DIST${counter}`,
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

    counter++;
    return Agent.create({
      firstName: 'Agent',
      lastName: `TEST${counter}`,
      personalPhone: `+212600${String(counter).padStart(6, '0')}`,
      professionalPhone: `+212601${String(counter).padStart(6, '0')}`,
      districtId,
      ...overrides,
    });
  }

  /**
   * Create a test client
   */
  static async createClient(overrides: Partial<any> = {}) {
    counter++;
    return Client.create({
      clientId: `CL${String(counter).padStart(8, '0')}`,
      firstName: 'Client',
      lastName: `TEST${counter}`,
      email: `client${counter}@example.com`,
      phone: `+212610${String(counter).padStart(6, '0')}`,
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

    counter++;
    return Address.create({
      street: `Test Street ${counter}`,
      number: String(counter),
      floor: '1',
      apartmentNumber: String(counter),
      addressType: AddressType.APARTMENT,
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

    return Meter.create({
      meterType: MeterType.WATER,
      currentIndex: 0,
      addressId,
      ...overrides,
    });
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

    const previousIndex = 100;
    const currentIndex = 150;

    return Reading.create({
      meterId,
      agentId,
      previousIndex,
      currentIndex,
      consumption: currentIndex - previousIndex,
      readingDate: new Date(),
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
