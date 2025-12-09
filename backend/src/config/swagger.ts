import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'REE Meter Reading Management API',
      version: '1.0.0',
      description: 'API documentation for REE - Water & Electricity Meter Reading Management System',
      contact: {
        name: 'REE Team',
        email: 'support@ree.ma'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}${config.server.apiPrefix}`,
        description: 'Development server (HTTP)'
      },
      {
        url: `https://localhost:${config.server.port}${config.server.apiPrefix}`,
        description: 'Development server (HTTPS)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints (SUPERADMIN only)' },
      { name: 'Dashboard', description: 'Dashboard statistics and KPIs' },
      { name: 'Agents', description: 'Field agents management' },
      { name: 'Meters', description: 'Meters management' },
      { name: 'Readings', description: 'Meter readings management' },
      { name: 'Reports', description: 'PDF reports generation' },
      { name: 'Districts', description: 'Districts management' }
    ]
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
