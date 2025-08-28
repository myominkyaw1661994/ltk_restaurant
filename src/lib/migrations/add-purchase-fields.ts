import { QueryTypes } from 'sequelize';
import sequelize from '../database';

export const addPurchaseFields = async () => {
  try {
    // Check if columns already exist
    const tableInfo = await sequelize.query(
      "DESCRIBE purchases",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    const columnNames = tableInfo.map(col => col.Field);
    
    // Add name column if it doesn't exist
    if (!columnNames.includes('name')) {
      await sequelize.query(
        "ALTER TABLE purchases ADD COLUMN name VARCHAR(255)",
        { type: QueryTypes.RAW }
      );
      console.log('Added name column to purchases table');
    }
    
    // Add description column if it doesn't exist
    if (!columnNames.includes('description')) {
      await sequelize.query(
        "ALTER TABLE purchases ADD COLUMN description TEXT",
        { type: QueryTypes.RAW }
      );
      console.log('Added description column to purchases table');
    }
    
    console.log('Purchase fields migration completed successfully');
  } catch (error) {
    console.error('Error in purchase fields migration:', error);
    throw error;
  }
};
