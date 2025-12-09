import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Meter from './Meter';
import Agent from './Agent';

export interface ReadingAttributes {
  id: number;
  meterId: number;
  agentId: number;
  previousIndex: number;
  currentIndex: number;
  consumption: number;
  readingDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReadingCreationAttributes extends Omit<ReadingAttributes, 'id' | 'consumption' | 'createdAt' | 'updatedAt'> {}

class Reading extends Model<ReadingAttributes, ReadingCreationAttributes> implements ReadingAttributes {
  public id!: number;
  public meterId!: number;
  public agentId!: number;
  public previousIndex!: number;
  public currentIndex!: number;
  public consumption!: number;
  public readingDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly meter?: Meter;
  public readonly agent?: Agent;

  // Calculate consumption
  public static calculateConsumption(currentIndex: number, previousIndex: number): number {
    return Math.max(0, currentIndex - previousIndex);
  }
}

Reading.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    meterId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'meters',
        key: 'id',
      },
    },
    agentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'agents',
        key: 'id',
      },
    },
    previousIndex: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currentIndex: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    consumption: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    readingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'readings',
    hooks: {
      beforeCreate: (reading: Reading) => {
        reading.consumption = Reading.calculateConsumption(reading.currentIndex, reading.previousIndex);
      },
      beforeUpdate: (reading: Reading) => {
        if (reading.changed('currentIndex') || reading.changed('previousIndex')) {
          reading.consumption = Reading.calculateConsumption(reading.currentIndex, reading.previousIndex);
        }
      },
    },
  }
);

// Associations
Reading.belongsTo(Meter, { foreignKey: 'meterId', as: 'meter' });
Reading.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });
Meter.hasMany(Reading, { foreignKey: 'meterId', as: 'readings' });
Agent.hasMany(Reading, { foreignKey: 'agentId', as: 'readings' });

export default Reading;
