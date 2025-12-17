-- REE Meter Reading System - Database Initialization Script
-- This script is executed when MySQL container starts for the first time

-- The database and user are already created by MySQL Docker environment variables
-- This script just ensures proper permissions and character set

-- Ensure UTF-8 character set for proper international character support
ALTER DATABASE ree_meter_reading CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant all privileges to the ree_user (created by Docker env vars)
GRANT ALL PRIVILEGES ON ree_meter_reading.* TO 'ree_user'@'%';
FLUSH PRIVILEGES;

-- Note: Tables will be automatically created by Sequelize ORM on application startup
-- based on the models defined in backend/src/models/

SELECT 'Database initialization completed successfully' AS message;
