# 🤖 Système de Maintenance Prédictive Intelligente

Ce système utilise l'IA pour détecter les anomalies, prioriser les incidents et suggérer des corrections automatiques pour l'application REE.

## 📋 Composants du Système

### 1. Détecteur d'Anomalies (anomaly_detector.py)
**Fonctionnalité :** Détection d'anomalies basée sur l'IA

**Détecte :**
- Fuites mémoire potentielles
- Pics CPU anormaux
- Rafales d'erreurs (error bursts)
- Requêtes lentes (slow queries)
- Épuisement des connexions
- Problèmes d'espace disque

**Sortie :** `anomaly-report.json`

### 2. Priorisateur d'Incidents (incident_prioritizer.py)
**Fonctionnalité :** Priorisation intelligente des incidents

**Niveaux de priorité :**
- **P0 - CRITICAL** : Action immédiate (SLA: 1h)
- **P1 - HIGH** : Urgent (SLA: 4h)
- **P2 - MEDIUM** : Important (SLA: 24h)
- **P3 - LOW** : Normal (SLA: 72h)
- **P4 - TRIVIAL** : Backlog (SLA: 1 semaine)

**Sortie :** `incident-priorities.json`

### 3. Suggéreur de Corrections Auto (auto_fix_suggester.py)
**Fonctionnalité :** Suggestions de corrections automatiques

**Propose :**
- Corrections automatisées (avec commandes exécutables)
- Corrections manuelles (avec procédures détaillées)
- Plan d'exécution avec timeline
- Commandes de rollback

**Sortie :** `fix-suggestions.json`

### 4. Orchestrateur de Maintenance (maintenance_orchestrator.py)
**Fonctionnalité :** Coordonne tous les systèmes

**Exécute :**
1. Détection d'anomalies
2. Priorisation d'incidents
3. Génération de suggestions
4. Rapport consolidé

**Sortie :** `maintenance-report.json`

---

## 🚀 Utilisation

### Option 1 : Orchestrateur Complet (Recommandé)

```bash
# Avec résultats k6 et logs
python3 deployment/scripts/maintenance_orchestrator.py \
  --metrics load-test-results.json \
  --logs backend/logs/app.log \
  --output maintenance-report.json

# Avec rapport de santé uniquement
python3 deployment/scripts/maintenance_orchestrator.py \
  --health-report deployment/reports/health-report.json \
  --output maintenance-report.json
```

### Option 2 : Exécution Manuelle Étape par Étape

#### Étape 1 : Détection d'Anomalies
```bash
python3 deployment/scripts/anomaly_detector.py \
  --metrics load-test-results.json \
  --logs backend/logs/app.log \
  --output anomaly-report.json
```

#### Étape 2 : Priorisation des Incidents
```bash
python3 deployment/scripts/incident_prioritizer.py \
  --anomaly-report anomaly-report.json \
  --health-report deployment/reports/health-report.json \
  --output incident-priorities.json
```

#### Étape 3 : Suggestions de Corrections
```bash
python3 deployment/scripts/auto_fix_suggester.py \
  --incident-report incident-priorities.json \
  --output fix-suggestions.json
```

---

## 📊 Format des Rapports

### Rapport d'Anomalies
```json
{
  "timestamp": "2025-12-18T15:00:00",
  "health_status": "WARNING",
  "health_score": 75,
  "total_anomalies": 3,
  "anomalies": [
    {
      "type": "PERFORMANCE_DEGRADATION",
      "severity": "MEDIUM",
      "confidence": 0.75,
      "description": "Tail latency issue detected",
      "recommendation": "Optimize slow database queries"
    }
  ]
}
```

### Rapport de Priorisation
```json
{
  "total_incidents": 5,
  "priority_counts": {
    "P0": 1,
    "P1": 2,
    "P2": 2
  },
  "action_plan": [
    {
      "priority": "IMMEDIATE",
      "action": "Address all P0 critical incidents",
      "deadline": "1 hour"
    }
  ]
}
```

### Rapport de Suggestions
```json
{
  "total_automated_fixes": 3,
  "total_manual_fixes": 5,
  "execution_plan": {
    "immediate_actions": [
      {
        "action": "Scale Backend Horizontally",
        "command": "docker-compose up -d --scale backend=5",
        "estimated_time": "2 minutes"
      }
    ]
  }
}
```

---

## 🛠️ Corrections Automatisées Disponibles

### Performance
- **Scale Backend** : `docker-compose up -d --scale backend=5`
- **Augmenter CPU** : Modification des limites de ressources
- **Ajouter Index DB** : Création d'index sur colonnes fréquentes

### Erreurs
- **Restart Service** : `docker-compose restart backend`
- **Clear Cache** : Vidage du cache applicatif
- **Restart All** : Redémarrage complet des services

### Optimisation
- **Enable Query Cache** : Activation du cache MySQL
- **Connection Pooling** : Configuration du pool de connexions

---

