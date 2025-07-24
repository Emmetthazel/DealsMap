## 🏁 Sprint 0 – Setup & Préparation : Étapes détaillées

### 1. **Préparation de l’environnement de développement**

- Installer Python 3.13.2
- Installer Node.js v20.18.0 et npm
- Installer PostgreSQL 17.4 et l’extension PostGIS 3.5
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

### 3. **Setup Docker Environment**

- Installer `Docker` et `Docker Compose`
- Créer un `docker-compose.yml` avec 3 services :
    ○ PostgreSQL avec PostGIS (port 5432)
    ○ Redis pour cache/queue (port 6379)
    ○ Backend Django (port 8000)
- Configurer les volumes persistants pour la DB

---

### 4. **Mise en place de la base de données**

- Créer une base PostgreSQL nommée `dealsmap`
- Activer l’extension PostGIS et et PostGIS_topology sur cette base
- Créer un utilisateur PostgreSQL dédié au projet (avec mot de passe sécurisé)
- Tester la connexion à la base via pgAdmin

---

### 5. **Initialisation du Backend (Django + DRF)**

- Créer un environnement virtuel Python (`python -m venv venv`)
- Activer l’environnement virtuel
- Installer Django, djangorestframework, psycopg2, django-cors-headers, django-redis.
- Créer le projet Django (`django-admin startproject dealsmap`)
- Créer les apps de base :

  ###### apps/

  -`authentication` (gestion utilisateurs)

  -`businesses` (établissements)

  -`deals` (offres)

  -`reviews` (avis)

  -`categories` (catégories)

  -`analytics` (analytique)

  -`notifications` (notifications)  
- Configurer la connexion à PostgreSQL/PostGIS dans `settings.py`
- Appliquer les premières migrations (`python manage.py migrate`)
- Créer un superuser pour l’admin Django
- Tester l’accès à l’admin Django

---

### 6. **Initialisation du Frontend (React + OpenLayers)**

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

  -`store/`
- Lancer l’app React pour vérifier que tout fonctionne
