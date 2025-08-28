// src/lib/foreign-key-validator.ts
import { User } from './models';

export const validateForeignKeyConstraints = async () => {
  try {
    console.log('Validating foreign key constraints...');
    
    // Check if default admin user exists
    const adminUser = await User.findOne({ 
      where: { email: 'admin@restaurant.com' } 
    });
    
    if (!adminUser) {
      console.log('Default admin user not found, creating...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdminUser = await User.create({
        username: 'admin',
        email: 'admin@restaurant.com',
        password: hashedPassword,
        role: 'Admin',
      });
      console.log(`Default admin user created successfully with ID: ${newAdminUser.id}`);
    } else {
      console.log(`Default admin user already exists with ID: ${adminUser.id}`);
    }
    
    console.log('Foreign key constraint validation completed successfully');
  } catch (error) {
    console.error('Error validating foreign key constraints:', error);
    throw error;
  }
};