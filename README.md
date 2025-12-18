# REE - Système de Gestion des Relevés de Compteurs

**REE (Rabat Energie & Eau)** - Application backoffice web pour la gestion des relevés de compteurs d'eau et d'électricité.

## 🎯 Aperçu du Projet

Système complet de gestion des relevés de compteurs avec:
- **Backend**: Node.js + Express + TypeScript + MySQL
- **Frontend**: React + Vite + TypeScript + TailwindCSS + Redux Toolkit
- **Authentification**: JWT avec refresh tokens
- **Sécurité**: Bcrypt, validation, CORS, Helmet
- **UI/UX**: Design moderne avec animations (Framer Motion)
- **Thème**: Bleu et jaune moutarde (professionnel et dynamique)

## 📋 Fonctionnalités

### ✅ Implémenté (Backend complet)

#### 1. **Authentification**
   - ✅ Connexion avec JWT (expiration 30 min)
   - ✅ Refresh token (expiration 7 jours)
   - ✅ Changement de mot de passe
   - ✅ Réinitialisation de mot de passe
   - ✅ Logout automatique après 10 min d'inactivité
   - ✅ Contrôle d'accès basé sur les rôles (SUPERADMIN/USER)

#### 2. **Gestion des Utilisateurs** (SUPERADMIN only)
   - ✅ Liste, création, modification, suppression
   - ✅ Génération automatique de mot de passe
   - ✅ Envoi d'email avec identifiants
   - ✅ Réinitialisation de mot de passe utilisateur

#### 3. **Tableau de Bord**
   - ✅ KPI: Taux de couverture par quartier
   - ✅ KPI: Relevés moyens par agent par jour
   - ✅ KPI: Évolution de la consommation moyenne
   - ✅ Statistiques globales

#### 4. **Gestion des Relevés**
   - ✅ Liste avec filtres (date, quartier, agent, client, type)
   - ✅ Pagination
   - ✅ Détail d'un relevé
   - ✅ Création de relevé
   - ✅ Export CSV
   - ✅ Historique par compteur

#### 5. **Gestion des Agents**
   - ✅ Liste avec filtres (quartier, recherche)
   - ✅ Détail agent avec métriques de performance
   - ✅ Graphique d'évolution des relevés (1 sem à 1 an)
   - ✅ Modification (affectation quartier)
   - ✅ Création/suppression

#### 6. **Gestion des Compteurs**
   - ✅ Liste avec pagination
   - ✅ Détail avec historique des 10 derniers relevés
   - ✅ Ajout de compteur (sélection adresse disponible)
   - ✅ Validation: max 2 compteurs/adresse (4 pour immeubles)
   - ✅ Auto-génération ID compteur (9 chiffres)

#### 7. **Rapports PDF**
   - ✅ Rapport mensuel des relevés (distribution agents/quartier)
   - ✅ Rapport évolution consommation (eau/électricité, N vs N-1)

### 🚧 Frontend (Structure créée, à compléter)

- ✅ **Authentification UI**: Login, Change Password (complètes)
- ✅ **Layout**: Sidebar, Header avec thème bleu/moutarde
- ✅ **Routing**: Configuration complète
- ✅ **State Management**: Redux Toolkit configuré
- 🚧 **Pages**: Placeholders créés pour:
  - Dashboard (KPIs + graphiques)
  - User Management
  - Readings List & Detail
  - Agents List & Detail
  - Meters List, Detail & Add
  - Reports

## 🚀 Installation et Configuration

### Prérequis

- **Node.js** v18+ et npm
- **MySQL** v8+
- **Git**

### 1. Cloner le projet

```bash
git clone <repository-url>
cd REE
```

### 2. Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env à partir de l'exemple
cp .env.example .env

# Modifier .env avec vos paramètres
nano .env
```

**Configuration .env importante:**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ree_meter_reading
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=changez-cette-cle-secrete-en-production
JWT_REFRESH_SECRET=changez-cette-cle-aussi

# Email (Mailcatcher pour développement)
SMTP_HOST=localhost
SMTP_PORT=1025

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Configuration Base de Données

```bash
# Créer la base de données MySQL
mysql -u root -p

CREATE DATABASE ree_meter_reading CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Vérifier la connexion à la base de données
npm run db:check

# Initialiser et peupler la base avec des données de test (⚠️ efface toutes les données!)
npm run db:seed:init
```

**Utilisateurs créés:**
- **Superadmin**: `admin@ree.ma` / `Admin@123`
- **User**: `mbennani@ree.ma` / `User@123`
- **User**: `felamrani@ree.ma` / `User@123`

**Données de test incluses:**
- 5 districts (Agdal, Hassan, Océan, Souissi, Yacoub El Mansour)
- 7 agents répartis dans les districts
- 50 clients avec des noms marocains
- 100 adresses
- ~180 compteurs (eau et électricité)
- ~700 relevés historiques sur 90 jours

📖 **Documentation complète:** `backend/DATABASE_SETUP.md`

### 4. Configuration Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Vérifier l'URL de l'API
nano .env
```

