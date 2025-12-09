import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  USER = 'USER',
}

export interface UserAttributes {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  password: string;
  role: UserRole;
  mustChangePassword: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public lastName!: string;
  public firstName!: string;
  public email!: string;
  public password!: string;
  public role!: UserRole;
  public mustChangePassword!: boolean;
  public lastLogin?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to check password
  public async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Hook to hash password before saving
  public static async hashPassword(user: User): Promise<void> {
    if (user.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  }

  // Method to get full name formatted
  public getFormattedName(): string {
    return `${this.lastName.toUpperCase()} ${this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase()}`;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('lastName');
        return rawValue ? rawValue.toUpperCase() : rawValue;
      },
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('firstName');
        return rawValue ? rawValue.charAt(0).toUpperCase() + rawValue.slice(1).toLowerCase() : rawValue;
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.USER,
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    hooks: {
      beforeCreate: User.hashPassword,
      beforeUpdate: User.hashPassword,
    },
  }
);

export default User;
