import sequelize from '../config/database';
import User, { UserRole } from '../models/User';
import District from '../models/District';
import Agent from '../models/Agent';
import Client from '../models/Client';
import Address, { AddressType } from '../models/Address';
import Meter, { MeterType } from '../models/Meter';
import Reading from '../models/Reading';

/**
 * Seed the database with initial data
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Disable foreign key checks to allow dropping tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Sync database (reset all tables)
    await sequelize.sync({ force: true });

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Database tables created');

    // Create Users
    console.log('Creating users...');
    await User.create({
      lastName: 'Admin',
      firstName: 'Super',
      email: 'admin@ree.ma',
      password: 'Admin@123',
      role: UserRole.SUPERADMIN,
      mustChangePassword: false,
    });

    await User.create({
      lastName: 'Bennani',
      firstName: 'Mohammed',
      email: 'mbennani@ree.ma',
      password: 'User@123',
      role: UserRole.USER,
      mustChangePassword: false,
    });

    await User.create({
      lastName: 'El Amrani',
      firstName: 'Fatima',
      email: 'felamrani@ree.ma',
      password: 'User@123',
      role: UserRole.USER,
      mustChangePassword: false,
    });

    console.log('✅ Users created');

    // Create Districts
    console.log('Creating districts...');
    const districts = await District.bulkCreate([
      { name: 'Agdal', code: 'AGD' },
      { name: 'Hassan', code: 'HAS' },
      { name: 'Océan', code: 'OCE' },
      { name: 'Souissi', code: 'SOU' },
      { name: 'Yacoub El Mansour', code: 'YEM' },
    ]);
    console.log('✅ Districts created');

    // Create Agents
    console.log('Creating agents...');
    const agents = await Agent.bulkCreate([
      {
        lastName: 'Alami',
        firstName: 'Ahmed',
        personalPhone: '+212 6 12 34 56 78',
        professionalPhone: '+212 5 37 12 34 56',
        districtId: districts[0].id,
      },
      {
        lastName: 'Idrissi',
        firstName: 'Hassan',
        personalPhone: '+212 6 23 45 67 89',
        professionalPhone: '+212 5 37 23 45 67',
        districtId: districts[0].id,
      },
      {
        lastName: 'Tazi',
        firstName: 'Youssef',
        personalPhone: '+212 6 34 56 78 90',
        professionalPhone: '+212 5 37 34 56 78',
        districtId: districts[1].id,
      },
      {
        lastName: 'Berrada',
        firstName: 'Salma',
        personalPhone: '+212 6 45 67 89 01',
        professionalPhone: '+212 5 37 45 67 89',
        districtId: districts[1].id,
      },
      {
        lastName: 'Fassi',
        firstName: 'Karim',
        personalPhone: '+212 6 56 78 90 12',
        professionalPhone: '+212 5 37 56 78 90',
        districtId: districts[2].id,
      },
      {
        lastName: 'Benjelloun',
        firstName: 'Nadia',
        personalPhone: '+212 6 67 89 01 23',
        professionalPhone: '+212 5 37 67 89 01',
        districtId: districts[3].id,
      },
      {
        lastName: 'Kettani',
        firstName: 'Omar',
        personalPhone: '+212 6 78 90 12 34',
        professionalPhone: '+212 5 37 78 90 12',
        districtId: districts[4].id,
      },
    ]);
    console.log('✅ Agents created');

    // Create Clients
    console.log('Creating clients...');
    const clients = [];
    for (let i = 1; i <= 50; i++) {
      const firstNames = ['Mohammed', 'Fatima', 'Ahmed', 'Khadija', 'Hassan', 'Aisha', 'Youssef', 'Samira', 'Omar', 'Nadia'];
      const lastNames = ['Alami', 'Bennani', 'El Amrani', 'Idrissi', 'Tazi', 'Berrada', 'Fassi', 'Benjelloun', 'Kettani', 'Chraibi'];

      clients.push({
        clientId: `CL${String(i).padStart(6, '0')}`,
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
        phone: `+212 6 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
        email: i % 3 === 0 ? `client${i}@email.ma` : undefined,
      });
    }
    const createdClients = await Client.bulkCreate(clients);
    console.log('✅ Clients created');

    // Create Addresses
    console.log('Creating addresses...');
    const streets = ['Avenue Mohammed V', 'Rue Hassan II', 'Boulevard Allal Ben Abdellah', 'Avenue des FAR', 'Rue Al Amal'];
    const addresses = [];

    for (let i = 0; i < 100; i++) {
      const districtIndex = Math.floor(i / 20);
      addresses.push({
        street: streets[Math.floor(Math.random() * streets.length)],
        number: String(Math.floor(Math.random() * 200) + 1),
        floor: i % 3 === 0 ? String(Math.floor(Math.random() * 5) + 1) : undefined,
        apartmentNumber: i % 3 === 0 ? String(Math.floor(Math.random() * 20) + 1) : undefined,
        addressType: i % 10 === 0 ? AddressType.BUILDING : (i % 2 === 0 ? AddressType.APARTMENT : AddressType.HOUSE),
        districtId: districts[districtIndex].id,
        clientId: createdClients[i % createdClients.length].id,
      });
    }
    const createdAddresses = await Address.bulkCreate(addresses);
    console.log('✅ Addresses created');

    // Create Meters
    console.log('Creating meters...');
    const meters = [];
    for (let i = 0; i < createdAddresses.length; i++) {
      // Create water meter for each address
      meters.push({
        meterType: MeterType.WATER,
        addressId: createdAddresses[i].id,
        currentIndex: Math.floor(Math.random() * 1000) + 100,
        lastReadingDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      });

      // Create electricity meter for 80% of addresses
      if (i % 5 !== 0) {
        meters.push({
          meterType: MeterType.ELECTRICITY,
          addressId: createdAddresses[i].id,
          currentIndex: Math.floor(Math.random() * 5000) + 500,
          lastReadingDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        });
      }
    }
    const createdMeters = await Meter.bulkCreate(meters);
    console.log('✅ Meters created');

    // Create Readings
    console.log('Creating readings...');
    const readings = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    for (const meter of createdMeters) {
      let previousIndex = Math.floor(meter.currentIndex * 0.7);
      const numReadings = Math.floor(Math.random() * 3) + 3; // 3 to 5 readings per meter

      for (let i = 0; i < numReadings; i++) {
        const daysAgo = Math.floor((90 / numReadings) * i);
        const readingDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const consumption = i === 0 ? 0 : Math.floor(Math.random() * 100) + 20;
        const currentIndex = previousIndex + consumption;

        // Get a random agent from the same district as the meter's address
        const meterWithAddress = await Meter.findByPk(meter.id, {
          include: [{ model: Address, as: 'address' }],
        });

        const districtAgents = agents.filter(a => a.districtId === meterWithAddress?.address?.districtId);
        const randomAgent = districtAgents[Math.floor(Math.random() * districtAgents.length)];

        readings.push({
          meterId: meter.id,
          agentId: randomAgent.id,
          previousIndex,
          currentIndex,
          consumption: currentIndex - previousIndex,
          readingDate: readingDate >= threeMonthsAgo ? readingDate : threeMonthsAgo,
        });

        previousIndex = currentIndex;
      }
    }
    await Reading.bulkCreate(readings);
    console.log('✅ Readings created');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${await User.count()}`);
    console.log(`   - Districts: ${await District.count()}`);
    console.log(`   - Agents: ${await Agent.count()}`);
    console.log(`   - Clients: ${await Client.count()}`);
    console.log(`   - Addresses: ${await Address.count()}`);
    console.log(`   - Meters: ${await Meter.count()}`);
    console.log(`   - Readings: ${await Reading.count()}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Superadmin: admin@ree.ma / Admin@123');
    console.log('   User: mbennani@ree.ma / User@123');
    console.log('   User: felamrani@ree.ma / User@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