**Configuration .env frontend:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SESSION_TIMEOUT=600000
```

### 5. Démarrer l'application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Accès:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

### 6. Email de Test (Mailcatcher)

Pour tester les emails (création utilisateur, réinitialisation mot de passe):

```bash
# Installer Mailcatcher
gem install mailcatcher

# Démarrer Mailcatcher
mailcatcher

# Interface web: http://localhost:1080
```

## 📁 Structure du Projet

```
REE/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, email config
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # DB seeding, admin creation
│   │   ├── utils/          # JWT, password generator
│   │   └── server.ts       # Express server
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── lib/            # Axios, utils
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store & slices
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── package.json            # Workspace root
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/logout` - Logout

### Users (SUPERADMIN)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/reset-password` - Reset password
- `DELETE /api/users/:id` - Delete user

### Dashboard
- `GET /api/dashboard/coverage-rate` - Coverage rate by district
- `GET /api/dashboard/readings-per-agent` - Readings per agent
- `GET /api/dashboard/consumption-evolution` - Consumption evolution
- `GET /api/dashboard/stats` - Overall statistics

### Readings
- `GET /api/readings` - List readings (with filters)
- `GET /api/readings/:id` - Get reading
- `POST /api/readings` - Create reading
- `GET /api/readings/meter/:meterId` - Get meter reading history
- `GET /api/readings/export` - Export to CSV

### Agents
- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent
- `GET /api/agents/:id/performance` - Get agent performance
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Meters
- `GET /api/meters` - List meters
- `GET /api/meters/:id` - Get meter
- `GET /api/meters/available-addresses` - Get addresses without meters
- `POST /api/meters` - Create meter
- `PUT /api/meters/:id` - Update meter
- `DELETE /api/meters/:id` - Delete meter

### Reports
- `GET /api/reports/monthly-readings` - Generate monthly readings PDF
- `GET /api/reports/consumption-evolution` - Generate consumption evolution PDF

## 🎨 Charte Graphique

**Couleurs Principales:**
- **Bleu Principal**: `#1E40AF` (primary-600)
- **Bleu Clair**: `#3B82F6` (primary-500)
- **Bleu Foncé**: `#1E3A8A` (primary-700)
- **Jaune Moutarde**: `#F59E0B` (accent-500)
- **Jaune Clair**: `#FCD34D` (accent-300)

**Animations:**
- Transitions smooth (Framer Motion)
- Hover effects sur les boutons et cartes
- Fade-in/slide-in pour les pages
- Loading skeletons

## 📝 Scripts Utiles

### Backend
```bash
npm run dev          # Démarrer en mode développement
npm run build        # Compiler TypeScript
npm run start        # Démarrer en production
```

### Frontend
```bash
npm run dev          # Démarrer en mode développement
npm run build        # Build pour production
npm run preview      # Prévisualiser le build
```

### Root (depuis /REE)
```bash
npm run dev          # Démarrer backend + frontend en parallèle
npm run build        # Build backend + frontend
```

## 🔐 Sécurité

- ✅ Mots de passe hashés avec bcrypt (salt 10)
- ✅ JWT avec expiration (30 min access, 7 jours refresh)
- ✅ Validation des entrées (express-validator, Zod)
- ✅ Protection CORS
- ✅ Helmet pour headers sécurisés
- ✅ Rate limiting recommandé (à ajouter)
- ✅ HTTPS en production (certificats SSL)

## 🚀 Prochaines Étapes

### Frontend à Compléter

1. **Implémenter les pages complètes:**
   - Dashboard avec graphiques interactifs (Recharts)
   - User Management (CRUD complet)
   - Readings List avec filtres avancés
   - Agent Detail avec graphique performance
   - Meter Management complet
   - Reports avec génération PDF

2. **Composants réutilisables:**
   - Table component avec tri/filtres
   - Modal/Dialog
   - Form components
   - Loading states
   - Empty states
   - Error boundaries

3. **Améliorations:**
   - Tests (Jest, React Testing Library)
   - Optimisation performances
   - PWA support
   - Responsive mobile complet

### Backend Améliorations

1. **Ajouts recommandés:**
   - Rate limiting (express-rate-limit)
   - Request logging avancé
   - Health checks détaillés
   - Migrations Sequelize
   - Tests unitaires/intégration
   - Documentation Swagger

2. **Intégrations externes:**
   - SI Commercial (clients)
   - SI RH (agents)
   - SI Facturation (consommation)

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs backend (console)
2. Vérifier les logs frontend (DevTools)
3. S'assurer que MySQL est démarré
4. Vérifier les configurations .env

## 📄 Licence

MIT License - REE (Rabat Energie & Eau)

---

**Développé avec ❤️ pour la transformation digitale de REE**
