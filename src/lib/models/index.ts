import sequelize from '../database';
import User from './User';
import Product from './Product';
import Table from './Table';
import Sale from './Sale';
import SaleItem from './SaleItem';
import Purchase from './Purchase';
import PurchaseItem from './PurchaseItem';

// Define associations
Sale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Sale, { foreignKey: 'user_id', as: 'sales' });

// Sale and SaleItem associations
Sale.hasMany(SaleItem, { 
  foreignKey: 'sale_id', 
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
SaleItem.belongsTo(Sale, { 
  foreignKey: 'sale_id', 
  as: 'sale',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(SaleItem, { foreignKey: 'product_id', as: 'saleItems' });

// Purchase associations
Purchase.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Purchase, { foreignKey: 'user_id', as: 'purchases' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id', as: 'items' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });

PurchaseItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PurchaseItem, { foreignKey: 'product_id', as: 'purchaseItems' });

// Sync all models with database
export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

export {
  sequelize,
  User,
  Product,
  Table,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
}; 