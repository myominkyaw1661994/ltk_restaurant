import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // Create staff table
  await queryInterface.createTable('staff', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create salary_payments table
  await queryInterface.createTable('salary_payments', {
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
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add unique index for staff_id, month, year combination
  await queryInterface.addIndex('salary_payments', ['staff_id', 'month', 'year'], {
    unique: true,
    name: 'unique_staff_month_year'
  });

  // Add indexes for better performance
  await queryInterface.addIndex('staff', ['status']);
  await queryInterface.addIndex('staff', ['phone']);
  await queryInterface.addIndex('salary_payments', ['payment_date']);
  await queryInterface.addIndex('salary_payments', ['month', 'year']);
}

export async function down(queryInterface: QueryInterface) {
  // Drop salary_payments table first (due to foreign key constraints)
  await queryInterface.dropTable('salary_payments');
  
  // Drop staff table
  await queryInterface.dropTable('staff');
}
