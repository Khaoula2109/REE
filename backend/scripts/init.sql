-- REE Meter Reading System - Database Initialization Script

ALTER DATABASE ree_meter_reading
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON ree_meter_reading.* TO 'ree_user'@'%';
FLUSH PRIVILEGES;

SELECT 'Database initialization completed successfully' AS message;

