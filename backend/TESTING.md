# Guide de Test - REE Backend

Ce document décrit la stratégie de test et comment exécuter les tests pour le backend REE.

## Table des matières

- [Architecture des tests](#architecture-des-tests)
- [Configuration](#configuration)
- [Exécution des tests](#exécution-des-tests)
- [Structure des tests](#structure-des-tests)
- [Couverture de code](#couverture-de-code)
- [Bonnes pratiques](#bonnes-pratiques)

## Architecture des tests

Le projet utilise une stratégie de test complète comprenant trois niveaux:

### 1. Tests unitaires (`unit/`)
Tests des composants individuels isolés:
- **Modèles** (`models/`) - User, Agent, Meter, Reading, etc.
- **Middlewares** - auth, authorize, validate
- **Utilitaires** - loginLogger, formatters

### 2. Tests d'intégration (`integration/`)
Tests des API endpoints complets:
- **Authentification** - login, refresh, logout, change password
- **Utilisateurs** - CRUD, roles, permissions
- **Agents** - CRUD, districts, assignments
- **Compteurs** - CRUD, types (eau/électricité)
- **Relevés** - création, historique, statistiques
- **API Mobile** - addresses, stats, history
- **Rapports** - génération PDF, statistiques
- **SI Facturation** - envoi données, stats

### 3. Tests E2E (`e2e/`)
Tests des flux utilisateur complets:
- **Flux agent de terrain** - login → addresses → readings → stats
- **Flux superviseur** - gestion équipe, rapports
- **Flux super-admin** - gestion complète système

## Configuration

### Installation des dépendances

```bash
npm install
```

### Variables d'environnement

Créer un fichier `.env.test` pour l'environnement de test:

```env
NODE_ENV=test
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ree_test
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=test-secret-key-do-not-use-in-production
JWT_REFRESH_SECRET=test-refresh-secret-key
```

### Base de données de test

Créer une base de données dédiée aux tests:

```sql
CREATE DATABASE ree_test;
```

Les tests utilisent `sequelize.sync({ force: true })` pour créer et nettoyer automatiquement les tables.

## Exécution des tests

### Tous les tests

```bash
npm test
```

### Tests par catégorie

```bash
# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests E2E uniquement
npm run test:e2e
```

### Mode watch (développement)

```bash
npm run test:watch
```

### Avec couverture de code

```bash
npm run test:coverage
```

### Mode verbose (debugging)

```bash
npm run test:verbose
```

### Tests spécifiques

```bash
# Un fichier de test
npm test -- auth.test.ts

# Un test spécifique
npm test -- -t "should login with valid credentials"

# Avec pattern
npm test -- --testPathPattern=mobile
```

## Structure des tests

### Organisation des fichiers

```
backend/src/
├── __tests__/
│   ├── setup.ts                 # Configuration globale des tests
│   ├── helpers/
│   │   ├── factories.ts         # Factory pattern pour données de test
│   │   ├── auth.ts              # Helpers d'authentification
│   │   └── utils.ts             # Utilitaires de test
│   ├── unit/
│   │   └── models/
│   │       ├── User.test.ts
│   │       ├── Agent.test.ts
│   │       ├── Meter.test.ts
│   │       └── Reading.test.ts
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── users.test.ts
│   │   ├── agents.test.ts
│   │   ├── meters.test.ts
│   │   ├── readings.test.ts
│   │   └── mobile.test.ts
│   └── e2e/
│       └── agent-workflow.test.ts
```

### Exemple de test unitaire

```typescript
import { TestFactory } from '../../helpers/factories';

describe('Reading Model', () => {
  it('should auto-calculate consumption', async () => {
    const meter = await TestFactory.createMeter();
    const agent = await TestFactory.createAgent();

    const reading = await Reading.create({
      meterId: meter.id,
      agentId: agent.id,
      previousIndex: 100,
      currentIndex: 150,
      readingDate: new Date(),
    });

    expect(Number(reading.consumption)).toBe(50);
  });
});
```

### Exemple de test d'intégration

```typescript
import request from 'supertest';
import app from '../../server';
import { getUserAuthHeader } from '../helpers/auth';

describe('POST /api/readings', () => {
  it('should create a reading successfully', async () => {
    const superadmin = await TestFactory.createSuperAdmin();
    const meter = await TestFactory.createMeter({ currentIndex: 100 });
    const agent = await TestFactory.createAgent();

    const response = await request(app)
      .post('/api/readings')
      .set(getUserAuthHeader(superadmin))
      .send({
        meterId: meter.id,
        agentId: agent.id,
        currentIndex: 150,
      });

    expectSuccess(response, 201);
    expect(Number(response.body.consumption)).toBe(50);
  });
});
```

### Exemple de test E2E

```typescript
it('should complete full agent workflow', async () => {
  // 1. Setup: Create district, agent, addresses, meters
  const district = await TestFactory.createDistrict();
  const agent = await TestFactory.createAgent({ districtId: district.id });

  // 2. Login
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: agent.email, password: 'password' });

  const { accessToken } = loginResponse.body;

  // 3. Get addresses to visit
  const addressesResponse = await request(app)
    .get('/api/mobile/addresses')
    .set('Authorization', `Bearer ${accessToken}`);

  // 4. Create readings
  // 5. Check stats
  // 6. View history
  // 7. Logout
});
```

## Couverture de code

### Objectifs de couverture

Le projet vise une couverture minimale de **70%** pour:
- Branches (70%)
- Fonctions (70%)
- Lignes (70%)
- Statements (70%)

### Générer le rapport de couverture

```bash
npm run test:coverage
```

Le rapport HTML sera disponible dans `backend/coverage/lcov-report/index.html`.

### Fichiers exclus de la couverture

- `src/server.ts` (point d'entrée)
- `src/config/**` (configuration)
- `src/**/*.d.ts` (fichiers de types)

## Bonnes pratiques

### 1. Isolation des tests

Chaque test doit être indépendant et ne pas dépendre d'autres tests:

```typescript
// ✅ BON
beforeEach(async () => {
  // Setup spécifique à chaque test
  user = await TestFactory.createUser();
});

// ❌ MAUVAIS
beforeAll(async () => {
  // Setup partagé entre tous les tests (peut créer des dépendances)
  user = await TestFactory.createUser();
});
```

### 2. Nettoyage après les tests

Le fichier `setup.ts` nettoie automatiquement la base de données après chaque test:

```typescript
afterEach(async () => {
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true, truncate: true });
  }
});
```

### 3. Utiliser les factories

Privilégier les factories pour créer des données de test:

```typescript
// ✅ BON - Utilise la factory
const user = await TestFactory.createUser({ email: 'test@example.com' });

// ❌ MAUVAIS - Création manuelle
const user = await User.create({
  email: 'test@example.com',
  password: await bcrypt.hash('password', 10),
  firstName: 'Test',
  lastName: 'USER',
  role: UserRole.USER,
  isActive: true,
});
```

### 4. Tests descriptifs

Utiliser des descriptions claires:

```typescript
// ✅ BON
it('should fail to create user with duplicate email', async () => { ... });

// ❌ MAUVAIS
it('test duplicate', async () => { ... });
```

### 5. Assertions précises

```typescript
// ✅ BON
expect(response.status).toBe(201);
expect(response.body).toHaveProperty('id');
expect(response.body.email).toBe('test@example.com');

// ❌ MAUVAIS
expect(response.status).toBeTruthy();
expect(response.body).toBeDefined();
```

### 6. Tests des cas limites

Toujours tester:
- Cas nominal (succès)
- Cas d'erreur (validation, permissions, etc.)
- Cas limites (valeurs nulles, vides, extrêmes)

```typescript
describe('POST /api/readings', () => {
  it('should create reading with valid data');          // Cas nominal
  it('should fail without meterId');                    // Cas d'erreur
  it('should fail if currentIndex < previousIndex');    // Cas limite
});
```

## Scripts de test CI/CD

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: ree_test
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Dépannage

### Tests qui échouent aléatoirement

Utiliser `--runInBand` pour exécuter les tests séquentiellement:

```bash
npm test -- --runInBand
```

### Timeout des tests

Augmenter le timeout dans `jest.config.js`:

```javascript
module.exports = {
  testTimeout: 30000, // 30 secondes
};
```

### Base de données non nettoyée

Vérifier que `setup.ts` est bien configuré et que les hooks `afterEach` fonctionnent.

### Problèmes de connexion à la base de données

- Vérifier que MySQL est démarré
- Vérifier les credentials dans `.env.test`
- Vérifier que la base de données `ree_test` existe

## Ressources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Sequelize Testing](https://sequelize.org/docs/v6/other-topics/testing/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
