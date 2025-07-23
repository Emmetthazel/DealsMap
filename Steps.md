## 🏁 Sprint 0 – Setup & Préparation : Étapes détaillées

### 1. **Préparation de l’environnement de développement**

- Installer Python 3.13.2
- Installer Node.js v20.18.0 et npm
- Installer PostgreSQL 17.4 et l’extension PostGIS
- Installer VS Code
- Installer Git
- Installer Postman et pgAdmin

---

### 2. **Initialisation du repository Git**

- Créer un nouveau dossier pour le projet (`MyDealsMap`)
- Initialiser un dépôt Git (`git init`)
- Créer un `.gitignore` adapté (Python, Node, etc.)
- Créer un repository distant (GitHub) et le lier

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

  ###### apps/

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

  ###### src/

  -`components/`

  -`pages/`

  -`hooks/`

  -`services/`

  -`utils/`

  -`styles/`
- Lancer l’app React pour vérifier que tout fonctionne
