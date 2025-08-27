import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface SaleAttributes {
  id: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  customer_name?: string;
  table_number?: string;
  notes?: string;
  user_id?: string;
  created_at?: Date;
  updated_at?: Date;
  items?: any[];
}

interface SaleCreationAttributes extends Omit<SaleAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Sale extends Model<SaleAttributes, SaleCreationAttributes> implements SaleAttributes {
  public id!: string;
  public total_amount!: number;
  public status!: 'pending' | 'completed' | 'cancelled';
  public customer_name?: string;
  public table_number?: string;
  public notes?: string;
  public user_id?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Sale.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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

export default Sale; 