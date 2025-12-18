# Database Setup and Seeding Guide

## Overview

This guide explains how to set up and seed the REE Meter Reading database with initial test data.

## Prerequisites

- MySQL 8.0+ running and accessible
- Node.js and npm installed
- Backend dependencies installed (`npm install`)

## Database Configuration

The application uses environment variables for database configuration. Ensure your `.env` file contains:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ree_meter_reading
DB_USER=root
DB_PASSWORD=Root@123
```

For Docker Compose deployments, the database host should be set to `mysql` (the service name).

## Setup Methods

### Method 1: Using Docker Compose (Recommended for Production)

1. Start all services including the database:
   ```bash
   docker-compose up -d
   ```

2. Wait for the database to be healthy (check with `docker-compose ps`)

3. Run the seed script inside the backend container:
   ```bash
   docker-compose exec backend npm run db:seed:init
   ```

### Method 2: Local Development

1. Ensure MySQL is running locally:
   ```bash
   # Linux
   sudo systemctl start mysql

   # macOS
   brew services start mysql

   # Windows
   net start MySQL80
   ```

2. Create the database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ree_meter_reading CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

3. Navigate to the backend directory:
   ```bash
   cd backend
   ```

4. Run the seed script:
   ```bash
   npm run db:seed:init
   ```

## What the Seed Script Does

The `seedDatabase.ts` script performs the following operations:

1. **Resets the database** - Drops all existing tables and recreates them (⚠️ destroys all data)
2. **Creates test users:**
   - Superadmin: `admin@ree.ma` / `Admin@123`
   - User 1: `mbennani@ree.ma` / `User@123`
   - User 2: `felamrani@ree.ma` / `User@123`
3. **Creates 5 districts** - Agdal, Hassan, Océan, Souissi, Yacoub El Mansour
4. **Creates 7 agents** - Distributed across districts
5. **Creates 50 clients** - With realistic Moroccan names
6. **Creates 100 addresses** - Distributed across districts
7. **Creates ~180 meters** - Water meters for all addresses, electricity for 80%
8. **Creates historical readings** - 3-5 readings per meter over the last 90 days

## Expected Output

When successful, you should see:

```
🌱 Starting database seeding...
✅ Database tables created
Creating users...
✅ Users created
Creating districts...
✅ Districts created
Creating agents...
✅ Agents created
Creating clients...
✅ Clients created
Creating addresses...
✅ Addresses created
Creating meters...
✅ Meters created
Creating readings...
✅ Readings created
✅ Database seeding completed successfully!

📊 Summary:
   - Users: 3
   - Districts: 5
   - Agents: 7
   - Clients: 50
   - Addresses: 100
   - Meters: ~180
   - Readings: ~700

🔐 Login credentials:
   Superadmin: admin@ree.ma / Admin@123
   User: mbennani@ree.ma / User@123
   User: felamrani@ree.ma / User@123
```

## Troubleshooting

### Connection Refused Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:** MySQL is not running. Start MySQL service or Docker containers.

### Access Denied Error

```
Error: Access denied for user 'root'@'localhost'
```

**Solution:** Check your `.env` file has correct `DB_USER` and `DB_PASSWORD` values.

### Database Does Not Exist

```
Error: Unknown database 'ree_meter_reading'
```

**Solution:** Create the database first:
```bash
mysql -u root -p -e "CREATE DATABASE ree_meter_reading CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Foreign Key Constraint Errors

The script automatically disables foreign key checks during table recreation. If you encounter FK errors, ensure you're running the complete script and not individual operations.

## Production Considerations

⚠️ **WARNING:** The seed script uses `sync({ force: true })` which **drops all tables** and recreates them. This will **destroy all existing data**.

For production environments:
- Use database migrations instead: `npm run db:migrate`
- Use Sequelize seeders for specific data: `npm run db:seed`
- Never run `db:seed:init` in production with real data
- Always backup your database before running any seed operations

## Script Location

The seed script is located at: `backend/src/scripts/seedDatabase.ts`

## Available npm Scripts

- `npm run db:seed:init` - Run the comprehensive database seed (this script)
- `npm run db:migrate` - Run Sequelize migrations only
- `npm run db:seed` - Run Sequelize seeders only

## Integration with CI/CD

For automated testing environments, you can run the seed script as part of your test setup:

```bash
# In your CI/CD pipeline
npm run db:seed:init
npm run test
```

## Next Steps

After seeding the database:

1. Start the backend server: `npm run dev`
2. Log in to the application using one of the seeded credentials
3. Verify data in the dashboard
4. Test meter reading workflows with the seeded data