## 📈 Score de Maintenance

Le système calcule un **Score de Maintenance (0-100)** basé sur :

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | 🟢 EXCELLENT | Continue monitoring |
| 60-79 | 🟡 GOOD | Plan preventive maintenance |
| 40-59 | 🟠 NEEDS ATTENTION | Address issues this week |
| 0-39 | 🔴 CRITICAL | Immediate action required |

**Formule :**
```
Score = (Health × 50%) + (Incidents × 30%) + (Fix Coverage × 20%)
```

---

## 🔄 Workflow Recommandé

### Workflow Quotidien
```bash
# 1. Exécuter le monitoring de santé (5 min)
python3 deployment/scripts/health_monitor.py \
  --url http://localhost:5001 \
  --duration 300

# 2. Lancer l'orchestrateur de maintenance
python3 deployment/scripts/maintenance_orchestrator.py \
  --health-report health-report.json

# 3. Appliquer les corrections automatiques P0/P1
# (selon les suggestions du rapport)
```

### Workflow Après Load Test
```bash
# 1. Lancer test de charge k6
k6 run deployment/k6/load-test.js

# 2. Analyser avec l'orchestrateur
python3 deployment/scripts/maintenance_orchestrator.py \
  --metrics load-test-results.json

# 3. Appliquer corrections suggérées
```

### Workflow CI/CD
```yaml
# Exemple intégration CI/CD
- name: Run Maintenance Analysis
  run: |
    python3 deployment/scripts/maintenance_orchestrator.py \
      --metrics test-results.json \
      --output maintenance-report.json

- name: Check Maintenance Score
  run: |
    SCORE=$(jq '.maintenance_score' maintenance-report.json)
    if [ $SCORE -lt 60 ]; then
      echo "Maintenance score too low: $SCORE"
      exit 1
    fi
```

---

## 🎯 Exemples d'Utilisation

### Exemple 1 : Analyse Post-Incident
```bash
# Un incident s'est produit, analyser la situation
python3 deployment/scripts/maintenance_orchestrator.py \
  --logs backend/logs/error.log \
  --health-report deployment/reports/health-report.json

# Consulter les suggestions
cat fix-suggestions.json | jq '.execution_plan.immediate_actions'
```

### Exemple 2 : Maintenance Préventive
```bash
# Analyse hebdomadaire
python3 deployment/scripts/maintenance_orchestrator.py \
  --metrics last-week-metrics.json \
  --logs backend/logs/app.log

# Extraire les actions long-terme
cat maintenance-report.json | jq '.action_items[] | select(.priority=="PREVENTIVE")'
```

### Exemple 3 : Debugging Performance
```bash
# Détecter les anomalies de performance
python3 deployment/scripts/anomaly_detector.py \
  --metrics load-test-results.json

# Consulter les anomalies de type performance
cat anomaly-report.json | jq '.anomalies[] | select(.type | contains("PERFORMANCE"))'
```

---

## 🔐 Sécurité et Risques

### Niveaux de Risque des Corrections Automatiques

| Niveau | Description | Action Requise |
|--------|-------------|----------------|
| **LOW** | Aucun impact sur la disponibilité | Peut être automatisé |
| **MEDIUM** | Impact mineur, downtime < 1min | Nécessite validation |
| **HIGH** | Downtime significatif | Nécessite fenêtre de maintenance |

### Bonnes Pratiques

1. **Toujours tester en staging d'abord**
2. **Avoir un plan de rollback**
3. **Notifier l'équipe avant les corrections HIGH risk**
4. **Logger toutes les actions automatisées**
5. **Monitorer après application des corrections**

---

## 📚 Dépendances

```bash
# Python 3.8+
python3 --version

# Aucune dépendance externe requise
# Utilise uniquement la bibliothèque standard Python
```

---

## 🐛 Dépannage

### Erreur : "No input sources provided"
```bash
# Solution : Fournir au moins une source de données
python3 deployment/scripts/maintenance_orchestrator.py --metrics load-test-results.json
```

### Erreur : "Cannot load report"
```bash
# Solution : Vérifier que les rapports existent
ls -la *.json
```

### Pas d'anomalies détectées
```bash
# Normal si le système fonctionne bien
# Score de maintenance devrait être > 80
```

---

## 📞 Support

Pour toute question ou suggestion :
1. Consulter les logs : `cat maintenance-report.json`
2. Vérifier les rapports individuels dans `deployment/reports/`
3. Créer une issue sur le repository GitHub

---

## 🔄 Mises à Jour Futures

Améliorations prévues :
- [ ] Machine Learning pour prédictions plus précises
- [ ] Intégration avec Prometheus/Grafana
- [ ] Notifications automatiques (Slack, Email)
- [ ] Dashboard web interactif
- [ ] Auto-healing complet (corrections automatiques)
- [ ] Historique et trending d'anomalies

---

**Version :** 1.0.0
**Dernière mise à jour :** 2025-12-18
