import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface TableAttributes {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  created_at?: Date;
  updated_at?: Date;
}

interface TableCreationAttributes extends Omit<TableAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Table extends Model<TableAttributes, TableCreationAttributes> implements TableAttributes {
  public id!: string;
  public name!: string;
  public status!: 'available' | 'occupied' | 'reserved';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Table.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved'),
      allowNull: false,
      defaultValue: 'available',
    },
  },
  {
    sequelize,
    tableName: 'tables',
    timestamps: true,
    underscored: true,
  }
);

export default Table; 