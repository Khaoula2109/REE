import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import District from './District';

export interface AgentAttributes {
  id: number;
  lastName: string;
  firstName: string;
  personalPhone: string;
  professionalPhone?: string;
  districtId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AgentCreationAttributes extends Omit<AgentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  public id!: number;
  public lastName!: string;
  public firstName!: string;
  public personalPhone!: string;
  public professionalPhone?: string;
  public districtId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association
  public readonly district?: District;

  // Get formatted name
  public getFormattedName(): string {
    return `${this.lastName.toUpperCase()} ${this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase()}`;
  }
}

Agent.init(
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
    personalPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    professionalPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    districtId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'districts',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'agents',
  }
);

// Associations
Agent.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
District.hasMany(Agent, { foreignKey: 'districtId', as: 'agents' });

export default Agent;
