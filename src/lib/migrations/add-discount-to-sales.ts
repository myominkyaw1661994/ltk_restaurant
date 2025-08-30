import { QueryTypes } from 'sequelize';
import sequelize from '../database';

export const addDiscountToSales = async () => {
  try {
    // Check if discount column already exists
    const tableInfo = await sequelize.query(
      "DESCRIBE sales",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    const columnNames = tableInfo.map(col => col.Field);
    
    // Add discount column if it doesn't exist
    if (!columnNames.includes('discount')) {
      await sequelize.query(
        "ALTER TABLE sales ADD COLUMN discount INT NOT NULL DEFAULT 0 COMMENT 'Discount amount in cents (e.g., 1000 = $10.00)'",
        { type: QueryTypes.RAW }
      );
      console.log('Added discount column to sales table');
    }
    
    console.log('Discount to sales migration completed successfully');
  } catch (error) {
    console.error('Error in discount to sales migration:', error);
    throw error;
  }
};
