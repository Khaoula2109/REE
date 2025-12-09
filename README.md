# REE - Water & Electricity Meter Reading Management System

## Overview

REE (Rabat Energie & Eau) is a comprehensive meter reading management system designed to streamline the collection, management, and reporting of water and electricity meter readings.

### Features

- **Authentication System**: JWT-based authentication with role-based access control (SUPERADMIN and USER roles)
- **User Management**: Complete CRUD operations for backoffice users (SUPERADMIN only)
- **Dashboard**: Real-time KPIs including coverage rate, readings per agent, and consumption evolution
- **Meter Management**: Track and manage water and electricity meters across districts
- **Reading Management**: Record, view, and analyze meter readings
- **Agent Management**: Manage field agents and track their performance
- **Reports**: Generate PDF reports for monthly readings and consumption evolution
- **Responsive Design**: Modern, animated UI with blue and mustard color scheme

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with Knex.js ORM
- **Authentication**: JWT tokens with bcrypt password encryption
- **Email**: Nodemailer (with MailHog/Mailcatcher for development)
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, rate limiting

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
REE/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── database/       # Migrations and seeds
│   │   ├── types/          # TypeScript types
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   ├── scripts/            # Utility scripts
│   ├── ssl/                # SSL certificates
│   ├── package.json
│   ├── tsconfig.json
│   └── knexfile.ts
│
└── frontend/
    ├── src/
    │   ├── api/            # API client
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   ├── store/          # Redux store and slices
    │   ├── hooks/          # Custom hooks
    │   ├── utils/          # Utility functions
    │   ├── types/          # TypeScript types
    │   ├── styles/         # CSS files
    │   ├── App.tsx         # Main app component
    │   └── main.tsx        # Entry point
    ├── public/             # Static assets
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE ree_meter_reading;
EXIT;
```

4. Copy environment file:
```bash
cp .env.example .env
```

5. Update `.env` with your database credentials

6. Run migrations:
```bash
npm run migration:run
```

7. Seed the database:
```bash
npm run seed:run
```

8. Generate SSL certificates (optional):
```bash
cd scripts
./generate-ssl.sh
cd ..
```

9. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:3000/api`

API documentation: `http://localhost:3000/api-docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Email Testing (Optional)

For testing email functionality, install and run MailHog:

```bash
# Using Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Or download binary from https://github.com/mailhog/MailHog
```

Access MailHog UI at `http://localhost:8025`

## Default Credentials

### Superadmin Account
- **Email**: admin@ree.ma
- **Password**: Admin@123

### User Account
- **Email**: malaoui@ree.ma
- **Password**: Admin@123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Users (SUPERADMIN only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/reset-password` - Reset user password

### Dashboard
- `GET /api/dashboard/coverage-rate` - Get coverage rate statistics
- `GET /api/dashboard/readings-per-agent` - Get readings per agent
- `GET /api/dashboard/consumption-evolution` - Get consumption trends

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `PUT /api/agents/:id` - Update agent (district assignment)
- `GET /api/agents/:id/performance` - Get agent performance metrics

### Meters
- `GET /api/meters` - List all meters
- `GET /api/meters/:id` - Get meter details
- `POST /api/meters` - Create new meter
- `GET /api/meters/available-addresses` - Get addresses without meters

### Readings
- `GET /api/readings` - List all readings
- `GET /api/readings/:id` - Get reading details
- `POST /api/readings` - Create new reading

### Reports
- `GET /api/reports/monthly-readings` - Generate monthly readings report (PDF)
- `GET /api/reports/consumption-evolution` - Generate consumption report (PDF)

### Districts
- `GET /api/districts` - List all districts

## Database Schema

### Tables

- **users**: Backoffice users (SUPERADMIN and USER roles)
- **districts**: Geographic districts (Agdal, Hassan, Souissi, etc.)
- **clients**: Customers (integrated from SI Commercial)
- **addresses**: Physical addresses linked to clients
- **agents**: Field agents who perform meter readings
- **meters**: Water and electricity meters
- **readings**: Meter reading records
- **password_resets**: Password reset tokens

### Key Relationships

- Each **address** belongs to a **district** and a **client**
- Each **meter** is assigned to an **address** (max 2 per address, 4 for buildings)
- Each **reading** references a **meter** and an **agent**
- Each **agent** is assigned to a **district**

## Color Scheme

### Primary Colors
- **Blue**: #1E40AF (Primary actions, headers, important elements)
- **Mustard**: #F59E0B (Accents, CTAs, highlights)

### Status Colors
- **Green**: Success states (coverage > 80%)
- **Yellow**: Warning states (coverage 50-80%)
- **Red**: Error/critical states (coverage < 50%)

## Features to Implement

The following features are planned but not yet implemented in the UI:

1. **Login Page**: Complete authentication flow with animations
2. **Dashboard**: Interactive charts showing all 3 KPIs
3. **User Management UI**: Full CRUD interface for SUPERADMIN
4. **Agent Management UI**: List, detail, and performance views
5. **Meter Management UI**: List, detail, and add meter workflows
6. **Reading Management UI**: List and detail views with filters
7. **Reports UI**: Interactive report generation with date ranges
8. **Password Change UI**: Secure password update form
9. **Responsive Navigation**: Sidebar/header with role-based menu
10. **Animated Components**: Framer Motion animations throughout

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### Database Migrations

```bash
# Create a new migration
npm run migration:create migration_name

# Run migrations
npm run migration:run

# Rollback last migration
npm run migration:rollback
```

## Security Considerations

- JWT tokens expire after 30 minutes
- Refresh tokens valid for 7 days
- Automatic frontend logout after 10 minutes of inactivity
- Passwords hashed with bcrypt (10 rounds)
- HTTPS with self-signed certificates for development
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- SQL injection prevention via parameterized queries

## Performance Optimizations

- Database indexes on frequently queried columns
- API response caching where appropriate
- Lazy loading for frontend components
- Code splitting with React Router
- Compression middleware
- Optimized database queries with joins

## License

Proprietary - REE (Rabat Energie & Eau)

## Support

For support, contact: support@ree.ma

---

**Built with ❤️ by the REE Development Team**
