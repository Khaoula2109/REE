// Script de seed temporaire pour initialiser la base de données
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ree_meter_reading',
  process.env.DB_USER || 'ree_user',
  process.env.DB_PASSWORD || 'ree_password',
  {
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false
  }
);

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Hash passwords
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const userPass = await bcrypt.hash('User@123', 10);

    // Create users
    console.log('Creating users...');
    await sequelize.query(`
      INSERT INTO users (last_name, first_name, email, password, role, must_change_password, created_at, updated_at)
      VALUES
        ('Admin', 'Super', 'admin@ree.ma', ?, 'SUPERADMIN', false, NOW(), NOW()),
        ('Bennani', 'Mohammed', 'mbennani@ree.ma', ?, 'USER', false, NOW(), NOW()),
        ('El Amrani', 'Fatima', 'felamrani@ree.ma', ?, 'USER', false, NOW(), NOW())
      ON DUPLICATE KEY UPDATE email=email
    `, { replacements: [adminPass, userPass, userPass] });
    console.log('✅ Users created');

    // Create districts
    console.log('Creating districts...');
    await sequelize.query(`
      INSERT INTO districts (name, code, created_at, updated_at)
      VALUES
        ('Agdal', 'AGD', NOW(), NOW()),
        ('Hassan', 'HSN', NOW(), NOW()),
        ('Souissi', 'SOU', NOW(), NOW()),
        ('Hay Riad', 'RYD', NOW(), NOW()),
        ('Ocean', 'OCN', NOW(), NOW())
      ON DUPLICATE KEY UPDATE code=code
    `);
    console.log('✅ Districts created');

    // Get district IDs
    const [districts] = await sequelize.query('SELECT id FROM districts LIMIT 5');

    // Create agents
    console.log('Creating agents...');
    for (let i = 0; i < 10; i++) {
      const districtId = districts[i % districts.length].id;
      await sequelize.query(`
        INSERT INTO agents (last_name, first_name, personal_phone, professional_phone, district_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          `Agent${i + 1}`,
          `Prénom${i + 1}`,
          `06${String(i).padStart(8, '0')}`,
          `05${String(i).padStart(8, '0')}`,
          districtId
        ]
      });
    }
    console.log('✅ Agents created');

    // Create clients
    console.log('Creating clients...');
    for (let i = 0; i < 50; i++) {
      await sequelize.query(`
        INSERT INTO clients (client_id, first_name, last_name, phone, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          `CLT${String(i + 1).padStart(6, '0')}`,
          `Client${i + 1}`,
          `Nom${i + 1}`,
          `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          i % 3 === 0 ? `client${i + 1}@example.com` : null
        ]
      });
    }
    console.log('✅ Clients created');

    // Get client IDs
    const [clients] = await sequelize.query('SELECT id FROM clients LIMIT 50');

    // Create addresses
    console.log('Creating addresses...');
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const districtId = districts[i % districts.length].id;
      await sequelize.query(`
        INSERT INTO addresses (street, number, floor, apartment_number, address_type, district_id, client_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          `Rue ${i + 1}`,
          String(Math.floor(Math.random() * 200) + 1),
          i % 5 === 0 ? String(Math.floor(Math.random() * 10) + 1) : null,
          i % 3 === 0 ? String(Math.floor(Math.random() * 20) + 1) : null,
          ['APARTMENT', 'HOUSE', 'BUILDING'][i % 3],
          districtId,
          client.id
        ]
      });
    }
    console.log('✅ Addresses created');

    // Get address IDs
    const [addresses] = await sequelize.query('SELECT id FROM addresses');

    // Create meters
    console.log('Creating meters...');
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const meterType = ['WATER', 'ELECTRICITY'][i % 2];
      await sequelize.query(`
        INSERT INTO meters (meter_id, meter_type, address_id, current_index, last_reading_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          `${meterType.charAt(0)}${String(i + 1).padStart(8, '0')}`,
          meterType,
          address.id,
          Math.floor(Math.random() * 10000),
          new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        ]
      });
    }
    console.log('✅ Meters created');

    // Get meter and agent IDs
    const [meters] = await sequelize.query('SELECT id, current_index FROM meters');
    const [agents] = await sequelize.query('SELECT id FROM agents');

    // Create readings
    console.log('Creating readings...');
    for (let i = 0; i < Math.min(meters.length, 100); i++) {
      const meter = meters[i];
      const agent = agents[i % agents.length];
      const previousIndex = meter.current_index;
      const currentIndex = previousIndex + Math.floor(Math.random() * 1000) + 100;

      await sequelize.query(`
        INSERT INTO readings (meter_id, agent_id, previous_index, current_index, consumption, reading_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          meter.id,
          agent.id,
          previousIndex,
          currentIndex,
          currentIndex - previousIndex,
          new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
        ]
      });
    }
    console.log('✅ Readings created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@ree.ma');
    console.log('   Password: Admin@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
