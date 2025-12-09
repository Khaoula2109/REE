import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ClientAttributes {
  id: number;
  clientId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClientCreationAttributes extends Omit<ClientAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public id!: number;
  public clientId!: string;
  public firstName!: string;
  public lastName!: string;
  public phone?: string;
  public email?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getFormattedName(): string {
    return `${this.lastName.toUpperCase()} ${this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase()}`;
  }
}

Client.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'clients',
  }
);

export default Client;
