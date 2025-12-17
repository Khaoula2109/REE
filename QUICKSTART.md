# 🚀 Guide de Démarrage Rapide - REE

## Option 1 : Installation Automatique (Recommandé)

### 1. Installer Docker (si non installé)

```bash
# Exécuter le script d'installation
./install-docker.sh

# Se déconnecter et reconnecter, ou exécuter:
newgrp docker

# Tester Docker
docker run hello-world
```

### 2. Démarrer l'Application

```bash
# Le fichier .env est déjà créé avec des valeurs par défaut
# Vous pouvez le modifier si nécessaire:
nano .env

# Démarrer tous les services
docker compose up -d

# Voir les logs
docker compose logs -f

# Vérifier que tout fonctionne
curl http://localhost:5000/health
```

### 3. Accéder à l'Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost | - |
| **Backend API** | http://localhost:5000 | - |
| **API Health** | http://localhost:5000/health | - |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |

---

## Option 2 : Installation Manuelle de Docker

### Ubuntu/Debian

```bash
# 1. Mettre à jour le système
sudo apt-get update

# 2. Installer les prérequis
sudo apt-get install -y ca-certificates curl gnupg

# 3. Ajouter la clé GPG Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 4. Ajouter le repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Installer Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# 7. Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker

# 8. Se déconnecter et reconnecter, ou:
newgrp docker
```

### WSL2 (Windows Subsystem for Linux)

Si vous utilisez WSL2:

```bash
# 1. Installer Docker Desktop pour Windows depuis:
# https://www.docker.com/products/docker-desktop

# 2. Activer l'intégration WSL2 dans Docker Desktop:
#    Settings → Resources → WSL Integration
#    Cocher votre distribution Ubuntu

# 3. Redémarrer WSL
wsl --shutdown
# Puis rouvrir votre terminal WSL

# 4. Vérifier Docker
docker --version
```

---

## 🔧 Commandes Utiles

### Gestion des Services

```bash
# Démarrer tous les services
docker compose up -d

# Arrêter tous les services
docker compose down

# Redémarrer un service spécifique
docker compose restart backend

# Voir les logs
docker compose logs -f backend
docker compose logs -f frontend

# Voir le statut
docker compose ps

# Reconstruire les images
docker compose build --no-cache
docker compose up -d
```

### Gestion de la Base de Données

```bash
# Se connecter à MySQL
docker compose exec mysql mysql -u root -p
# Password: ReeSecureRoot2024!

# Créer un backup
docker compose exec mysql mysqldump -u root -pReeSecureRoot2024! ree_meter_reading > backup.sql

# Restaurer un backup
docker compose exec -T mysql mysql -u root -pReeSecureRoot2024! ree_meter_reading < backup.sql

# Voir les logs MySQL
docker compose logs mysql
```

### Débogage

```bash
# Entrer dans un conteneur
docker compose exec backend sh
docker compose exec frontend sh

# Voir les variables d'environnement
docker compose exec backend env

# Inspecter un conteneur
docker compose exec backend ps aux

# Voir l'utilisation des ressources
docker stats
```

### Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker compose down

# Arrêter et supprimer les conteneurs + volumes
docker compose down -v

# Nettoyer tout Docker
docker system prune -a --volumes
```

---

## 🐛 Dépannage

### Problème : Port déjà utilisé

```bash
# Trouver le processus utilisant le port 5000
sudo lsof -i :5000
# ou
sudo netstat -tulpn | grep :5000

# Tuer le processus
sudo kill -9 <PID>

# Ou changer le port dans .env
nano .env
# Modifier BACKEND_PORT=5001
```

### Problème : Permission denied

```bash
# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Appliquer les changements
newgrp docker

# Ou se déconnecter et reconnecter
```

### Problème : Images pas à jour

```bash
# Reconstruire toutes les images
docker compose build --no-cache

# Supprimer les anciennes images
docker image prune -a

# Relancer
docker compose up -d
```

### Problème : Base de données ne démarre pas

```bash
# Voir les logs
docker compose logs mysql

# Supprimer le volume et recommencer
docker compose down -v
docker compose up -d

# Attendre que MySQL soit prêt
docker compose exec mysql mysqladmin ping -h localhost -u root -pReeSecureRoot2024!
```

---

## 📊 Tests et Monitoring

### Health Checks

```bash
# API Backend
curl http://localhost:5000/health

# Frontend
curl http://localhost/health

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3001/api/health
```

### Tests de Charge

```bash
# Installer k6 (si non installé)
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Lancer les tests
export API_URL=http://localhost:5000
k6 run deployment/k6/load-test.js
```

### Monitoring avec Grafana

```bash
# Accéder à Grafana
open http://localhost:3001

# Login: admin / admin
# Dashboards disponibles automatiquement
```

---

## 📚 Documentation Complète

Pour plus d'informations, consultez:

- **DEPLOYMENT.md** - Guide de déploiement complet
- **CAHIER_TESTS.md** - Documentation des tests
- **README.md** - Vue d'ensemble du projet

---

## 🆘 Aide

Si vous rencontrez des problèmes:

1. **Vérifier les logs** : `docker compose logs -f`
2. **Vérifier Docker** : `docker --version` et `docker ps`
3. **Consulter la documentation** : DEPLOYMENT.md
4. **Issues GitHub** : Créer une issue sur le repository

---

**Bon déploiement! 🚀**
