import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from './app';
import { config } from './config/env';
import db from './config/database';

const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await db.raw('SELECT 1');
    console.log('✓ Database connected successfully');

    const port = config.server.port;

    // Try to use HTTPS if SSL certificates exist
    const keyPath = path.resolve(config.ssl.keyPath);
    const certPath = path.resolve(config.ssl.certPath);

    let server;

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const credentials = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };

      server = https.createServer(credentials, app);
      console.log('✓ HTTPS enabled with SSL certificates');
    } else {
      server = http.createServer(app);
      console.log('⚠ Running without HTTPS (SSL certificates not found)');
      console.log('  To enable HTTPS, generate certificates in ./ssl/ directory');
    }

    server.listen(port, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║                                                        ║');
      console.log('║        REE Meter Reading Management System            ║');
      console.log('║                  Backend API Server                    ║');
      console.log('║                                                        ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`Environment:     ${config.server.env}`);
      console.log(`Server:          ${server instanceof https.Server ? 'https' : 'http'}://localhost:${port}`);
      console.log(`API Prefix:      ${config.server.apiPrefix}`);
      console.log(`API Docs:        ${server instanceof https.Server ? 'https' : 'http'}://localhost:${port}/api-docs`);
      console.log(`Health Check:    ${server instanceof https.Server ? 'https' : 'http'}://localhost:${port}/health`);
      console.log('');
      console.log('Press CTRL+C to stop');
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      server.close(() => {
        console.log('✓ Server closed');
      });

      try {
        await db.destroy();
        console.log('✓ Database connections closed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
