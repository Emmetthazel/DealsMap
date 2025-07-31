## 🏁 Sprint 0 – Setup & Preparation: Detailed Steps

### 1. **Development Environment Preparation**

- Install Python 3.11
- Install PostgreSQL 17.4 and PostGIS 3.5 extension
- Install VS Code
- Install Git
- Install Postman and pgAdmin

---

### 2. **Git Repository Initialization**

- Create a new project folder (`DealsMap`)
- Initialize a Git repository (`git init`)
- Create a `.gitignore` for Python, Node, etc.
- Create a remote repository (GitHub) and link it

---

### 3. **Docker Environment Setup**

- Install Docker and Docker Compose
- Create a `docker-compose.yml` with these services:
  - PostgreSQL with PostGIS (port 5432)
  - Redis for cache/queue (port 6379)
  - Django backend (port 8000)
  - React frontend (port 5173)
  - Celery worker (background tasks)
- Configure persistent volumes for the database
- Create Dockerfiles for backend and frontend

---

### 4. **Database Setup**

- Create a PostgreSQL database named `dealsmap`
- Enable PostGIS and PostGIS_topology extensions
- Create a dedicated PostgreSQL user with a secure password
- Test database connection via pgAdmin

---

### 5. **Backend Initialization (Django + DRF, with Docker)**

- Use Docker for backend development:
  - Write a `Dockerfile` for Django backend
  - Build and run the backend container with Docker Compose
- Install Django, djangorestframework, psycopg2, django-cors-headers, django-redis, celery (in Docker)
- Start the Django project (`django-admin startproject dealsmap`)
- Create base apps:
  - authentication, businesses, deals, reviews, categories, analytics, notifications
- Configure PostgreSQL/PostGIS connection in `base.py`
- Apply initial migrations (`python manage.py migrate`) inside the backend container
- Create a Django superuser 
- Test access to Django admin via the running container

---

### 6. **Frontend Initialization (React + OpenLayers, with Docker)**

- Create the `Frontend` folder
- Use Docker for frontend development:
  - Write a `Dockerfile` for React frontend
  - Build and run the frontend container with Docker Compose
- Initialize the React project (`npm create vite@latest .`)
- Install dependencies: OpenLayers, axios, tailwindcss, etc.
- Organize folder structure:
  - components/, pages/, hooks/, services/, utils/, store/
- Launch the React app via Docker Compose to verify setup

---

### 7. **Basic Integration & Testing**

- Test Docker Compose setup (`docker compose up`)
- Verify all containers start correctly
- Check frontend at [http://localhost:5173](http://localhost:5173)
- Check backend at [http://localhost:8000](http://localhost:8000)
- Confirm database and Redis connectivity
- Run a basic Celery task

---
