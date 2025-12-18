import sequelize from '../config/database';

/**
 * Check database connectivity
 * This script verifies that the application can connect to the database
 */
const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database connection...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'ree_meter_reading'}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log('');

    // Attempt to authenticate
    await sequelize.authenticate();

    console.log('✅ Database connection successful!');
    console.log('');
    console.log('Database information:');

    // Get database version
    const [results] = await sequelize.query('SELECT VERSION() as version');
    const version = (results[0] as any).version;
    console.log(`   MySQL Version: ${version}`);

    // Get current database
    const [dbResults] = await sequelize.query('SELECT DATABASE() as db');
    const currentDb = (dbResults[0] as any).db;
    console.log(`   Current Database: ${currentDb || 'None selected'}`);

    // Check if tables exist
    const [tables] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = '${process.env.DB_NAME || 'ree_meter_reading'}'
    `);
    const tableCount = (tables[0] as any).count;
    console.log(`   Tables: ${tableCount}`);

    if (tableCount === 0) {
      console.log('');
      console.log('⚠️  No tables found. Run the seed script to initialize the database:');
      console.log('   npm run db:seed:init');
    } else {
      console.log('');
      console.log('ℹ️  Database appears to be initialized.');
      console.log('   To reseed the database (⚠️  destroys all data):');
      console.log('   npm run db:seed:init');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('Error details:');
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}`);
    console.error('');

    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('💡 Troubleshooting:');
      console.error('   1. Ensure MySQL is running');
      console.error('      - Linux: sudo systemctl status mysql');
      console.error('      - macOS: brew services list');
      console.error('      - Windows: services.msc (check MySQL80)');
      console.error('      - Docker: docker-compose ps');
      console.error('');
      console.error('   2. Check your .env file database configuration:');
      console.error('      - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD');
      console.error('');
      console.error('   3. If using Docker Compose, start services:');
      console.error('      - docker-compose up -d');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('💡 Troubleshooting:');
      console.error('   1. Check your database credentials in .env file');
      console.error('   2. Verify the user has access:');
      console.error(`      mysql -u ${process.env.DB_USER || 'root'} -p -e "SHOW GRANTS;"`);
    } else if (error.original?.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Troubleshooting:');
      console.error('   1. Create the database:');
      console.error(`      mysql -u root -p -e "CREATE DATABASE ${process.env.DB_NAME || 'ree_meter_reading'};"`);
      console.error('');
      console.error('   2. Or let Docker Compose create it:');
      console.error('      docker-compose up -d mysql');
    }

    process.exit(1);
  }
};

// Run check
checkDatabase();
