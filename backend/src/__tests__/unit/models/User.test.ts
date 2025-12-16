import User, { UserRole } from '../../../models/User';
import { TestFactory } from '../../helpers/factories';

describe('User Model', () => {
  describe('Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Mohamed',
        lastName: 'ALAOUI',
        role: UserRole.USER,
        isActive: true,
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
    });

    it('should fail to create user without email', async () => {
      await expect(
        User.create({
          password: 'password123',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        } as any)
      ).rejects.toThrow();
    });

    it('should fail to create user with duplicate email', async () => {
      await TestFactory.createUser({ email: 'duplicate@example.com' });

      await expect(
        TestFactory.createUser({ email: 'duplicate@example.com' })
      ).rejects.toThrow();
    });

    it('should create user with default role USER', async () => {
      const user = await User.create({
        email: 'default@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'USER',
      });

      expect(user.role).toBe(UserRole.USER);
    });

    it('should create user with default isActive true', async () => {
      const user = await User.create({
        email: 'active@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'USER',
        role: UserRole.USER,
      });

      expect(user.isActive).toBe(true);
    });
  });

  describe('Roles', () => {
    it('should create a SUPERADMIN user', async () => {
      const superadmin = await TestFactory.createSuperAdmin();
      expect(superadmin.role).toBe(UserRole.SUPERADMIN);
    });

    it('should create a USER role user', async () => {
      const user = await TestFactory.createUser({ role: UserRole.USER });
      expect(user.role).toBe(UserRole.USER);
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      await expect(
        User.create({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        })
      ).rejects.toThrow();
    });

    it('should require password', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'USER',
          role: UserRole.USER,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('Update', () => {
    it('should update user data', async () => {
      const user = await TestFactory.createUser();
      const newEmail = 'newemail@example.com';

      await user.update({ email: newEmail });
      await user.reload();

      expect(user.email).toBe(newEmail);
    });

    it('should update user role', async () => {
      const user = await TestFactory.createUser({ role: UserRole.USER });

      await user.update({ role: UserRole.SUPERADMIN });
      await user.reload();

      expect(user.role).toBe(UserRole.SUPERADMIN);
    });

    it('should deactivate user', async () => {
      const user = await TestFactory.createUser({ isActive: true });

      await user.update({ isActive: false });
      await user.reload();

      expect(user.isActive).toBe(false);
    });
  });

  describe('Deletion', () => {
    it('should delete a user', async () => {
      const user = await TestFactory.createUser();
      const userId = user.id;

      await user.destroy();

      const deletedUser = await User.findByPk(userId);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Query', () => {
    it('should find user by email', async () => {
      const email = 'findme@example.com';
      await TestFactory.createUser({ email });

      const user = await User.findOne({ where: { email } });

      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
    });

    it('should find all active users', async () => {
      await TestFactory.createUser({ isActive: true });
      await TestFactory.createUser({ isActive: true });
      await TestFactory.createUser({ isActive: false });

      const activeUsers = await User.findAll({ where: { isActive: true } });

      expect(activeUsers.length).toBe(2);
    });

    it('should find users by role', async () => {
      await TestFactory.createSuperAdmin();
      await TestFactory.createUser({ role: UserRole.USER });
      await TestFactory.createUser({ role: UserRole.USER });

      const regularUsers = await User.findAll({ where: { role: UserRole.USER } });

      expect(regularUsers.length).toBe(2);
    });
  });
});
