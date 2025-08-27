import { Sequelize } from 'sequelize';

// Explicitly configure for MySQL only
const sequelize = new Sequelize('rest', 'root', 'R>Xb2jP/', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // Adds createdAt and updatedAt
    underscored: true, // Use snake_case for column names
  },
  dialectOptions: {
    // MySQL specific options
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // Disable other dialect features
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
  // Disable other dialects
  dialectModule: require('mysql2'),
});

// Test the connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default sequelize; 