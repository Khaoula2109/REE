import sequelize from '../config/database';
import User, { UserRole } from '../models/User';

/**
 * Create initial superadmin user
 */
const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Sync User model
    await User.sync();

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@ree.ma' },
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      process.exit(0);
    }

    // Create admin
    await User.create({
      lastName: 'Admin',
      firstName: 'Super',
      email: 'admin@ree.ma',
      password: 'Admin@123',
      role: UserRole.SUPERADMIN,
      mustChangePassword: false,
    });

    console.log('✅ Superadmin created successfully!');
    console.log('   Email: admin@ree.ma');
    console.log('   Password: Admin@123');
    console.log('   Please change the password after first login.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
