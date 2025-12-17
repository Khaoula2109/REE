# Guide de Déploiement - REE (Rabat Energie & Eau)
## Déploiement Intelligent avec IA et Automatisation

**Version:** 1.0
**Date:** 17 Décembre 2025
**Projet:** REE - Système de Gestion des Relevés de Compteurs

---

## Table des Matières

1. [Introduction](#1-introduction)
2. [Architecture de Déploiement](#2-architecture-de-déploiement)
3. [Prérequis](#3-prérequis)
4. [Déploiement Local avec Docker](#4-déploiement-local-avec-docker)
5. [CI/CD avec GitHub Actions](#5-cicd-avec-github-actions)
6. [Tests de Charge et Prédictions IA](#6-tests-de-charge-et-prédictions-ia)
7. [Évaluation des Risques de Déploiement](#7-évaluation-des-risques-de-déploiement)
8. [Provisionnement Intelligent des Environnements](#8-provisionnement-intelligent-des-environnements)
9. [Monitoring et Observabilité](#9-monitoring-et-observabilité)
10. [Procédures de Rollback](#10-procédures-de-rollback)
11. [Sécurité](#11-sécurité)
12. [Dépannage](#12-dépannage)

---

## 1. Introduction

### 1.1 Vue d'Ensemble

Le système de déploiement REE utilise une approche moderne et intelligente basée sur:

- 🤖 **IA pour l'Évaluation des Risques** : Analyse automatique des risques avant chaque déploiement
- 📊 **Tests de Charge Prédictifs** : Prédiction des performances sous différentes charges
- 🚀 **Provisionnement Automatique** : Configuration intelligente des ressources
- 📈 **Monitoring en Temps Réel** : Surveillance continue avec Prometheus et Grafana
- 🔄 **CI/CD Automatisé** : Pipeline complet avec GitHub Actions

### 1.2 Avantages

✅ **Réduction des risques** : Détection précoce des problèmes potentiels
✅ **Optimisation des ressources** : Provisionnement adapté à la charge
✅ **Déploiement rapide** : Automatisation complète du pipeline
✅ **Visibilité totale** : Dashboards et alertes en temps réel
✅ **Qualité garantie** : Tests automatiques à chaque étape

---

## 2. Architecture de Déploiement

### 2.1 Stack Technologique

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (Nginx)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼───────┐        ┌────────▼────────┐
│   Frontend    │        │    Backend      │
│  React PWA    │        │  Node.js API    │
│  (Nginx)      │        │  (Express)      │
└───────────────┘        └────────┬────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
             ┌───────▼───────┐        ┌───────▼───────┐
             │     MySQL     │        │     Redis     │
             │   Database    │        │     Cache     │
             └───────────────┘        └───────────────┘

         ┌────────────────────────────────────┐
         │      Monitoring Stack              │
         │  ┌──────────┐    ┌──────────┐    │
         │  │Prometheus│───▶│ Grafana  │    │
         │  └──────────┘    └──────────┘    │
         └────────────────────────────────────┘
```

### 2.2 Environnements

| Environnement | Objectif | Configuration |
|--------------|----------|---------------|
| **Development** | Développement local | 1 Backend, 1 Frontend, MySQL local |
| **Staging** | Tests pré-production | 2 Backend, 1 Frontend, Monitoring complet |
| **Production** | Production | 3+ Backend (auto-scaling), 2 Frontend, HA Database |

---

## 3. Prérequis

### 3.1 Outils Requis

- **Docker** 24.0+ et Docker Compose 2.0+
- **Git** 2.30+
- **Node.js** 18+ (pour développement local)
- **Python** 3.11+ (pour scripts IA)
- **k6** (pour tests de charge)

### 3.2 Installation des Outils

```bash
# Docker et Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# k6 (tests de charge)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Python et dépendances IA
sudo apt-get install python3.11 python3-pip
pip install numpy pandas scikit-learn gitpython requests prometheus-client
```

### 3.3 Variables d'Environnement

Créer un fichier `.env` à la racine du projet:

```env
# Database
MYSQL_ROOT_PASSWORD=secure_root_password
DB_NAME=ree_meter_reading
DB_USER=ree_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Ports
BACKEND_PORT=5000
FRONTEND_PORT=80
MYSQL_PORT=3306
REDIS_PORT=6379
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Frontend
VITE_API_URL=http://localhost:5000/api

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin
```

---

## 4. Déploiement Local avec Docker

### 4.1 Construction des Images

```bash
# Clone du repository
git clone https://github.com/votre-org/REE.git
cd REE

# Construction de toutes les images
docker-compose build

# Ou construire individuellement
docker-compose build backend
docker-compose build frontend
```

### 4.2 Lancement de l'Application

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps

# Health check
curl http://localhost:5000/health
```

### 4.3 Accès aux Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost | - |
| Backend API | http://localhost:5000 | - |
| Grafana | http://localhost:3001 | admin / admin |
| Prometheus | http://localhost:9090 | - |
| MySQL | localhost:3306 | root / secure_root_password |

### 4.4 Arrêt et Nettoyage

```bash
# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Nettoyer les images
docker system prune -a
```

---

## 5. CI/CD avec GitHub Actions

### 5.1 Pipeline Automatique

Le pipeline GitHub Actions s'exécute automatiquement lors de:
- Push sur `main`, `develop`, ou `staging`
- Pull requests vers `main` ou `develop`
- Déclenchement manuel via workflow_dispatch

### 5.2 Étapes du Pipeline

```
1. Code Analysis     → Vérification TypeScript, linting, audit sécurité
2. Automated Testing → Tests unitaires, intégration, E2E
3. Risk Assessment   → Analyse IA des risques de déploiement
4. Load Testing      → Tests de charge avec prédictions IA
5. Build Images      → Construction des images Docker
6. Provision Env     → Provisionnement intelligent des ressources
7. Deploy            → Déploiement avec stratégie adaptative
8. Health Monitoring → Surveillance post-déploiement
```

### 5.3 Configuration GitHub Actions

Le pipeline est défini dans `.github/workflows/ci-cd-pipeline.yml`.

**Secrets GitHub requis:**

```
GITHUB_TOKEN          # Auto-fourni par GitHub
```

**Artifacts générés:**

- `coverage-report` : Rapport de couverture des tests
- `risk-assessment` : Évaluation des risques de déploiement
- `load-test-results` : Résultats et prédictions des tests de charge
- `provisioning-plan` : Plan de provisionnement des ressources
- `health-report` : Rapport de santé post-déploiement

### 5.4 Déclenchement Manuel

```bash
# Via l'interface GitHub
Actions → CI/CD Pipeline → Run workflow → Choisir l'environnement

# Via GitHub CLI
gh workflow run ci-cd-pipeline.yml -f environment=production
```

---

## 6. Tests de Charge et Prédictions IA

### 6.1 Exécution Locale

```bash
# Tests de charge avec k6
cd deployment/k6
k6 run --out json=results.json load-test.js

# Analyse et prédictions IA
cd ../scripts
python3 load_predictor.py --results ../k6/results.json --output predictions.json
```

### 6.2 Configuration des Tests

Fichier `deployment/k6/load-test.js` configure les scénarios:

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm-up
    { duration: '5m', target: 50 },   // Normal load
    { duration: '10m', target: 100 }, // Steady state
    { duration: '3m', target: 200 },  // Spike test
    { duration: '5m', target: 100 },  // Recovery
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.05'],
  },
};
```

### 6.3 Métriques Analysées

- **Temps de réponse** : Moyenne, P95, P99, Max
- **Taux d'erreur** : Pourcentage de requêtes échouées
- **Débit** : Requêtes par seconde
- **Capacité prédite** : Utilisateurs max supportés
- **Points de rupture** : Seuils de dégradation

### 6.4 Interprétation des Résultats

```json
{
  "capacity_prediction": {
    "current_users": 100,
    "max_users_predicted": 200,
    "capacity_utilization": 50,
    "headroom_percentage": 50,
    "status": "HEALTHY"
  },
  "recommendations": [
    {
      "priority": "MEDIUM",
      "category": "Scaling",
      "recommendation": "Plan for scaling - approaching capacity limits",
      "action": "Prepare to increase server instances by 25-50%"
    }
  ]
}
```

---

## 7. Évaluation des Risques de Déploiement

### 7.1 Analyse Automatique

L'outil d'évaluation des risques analyse:

✅ **Taille des changements** : Nombre de lignes modifiées
✅ **Fichiers critiques** : Modifications de database, auth, security
✅ **Couverture de tests** : Pourcentage de code testé
✅ **Patterns de commits** : Fréquence et stabilité
✅ **Dépendances** : Mises à jour de packages
✅ **Stabilité récente** : Nombre de fixes récents

### 7.2 Exécution Manuelle

```bash
cd deployment/scripts
python3 risk_assessment.py --repo-path ../../ --output risk-report.json
```

### 7.3 Niveaux de Risque

| Score | Niveau | Action |
|-------|--------|--------|
| 0-20 | MINIMAL | ✅ Déployer en confiance |
| 21-40 | LOW | ✅ Déployer normalement |
| 41-60 | MEDIUM | ✅ Déployer avec monitoring standard |
| 61-80 | HIGH | ⚠️ Déployer avec précaution supplémentaire |
| 81-100 | CRITICAL | ❌ NE PAS déployer - Corriger les problèmes |

### 7.4 Exemple de Rapport

```json
{
  "risk_score": 45,
  "risk_level": "MEDIUM",
  "recommendation": "✅ SAFE TO DEPLOY - Medium risk. Standard deployment process recommended.",
  "factors": [
    {
      "name": "Code Change Size",
      "score": 5,
      "description": "Medium code change (250 lines, 12 files)"
    },
    {
      "name": "Test Coverage",
      "score": 3,
      "description": "Good test coverage (72%)"
    }
  ],
  "actions": [
    "Proceed with standard deployment process",
    "Monitor system health post-deployment"
  ]
}
```

---

## 8. Provisionnement Intelligent des Environnements

### 8.1 Agent de Provisionnement

L'agent analyse automatiquement:
- Niveau de risque du déploiement
- Charge prédite
- Historique de performance
- Criticité des changements

Et génère un plan optimisé de ressources.

### 8.2 Exécution

```bash
cd deployment/scripts

# Production
python3 intelligent_provisioner.py \
  --environment production \
  --risk-report risk-report.json \
  --output provision-plan.json

# Staging
python3 intelligent_provisioner.py \
  --environment staging \
  --output provision-plan.json
```

### 8.3 Plan de Provisionnement

```json
{
  "environment": "production",
  "resources": {
    "backend": {
      "instances": 3,
      "cpu": "4 vCPU",
      "memory": "8 GB"
    },
    "database": {
      "instance_type": "db.r5.large",
      "storage_gb": 100,
      "multi_az": true,
      "read_replicas": 1
    }
  },
  "scaling": {
    "enabled": true,
    "min_instances": 3,
    "max_instances": 10,
    "target_cpu_utilization": 70
  }
}
```

### 8.4 Ajustements Basés sur les Risques

**Risque ÉLEVÉ** :
- +50% d'instances
- Monitoring renforcé
- Seuils d'auto-scaling plus bas
- Déploiement canary activé

**Risque MOYEN** :
- Configuration standard
- Monitoring normal

**Risque FAIBLE** :
- Configuration optimisée pour les coûts

---

## 9. Monitoring et Observabilité

### 9.1 Stack de Monitoring

- **Prometheus** : Collecte des métriques
- **Grafana** : Visualisation et dashboards
- **Alertmanager** : Gestion des alertes

### 9.2 Métriques Collectées

#### Application
- Temps de réponse (avg, p95, p99)
- Taux d'erreur
- Requêtes par seconde
- Utilisateurs actifs

#### Infrastructure
- CPU, mémoire, disque
- Connexions réseau
- Connexions database
- Cache hit rate

#### Business
- Relevés créés par jour
- Agents actifs
- Districts couverts

### 9.3 Dashboards Grafana

**Application Overview**
- Vue d'ensemble des performances
- Taux d'erreur en temps réel
- Latence des endpoints

**Database Performance**
- Requêtes lentes
- Pool de connexions
- Transactions par seconde

**Infrastructure Health**
- Utilisation CPU/mémoire
- Espace disque
- Charge réseau

### 9.4 Alertes Configurées

| Alerte | Condition | Sévérité | Action |
|--------|-----------|----------|--------|
| High Error Rate | > 5% | CRITICAL | Notification immédiate |
| Slow Response | P95 > 1s | WARNING | Investigation requise |
| Service Down | up == 0 | CRITICAL | Escalade automatique |
| High CPU | > 80% | WARNING | Préparer le scaling |
| DB Connections | > 90% | CRITICAL | Augmenter le pool |

### 9.5 Accès aux Dashboards

```
Grafana: http://localhost:3001
Username: admin
Password: admin (à changer en production!)
```

---

## 10. Procédures de Rollback

### 10.1 Rollback Automatique

Le pipeline peut détecter automatiquement les problèmes et effectuer un rollback si:
- Taux d'erreur > 10% pendant 5 minutes
- Temps de réponse P95 > 2 secondes
- Health checks échouent consécutivement

### 10.2 Rollback Manuel

#### Docker Compose

```bash
# Revenir à la version précédente
docker-compose down
docker-compose pull  # Récupérer images précédentes
docker-compose up -d
```

#### Avec Tags Spécifiques

```bash
# Déployer une version spécifique
export IMAGE_TAG=v1.2.3
docker-compose up -d
```

### 10.3 Rollback de Base de Données

```bash
# Restaurer une sauvegarde
docker-compose stop mysql
docker-compose run --rm mysql sh -c \
  'mysql -h mysql -u root -p$MYSQL_ROOT_PASSWORD $DB_NAME < /backup/dump-2024-12-16.sql'
docker-compose start mysql
```

---

## 11. Sécurité

### 11.1 Best Practices Implémentées

✅ **Images Docker**
- Multi-stage builds pour images légères
- Utilisateur non-root
- Scan de vulnérabilités

✅ **Réseau**
- Isolation des services
- TLS/SSL obligatoire en production
- Headers de sécurité (HSTS, CSP, etc.)

✅ **Secrets**
- Variables d'environnement
- Pas de secrets dans le code
- Rotation régulière des mots de passe

✅ **Monitoring**
- Logs centralisés
- Détection d'anomalies
- Alertes de sécurité

### 11.2 Checklist Pré-Production

- [ ] Changement des mots de passe par défaut
- [ ] Configuration SSL/TLS
- [ ] Firewall configuré
- [ ] Backups automatiques activés
- [ ] Monitoring et alertes configurés
- [ ] Rate limiting activé
- [ ] CORS correctement configuré
- [ ] Audit de sécurité effectué

---

## 12. Dépannage

### 12.1 Problèmes Courants

#### Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs backend
docker-compose logs mysql

# Vérifier les ports utilisés
sudo netstat -tulpn | grep :5000

# Reconstruire les images
docker-compose build --no-cache
docker-compose up -d
```

#### Erreurs de connexion Database

```bash
# Vérifier que MySQL est prêt
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# Vérifier les credentials
docker-compose exec mysql mysql -u root -p
```

#### Performance Dégradée

```bash
# Vérifier l'utilisation des ressources
docker stats

# Vérifier les logs d'erreur
docker-compose logs --tail=100 backend | grep ERROR

# Redémarrer les services
docker-compose restart backend
```

### 12.2 Logs et Debugging

```bash
# Logs en temps réel
docker-compose logs -f backend

# Logs des dernières 100 lignes
docker-compose logs --tail=100

# Entrer dans un conteneur
docker-compose exec backend sh

# Vérifier les variables d'environnement
docker-compose exec backend env
```

### 12.3 Health Checks

```bash
# API Health
curl http://localhost:5000/health

# Database Health
docker-compose exec mysql mysqladmin ping

# Redis Health
docker-compose exec redis redis-cli ping
```

### 12.4 Contact Support

Pour obtenir de l'aide:
- 📧 Email: support@ree.ma
- 💬 Slack: #ree-support
- 📚 Documentation: https://docs.ree.ma
- 🐛 Issues: https://github.com/votre-org/REE/issues

---

## Annexes

### A. Scripts Python Disponibles

| Script | Description | Usage |
|--------|-------------|-------|
| `risk_assessment.py` | Évaluation des risques | `python3 risk_assessment.py --repo-path .` |
| `load_predictor.py` | Prédiction de charge | `python3 load_predictor.py --results results.json` |
| `intelligent_provisioner.py` | Provisionnement | `python3 intelligent_provisioner.py --environment prod` |
| `health_monitor.py` | Monitoring post-deploy | `python3 health_monitor.py --url http://api --duration 300` |

### B. Commandes Docker Utiles

```bash
# Voir tous les conteneurs
docker ps -a

# Nettoyer le système
docker system prune -a --volumes

# Inspecter un conteneur
docker inspect <container-id>

# Copier des fichiers
docker cp <container-id>:/path/to/file ./local/path

# Statistiques des ressources
docker stats --no-stream
```

### C. Variables d'Environnement Complètes

Voir le fichier `.env.example` pour la liste complète des variables d'environnement configurables.

---

**Document maintenu par** : Équipe DevOps REE
**Dernière mise à jour** : 17 Décembre 2025
**Version** : 1.0
