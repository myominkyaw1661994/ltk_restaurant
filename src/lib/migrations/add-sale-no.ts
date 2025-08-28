import { QueryTypes } from 'sequelize';
import sequelize from '../database';

export const addSaleNo = async () => {
  try {
    console.log('Starting sale_no migration...');
    
    // Check if sale_no column exists
    const tableInfo = await sequelize.query(
      "DESCRIBE sales",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    const columnNames = tableInfo.map(col => col.Field);
    
    if (!columnNames.includes('sale_no')) {
      // Add sale_no column
      await sequelize.query(
        "ALTER TABLE sales ADD COLUMN sale_no VARCHAR(50) UNIQUE",
        { type: QueryTypes.RAW }
      );
      console.log('Added sale_no column to sales table');
      
      // Populate existing sales with sale numbers
      const existingSales = await sequelize.query(
        "SELECT id, created_at FROM sales WHERE sale_no IS NULL ORDER BY created_at",
        { type: QueryTypes.SELECT }
      ) as any[];
      
      console.log(`Found ${existingSales.length} existing sales to update`);
      
      for (let i = 0; i < existingSales.length; i++) {
        const sale = existingSales[i];
        const createdDate = new Date(sale.created_at);
        const year = createdDate.getFullYear();
        const month = String(createdDate.getMonth() + 1).padStart(2, '0');
        const day = String(createdDate.getDate()).padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;
        const sequenceNumber = String(i + 1).padStart(3, '0');
        const saleNo = `SALE-${datePrefix}-${sequenceNumber}`;
        
        await sequelize.query(
          "UPDATE sales SET sale_no = ? WHERE id = ?",
          { 
            type: QueryTypes.UPDATE,
            replacements: [saleNo, sale.id]
          }
        );
      }
      
      console.log('Populated existing sales with sale numbers');
    } else {
      console.log('sale_no column already exists');
    }
    
    console.log('Sale number migration completed successfully');
  } catch (error) {
    console.error('Error in sale number migration:', error);
    throw error;
  }
};
