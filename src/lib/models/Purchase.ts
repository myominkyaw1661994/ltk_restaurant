import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface PurchaseAttributes {
  id: string;
  name?: string;
  description?: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  supplier_name?: string;
  purchase_date?: Date;
  notes?: string;
  user_id?: string;
  created_at?: Date;
  updated_at?: Date;
  items?: any[];
  user?: any;
}

interface PurchaseCreationAttributes extends Omit<PurchaseAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Purchase extends Model<PurchaseAttributes, PurchaseCreationAttributes> implements PurchaseAttributes {
  public id!: string;
  public name?: string;
  public description?: string;
  public total_amount!: number;
  public status!: 'pending' | 'completed' | 'cancelled';
  public supplier_name?: string;
  public purchase_date?: Date;
  public notes?: string;
  public user_id?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public items?: any[];
  public user?: any;
}

Purchase.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    supplier_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
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
    tableName: 'purchases',
    timestamps: true,
    underscored: true,
  }
);

export default Purchase; 