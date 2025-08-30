import { testConnection } from './database';
import { syncDatabase, User, Product, Table, Purchase, PurchaseItem } from './models';
import { addPurchaseFields, addSaleNo } from './migrations';
import { validateForeignKeyConstraints } from './foreign-key-validator';
import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import sequelize from './database';

const createStaffTables = async () => {
  try {
    // Check if staff table exists
    const tables = await sequelize.query(
      "SHOW TABLES LIKE 'staff'",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    if (tables.length === 0) {
      // Create staff table
      await sequelize.query(`
        CREATE TABLE staff (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          name VARCHAR(100) NOT NULL,
          address TEXT NOT NULL,
          phone VARCHAR(20) NOT NULL UNIQUE,
          salary DECIMAL(10,2) NOT NULL,
          status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `, { type: QueryTypes.RAW });
      console.log('Staff table created');
    }
    
    // Check if salary_payments table exists
    const salaryTables = await sequelize.query(
      "SHOW TABLES LIKE 'salary_payments'",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    if (salaryTables.length === 0) {
      // Create salary_payments table
      await sequelize.query(`
        CREATE TABLE salary_payments (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          staff_id VARCHAR(36) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          purchase_id VARCHAR(36) NOT NULL,
          month INT NOT NULL,
          year INT NOT NULL,
          status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'completed',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE ON UPDATE CASCADE,
          UNIQUE KEY unique_staff_month_year (staff_id, month, year)
        )
      `, { type: QueryTypes.RAW });
      console.log('Salary payments table created');
    }
    
    console.log('Staff tables migration completed successfully');
  } catch (error) {
    console.error('Error creating staff tables:', error);
    throw error;
  }
};

export const initializeDatabase = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models with database
    await syncDatabase();
    
    // Run migrations
    await addPurchaseFields();
    await addSaleNo();
    
    // Create staff tables if they don't exist
    await createStaffTables();
    
    // Validate and fix foreign key constraints
    await validateForeignKeyConstraints();
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ where: { email: 'admin@restaurant.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@restaurant.com',
        password: hashedPassword,
        role: 'Admin',
      });
      console.log('Default admin user created');
    }
    
    // Create some sample tables if they don't exist
    const tableCount = await Table.count();
    if (tableCount === 0) {
      const sampleTables = [
        { name: 'Table 1', status: 'available' as const },
        { name: 'Table 2', status: 'available' as const },
        { name: 'Table 3', status: 'available' as const },
        { name: 'VIP 1', status: 'available' as const },
        { name: 'VIP 2', status: 'available' as const },
      ];
      
      await Table.bulkCreate(sampleTables);
      console.log('Sample tables created');
    }
    
    // Create some sample products if they don't exist
    const productCount = await Product.count();
    if (productCount === 0) {
      const sampleProducts = [
        { product_name: 'Chicken Curry', price: 8000, category: 'main-course', type: 'sale' as const },
        { product_name: 'Beef Steak', price: 12000, category: 'main-course', type: 'sale' as const },
        { product_name: 'Fried Rice', price: 5000, category: 'main-course', type: 'sale' as const },
        { product_name: 'Coca Cola', price: 1000, category: 'beverage', type: 'sale' as const },
        { product_name: 'Ice Cream', price: 2000, category: 'dessert', type: 'sale' as const },
        // Purchase products
        { product_name: 'Chicken Meat', price: 6000, category: 'ingredient', type: 'purchase' as const },
        { product_name: 'Beef Meat', price: 8000, category: 'ingredient', type: 'purchase' as const },
        { product_name: 'Rice', price: 2000, category: 'ingredient', type: 'purchase' as const },
        { product_name: 'Vegetables', price: 1500, category: 'ingredient', type: 'purchase' as const },
        { product_name: 'Cooking Oil', price: 3000, category: 'ingredient', type: 'purchase' as const },
      ];
      
      await Product.bulkCreate(sampleProducts);
      console.log('Sample products created');
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}; 