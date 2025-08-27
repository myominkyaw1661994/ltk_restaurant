import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface PurchaseItemAttributes {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
  created_at?: Date;
  updated_at?: Date;
}

interface PurchaseItemCreationAttributes extends Omit<PurchaseItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

class PurchaseItem extends Model<PurchaseItemAttributes, PurchaseItemCreationAttributes> implements PurchaseItemAttributes {
  public id!: string;
  public purchase_id!: string;
  public product_id!: string;
  public product_name!: string;
  public price!: number;
  public quantity!: number;
  public total!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PurchaseItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    purchase_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'purchases',
        key: 'id',
      },
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    product_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    tableName: 'purchase_items',
    timestamps: true,
    underscored: true,
  }
);

export default PurchaseItem; 