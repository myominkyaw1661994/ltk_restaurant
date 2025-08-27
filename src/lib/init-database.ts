import { testConnection } from './database';
import { syncDatabase, User, Product, Table, Purchase, PurchaseItem } from './models';
import bcrypt from 'bcryptjs';

export const initializeDatabase = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models with database
    await syncDatabase();
    
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