import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface DistrictAttributes {
  id: number;
  name: string;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DistrictCreationAttributes extends Omit<DistrictAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class District extends Model<DistrictAttributes, DistrictCreationAttributes> implements DistrictAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

District.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'districts',
  }
);

export default District;
