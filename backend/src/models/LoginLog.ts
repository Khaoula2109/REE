import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface LoginLogAttributes {
  id: number;
  userId?: number;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  createdAt?: Date;
}

export interface LoginLogCreationAttributes extends Omit<LoginLogAttributes, 'id' | 'createdAt'> {}

class LoginLog extends Model<LoginLogAttributes, LoginLogCreationAttributes> implements LoginLogAttributes {
  public id!: number;
  public userId?: number;
  public email!: string;
  public ipAddress?: string;
  public userAgent?: string;
  public success!: boolean;
  public failureReason?: string;
  public readonly createdAt!: Date;

  // Association
  public readonly user?: User;
}

LoginLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    failureReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'login_logs',
    updatedAt: false, // We don't need updatedAt for logs
  }
);

// Associations
LoginLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default LoginLog;
