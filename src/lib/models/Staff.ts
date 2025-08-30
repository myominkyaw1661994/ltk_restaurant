import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface StaffAttributes {
  id: string;
  name: string;
  address: string;
  phone: string;
  salary: number;
  status: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
}

interface StaffCreationAttributes extends Omit<StaffAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Staff extends Model<StaffAttributes, StaffCreationAttributes> {
  // Remove public class fields to avoid shadowing Sequelize getters/setters
}

Staff.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [7, 20], // Length validation only
      },
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'staff',
    timestamps: true,
    underscored: true,
  }
);

export default Staff;
