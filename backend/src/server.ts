import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import sequelize from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API Routes
app.use(process.env.API_PREFIX || '/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync models (use { force: true } only in development to reset DB)
    await sequelize.sync({ alter: NODE_ENV === 'development' });
    console.log('✅ Database models synchronized');

    // Start server
    if (NODE_ENV === 'production' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
      // HTTPS server with SSL certificates
      const sslKeyPath = path.resolve(process.env.SSL_KEY_PATH);
      const sslCertPath = path.resolve(process.env.SSL_CERT_PATH);

      if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
        const httpsOptions = {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath),
        };

        https.createServer(httpsOptions, app).listen(PORT, () => {
          console.log(`🚀 HTTPS Server running on port ${PORT}`);
          console.log(`🌐 Environment: ${NODE_ENV}`);
        });
      } else {
        console.warn('⚠️ SSL certificates not found, starting HTTP server');
        app.listen(PORT, () => {
          console.log(`🚀 HTTP Server running on port ${PORT}`);
          console.log(`🌐 Environment: ${NODE_ENV}`);
        });
      }
    } else {
      // HTTP server for development
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Environment: ${NODE_ENV}`);
        console.log(`📝 API Documentation: http://localhost:${PORT}/api/health`);
      });
    }
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
