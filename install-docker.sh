#!/bin/bash
# Script d'installation de Docker et Docker Compose pour Ubuntu/Debian

set -e

echo "🐳 Installation de Docker et Docker Compose..."
echo ""

# Mise à jour du système
echo "1️⃣ Mise à jour du système..."
sudo apt-get update

# Installation des prérequis
echo ""
echo "2️⃣ Installation des prérequis..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Ajout de la clé GPG de Docker
echo ""
echo "3️⃣ Configuration du repository Docker..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Ajout du repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installation de Docker
echo ""
echo "4️⃣ Installation de Docker Engine..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Ajout de l'utilisateur au groupe docker
echo ""
echo "5️⃣ Configuration des permissions..."
sudo usermod -aG docker $USER

# Démarrage de Docker
echo ""
echo "6️⃣ Démarrage de Docker..."
sudo service docker start || sudo systemctl start docker

# Vérification de l'installation
echo ""
echo "7️⃣ Vérification de l'installation..."
docker --version
docker compose version

echo ""
echo "✅ Installation terminée avec succès!"
echo ""
echo "⚠️  IMPORTANT: Vous devez vous déconnecter et vous reconnecter pour que les changements prennent effet."
echo "   Ou exécutez: newgrp docker"
echo ""
echo "Pour tester Docker, exécutez:"
echo "  docker run hello-world"
