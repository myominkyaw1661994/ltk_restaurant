import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface SaleAttributes {
  id: string;
  sale_no: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  customer_name?: string;
  table_number?: string;
  notes?: string;
  user_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface SaleCreationAttributes extends Omit<SaleAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Sale extends Model<SaleAttributes, SaleCreationAttributes> {
  // Remove public class fields to avoid shadowing Sequelize getters/setters
}

Sale.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sale_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    total_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    table_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'sales',
    timestamps: true,
    underscored: true,
  }
);

// Define the hasMany association - will be set up in models/index.ts

export default Sale; 