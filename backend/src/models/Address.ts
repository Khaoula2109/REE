import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import District from './District';
import Client from './Client';

export enum AddressType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  BUILDING = 'BUILDING',
}

export interface AddressAttributes {
  id: number;
  street: string;
  number: string;
  floor?: string;
  apartmentNumber?: string;
  addressType: AddressType;
  districtId: number;
  clientId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddressCreationAttributes extends Omit<AddressAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  public id!: number;
  public street!: string;
  public number!: string;
  public floor?: string;
  public apartmentNumber?: string;
  public addressType!: AddressType;
  public districtId!: number;
  public clientId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly district?: District;
  public readonly client?: Client;
  public readonly meters?: any[];

  // Get full address string
  public getFullAddress(): string {
    let address = `${this.number} ${this.street}`;
    if (this.floor) address += `, Étage ${this.floor}`;
    if (this.apartmentNumber) address += `, Apt ${this.apartmentNumber}`;
    return address;
  }
}

Address.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    floor: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    apartmentNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    addressType: {
      type: DataTypes.ENUM(...Object.values(AddressType)),
      allowNull: false,
      defaultValue: AddressType.APARTMENT,
    },
    districtId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'districts',
        key: 'id',
      },
    },
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'addresses',
  }
);

// Associations
Address.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
Address.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
District.hasMany(Address, { foreignKey: 'districtId', as: 'addresses' });
Client.hasMany(Address, { foreignKey: 'clientId', as: 'addresses' });

export default Address;
