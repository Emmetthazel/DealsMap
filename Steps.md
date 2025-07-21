## 🏁 Sprint 0 – Setup & Préparation : Étapes détaillées

### 1. **Préparation de l’environnement de développement**

- Installer Python 3.9+
- Installer Node.js 18+ et npm
- Installer PostgreSQL 14+ et l’extension PostGIS
- Installer VS Code
- Installer Git
- Installer Postman et pgAdmin

---

### 2. **Initialisation du repository Git**

- Créer un nouveau dossier pour le projet (`MyDealsMap`)
- Initialiser un dépôt Git (`git init`)
- Créer un `.gitignore` adapté (Python, Node, etc.)
- Créer un repository distant (GitHub, GitLab…) et le lier

---

### 3. **Mise en place de la base de données**

- Créer une base PostgreSQL nommée `dealsmap`
- Activer l’extension PostGIS sur cette base
- Créer un utilisateur PostgreSQL dédié au projet (avec mot de passe sécurisé)
- Tester la connexion à la base via pgAdmin

---

### 4. **Initialisation du Backend (Django + DRF)**

- Créer un environnement virtuel Python (`python -m venv venv`)
- Activer l’environnement virtuel
- Installer Django, djangorestframework, psycopg2, django-cors-headers, etc.
- Créer le projet Django (`django-admin startproject dealsmap`)
- Créer les apps de base :

  -`authentication` (gestion utilisateurs)

  -`businesses` (établissements)

  -`deals` (offres)

  -`reviews` (avis)

  -`categories` (catégories)
- Configurer la connexion à PostgreSQL/PostGIS dans `settings.py`
- Appliquer les premières migrations (`python manage.py migrate`)
- Créer un superuser pour l’admin Django
- Tester l’accès à l’admin Django

---

### 5. **Initialisation du Frontend (React + OpenLayers)**

- Créer le dossier `frontend`
- Initialiser le projet React (`npx create-react-app .`)
- Installer les dépendances : OpenLayers, axios, tailwindcss, etc.
- Organiser la structure des dossiers :

  -`components/`

  -`pages/`

  -`hooks/`

  -`services/`

  -`utils/`

  -`styles/`
- Lancer l’app React pour vérifier que tout fonctionne

---

### 6. **Documentation technique**

- Créer un dossier `docs/` ou un fichier `README.md`
- Documenter :

  - Les prérequis techniques
  - Les commandes d’installation et de lancement
  - L’architecture du projet (schéma, explications)
  - Les accès à la base de données
  - Les conventions de code

---

### 7. **Partage et validation des mockups**

- Créer ou récupérer les mockups (Figma, PDF, etc.)
- Les partager avec le mentor pour validation
- Les stocker dans le repo ou un dossier partagé

---

### 8. **Formation rapide sur les technos (si besoin)**

- Prendre 1-2 jours pour se former sur :

  - Django REST Framework (tutos, docs)
  - OpenLayers (tutos, exemples)
  - PostGIS (bases de la géolocalisation)
  - JWT Auth (concepts, exemples)

---

## 📝 Résumé des livrables Sprint 0

- Environnement prêt (Python, Node, PostgreSQL/PostGIS, outils)
- Repo Git initialisé et structuré
- Backend Django avec apps de base
- Frontend React initialisé
- Base de données opérationnelle
- Documentation technique
- Mockups validés
