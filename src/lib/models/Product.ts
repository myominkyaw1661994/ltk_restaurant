import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface ProductAttributes {
  id: string;
  product_name: string;
  price: number;
  category: string;
  type: 'sale' | 'purchase';
  created_at?: Date;
  updated_at?: Date;
}

interface ProductCreationAttributes extends Omit<ProductAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public product_name!: string;
  public price!: number;
  public category!: string;
  public type!: 'sale' | 'purchase';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('sale', 'purchase'),
      allowNull: false,
      defaultValue: 'sale',
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
  }
);

export default Product; 