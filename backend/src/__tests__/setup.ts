import sequelize from '../config/database';
// Import all models to ensure they're registered with Sequelize
import '../models/User';
import '../models/Agent';
import '../models/District';
import '../models/Client';
import '../models/Address';
import '../models/Meter';
import '../models/Reading';
import '../models/LoginLog';

// Setup runs before all tests
beforeAll(async () => {
  try {
    // Set test environment
    process.env.NODE_ENV = 'test';

    // Test database connection
    await sequelize.authenticate();

    // Disable foreign key checks to allow table drops
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Sync database (create tables if they don't exist)
    await sequelize.sync({ force: true });

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

// Cleanup after each test
afterEach(async () => {
  try {
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear all tables in reverse order
    const tableNames = [
      'readings',
      'meters',
      'addresses',
      'clients',
      'agents',
      'districts',
      'login_logs',
      'users',
    ];

    for (const tableName of tableNames) {
      await sequelize.query(`TRUNCATE TABLE ${tableName}`);
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    // Don't throw - allow tests to continue
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Failed to close database connection:', error);
  }
});
