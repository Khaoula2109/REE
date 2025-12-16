import sequelize from '../config/database';

// Setup runs before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Sync database (create tables if they don't exist)
  await sequelize.sync({ force: true });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all tables
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true, truncate: true });
  }
});

// Cleanup after all tests
afterAll(async () => {
  await sequelize.close();
});
