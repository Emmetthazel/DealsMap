# Sprint 4 – Analytics & Déploiement (Semaines 4)

**Membres de l’équipe :**

- **Abdelkhalek** – Backend (Analytics, Notifications, Infra, CI/CD)
- **Zineb** – Frontend (Dashboard, UI sociale, Tests E2E)

**Durée :** 7 jours
**Objectif :** Finaliser avec analytics avancés, notifications temps réel, fonctionnalités sociales et déploiement en production.

---

## 📅 Plan sur 7 jours

### **Jour 1 – Analytics Dashboard Propriétaire**

#### **Abdelkhalek** – Backend

- [ ] Créer modèles `Analytics` et `ViewEvent`.
- [ ] Implémenter système de tracking côté client (non-intrusif).
- [ ] Pipeline ETL pour agrégation données.

#### Zineb – Frontend

- [ ] Dashboard `OwnerAnalytics` avec Recharts (lignes, barres, camemberts).
- [ ] Export des données (CSV, PDF).
- [ ] Tableaux de bord temps réel via WebSocket.
- [ ] Alertes automatiques (performances, tendances).

**Validation :**

- [ ] Dashboard affiche vues, clics, conversions, zones chaudes.
- [ ] Export CSV et PDF fonctionnel.
- [ ] Données temps réel via WebSocket correctes.

---

### **Jour 2 – Notifications WebSocket**

#### **Abdelkhalek** – Backend

- [ ] Configurer Django Channels avec Redis.
- [ ] Créer `NotificationConsumer` WebSocket.
- [ ] Email notifications via Celery.

#### Zineb – Frontend

- [ ] Hook `useNotifications`.
- [ ] Interface pour préférences de notifications.
- [ ] Intégration notifications push navigateur.
- [ ] Historique notifications persistantes.

**Validation :**

- [ ] Notifications temps réel fonctionnent.
- [ ] Préférences utilisateurs respectées.
- [ ] Historique notifications accessible.

---

### **Jour 3 – Features Sociales (Partie 1)**

#### **Abdelkhalek** – Backend

- [ ] Modèles favoris (wishlist), badges, points.
- [ ] Système de parrainage avec tracking.
- [ ] API social proof : "X personnes ont utilisé ce deal".

#### Zineb – Frontend

- [ ] Composant `ShareButton` (réseaux sociaux, liens).
- [ ] Interface favoris (localStorage + backend sync).
- [ ] Profil utilisateur avec historique.

**Validation :**

- [ ] Partage réseaux sociaux opérationnel.
- [ ] Système de favoris fonctionnel.
- [ ] Points, badges et parrainage trackés.

---

### **Jour 4 – Features Sociales (Partie 2)**

#### **Abdelkhalek** – Backend

- [ ] Compteurs utilisation deals temps réel.
- [ ] API Social Login (Google, Facebook).

#### Zineb – Frontend

- [ ] Intégration compteur "X personnes utilisent ce deal".
- [ ] Connexion sociale (Google/Facebook) côté UI.
- [ ] Mise à jour du profil utilisateur (points, badges, favoris).

**Validation :**

- [ ] Social login fonctionne.
- [ ] Social proof visible en temps réel.
- [ ] Profil complet avec historique et gamification.

---

### **Jour 5 – Tests End-to-End**

#### **Abdelkhalek** – Backend

- [ ] Tests unitaires Django : Models, Serializers, Views.
- [ ] Tests d’intégration : API flows complets.
- [ ] Tests de performance (charge, stress).

#### Zineb – Frontend

- [ ] Setup Cypress ou Playwright.
- [ ] Tests parcours utilisateur complet :
  - Inscription → Découverte deals → Utilisation deal
- [ ] Tests parcours propriétaire complet :
  - Création business → Ajout deals → Dashboard analytics
- [ ] Tests responsive multi-navigateurs.
- [ ] Tests accessibilité (WCAG 2.1).

**Validation :**

- [ ] Couverture backend > 85%, frontend > 80%.
- [ ] Tests E2E passent.
- [ ] Accessibilité conforme WCAG 2.1.

---

### **Jour 6 – Déploiement Production**

#### **Abdelkhalek** – Infra

- [ ] Containeriser avec Docker multi-stage.
- [ ] Config environnements (dev/staging/prod).
- [ ] CI/CD GitHub Actions (build, test, deploy).
- [ ] Backend : Gunicorn + Nginx.
- [ ] PostgreSQL managé avec backups.
- [ ] Redis cluster (cache + queue).
- [ ] S3-compatible pour stockage images.
- [ ] SSL/TLS avec Let’s Encrypt.
- [ ] CDN pour assets statiques.

#### Zineb – Support Frontend

- [ ] Vérifier build frontend dans pipeline.
- [ ] Vérifier déploiement responsive sur staging.

**Validation :**

- [ ] Déploiement automatisé sans erreurs.
- [ ] Monitoring actif (logs, métriques).
- [ ] Backups base de données testés.

---

### **Jour 7 – QA Finale & Démo**

#### **Abdelkhalek** & Zineb

- [ ] Tests manuels globaux (utilisateur + propriétaire).
- [ ] Tests performances (Lighthouse CI, stress tests).
- [ ] QA accessibilité et responsive.
- [ ] Préparation de la démo Sprint 4.

**Validation :**

- [ ] App en production, stable, performante.
- [ ] Analytics précis, notifications en temps réel.
- [ ] Fonctionnalités sociales actives.
- [ ] CI/CD opérationnel avec monitoring.

---

## ✅ Checklist Fonctionnalités

### Analytics

- [ ] Dashboard propriétaire complet avec Recharts.
- [ ] Données temps réel via WebSocket.
- [ ] Export CSV et PDF fonctionnel.

### Notifications

- [ ] Notifications push et WebSocket fonctionnelles.
- [ ] Préférences utilisateurs respectées.
- [ ] Historique notifications disponible.

### Social Features

- [ ] Partage réseaux sociaux.
- [ ] Favoris (wishlist) fonctionnels.
- [ ] Gamification (points, badges, niveaux).
- [ ] Parrainage tracké.
- [ ] Social proof temps réel.

### Tests

- [ ] Tests unitaires backend (85%+).
- [ ] Tests frontend (80%+).
- [ ] Tests E2E Cypress/Playwright.
- [ ] Tests performance et accessibilité validés.

### Déploiement

- [ ] Docker + CI/CD opérationnels.
- [ ] Monitoring et logs actifs.
- [ ] Backups DB et médias fonctionnels.
- [ ] SSL/TLS et CDN en place.
