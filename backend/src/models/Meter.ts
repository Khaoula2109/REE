import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Address from './Address';

export enum MeterType {
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY',
}

export interface MeterAttributes {
  id: number;
  meterId: string;
  meterType: MeterType;
  addressId: number;
  currentIndex: number;
  lastReadingDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MeterCreationAttributes extends Omit<MeterAttributes, 'id' | 'meterId' | 'createdAt' | 'updatedAt'> {
  meterId?: string;
}

class Meter extends Model<MeterAttributes, MeterCreationAttributes> implements MeterAttributes {
  public id!: number;
  public meterId!: string;
  public meterType!: MeterType;
  public addressId!: number;
  public currentIndex!: number;
  public lastReadingDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association
  public readonly address?: Address;

  // Generate meter ID (9 digits with leading zeros)
  public static generateMeterId(id: number): string {
    return id.toString().padStart(9, '0');
  }
}

Meter.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    meterId: {
      type: DataTypes.STRING(9),
      allowNull: true,
      unique: true,
    },
    meterType: {
      type: DataTypes.ENUM(...Object.values(MeterType)),
      allowNull: false,
    },
    addressId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'addresses',
        key: 'id',
      },
    },
    currentIndex: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lastReadingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'meters',
    hooks: {
      afterCreate: async (meter: Meter) => {
        if (!meter.meterId) {
          // Generate meterId based on the auto-incremented id
          const generatedMeterId = Meter.generateMeterId(meter.id);
          await meter.update({ meterId: generatedMeterId }, { hooks: false });
        }
      },
    },
  }
);

// Associations
Meter.belongsTo(Address, { foreignKey: 'addressId', as: 'address' });
Address.hasMany(Meter, { foreignKey: 'addressId', as: 'meters' });

export default Meter;
