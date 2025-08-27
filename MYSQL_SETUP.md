# MySQL Database Setup Guide

## Prerequisites

1. **Install MySQL Server**
   ```bash
   # On macOS with Homebrew
   brew install mysql
   
   # On Ubuntu/Debian
   sudo apt-get install mysql-server
   
   # On Windows
   # Download and install MySQL from https://dev.mysql.com/downloads/mysql/
   ```

2. **Start MySQL Service**
   ```bash
   # On macOS
   brew services start mysql
   
   # On Ubuntu/Debian
   sudo systemctl start mysql
   
   # On Windows
   # MySQL service should start automatically
   ```

## Database Setup

1. **Create Database**
   ```sql
   CREATE DATABASE rest;
   ```

2. **Create User (if needed)**
   ```sql
   CREATE USER 'root'@'localhost' IDENTIFIED BY 'password123';
   GRANT ALL PRIVILEGES ON rest.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Project Setup

1. **Install Dependencies**
   ```bash
   npm install sequelize mysql2 sequelize-cli
   ```

2. **Initialize Database**
   ```bash
   # Start the development server
   npm run dev
   
   # In another terminal, call the initialization endpoint
   curl -X POST http://localhost:3000/api/init
   ```

## Database Models

The following models have been created:

- **User**: Authentication and user management
- **Product**: Restaurant products/menu items
- **Table**: Restaurant tables
- **Sale**: Sales transactions
- **SaleItem**: Individual items in a sale

## API Changes

All APIs have been updated to use MySQL instead of Firebase:

- `/api/v1/table` - Table management
- `/api/v1/sale/pending_sale` - Get pending sales
- `/api/v1/product` - Product management
- `/api/v1/users` - User management

## Default Data

The initialization script creates:

1. **Default Admin User**
   - Email: admin@restaurant.com
   - Password: admin123
   - Role: Admin

2. **Sample Tables**
   - Table 1, Table 2, Table 3
   - VIP 1, VIP 2

3. **Sample Products**
   - Chicken Curry (8000 MMK)
   - Beef Steak (12000 MMK)
   - Fried Rice (5000 MMK)
   - Coca Cola (1000 MMK)
   - Ice Cream (2000 MMK)

## Environment Variables

You can customize the database connection by modifying `src/lib/database.ts`:

```typescript
const sequelize = new Sequelize('rest', 'root', 'password123', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  // ... other options
});
```

## Troubleshooting

1. **Connection Error**: Make sure MySQL is running and the credentials are correct
2. **Database Not Found**: Create the database first
3. **Permission Error**: Check user privileges
4. **Port Conflict**: Change the port in the configuration if needed

## Migration from Firebase

The following changes were made:

1. **Removed Firebase dependencies**
2. **Added Sequelize models**
3. **Updated all API endpoints**
4. **Added database initialization**
5. **Maintained the same API response format**

All existing functionality should work the same way, just with MySQL as the backend instead of Firebase. 