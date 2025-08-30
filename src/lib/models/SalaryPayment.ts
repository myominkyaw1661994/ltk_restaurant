import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface SalaryPaymentAttributes {
  id: string;
  staff_id: string;
  amount: number;
  payment_date: Date;
  purchase_id: string;
  month: number; // 1-12
  year: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface SalaryPaymentCreationAttributes extends Omit<SalaryPaymentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class SalaryPayment extends Model<SalaryPaymentAttributes, SalaryPaymentCreationAttributes> {
  // Remove public class fields to avoid shadowing Sequelize getters/setters
}

SalaryPayment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    staff_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'staff',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    purchase_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'purchases',
        key: 'id',
      },
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2030,
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'completed',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'salary_payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['staff_id', 'month', 'year'],
        name: 'unique_staff_month_year'
      }
    ]
  }
);

export default SalaryPayment;
