# Sprint 1 – Foundation & Authentication (Semaines 1)

## Objectif du Sprint

Créer les fondations solides avec authentification complète, gestion des catégories et API de base.

---

## Répartition des tâches (Approche par fonctionnalité)

| Fonctionnalité            | Responsable           | Backend                                                                                                 | Frontend                                                                                                                                      |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentification complète | **Abdelkhalek** | - Modèle `CustomUser`<br />- API JWT (register/login/logout/refresh)<br />- Serializers & validation | - Pages Login / Register<br /> - Zustand AuthStore<br />- AuthService<br />- PrivateRoute<br />- Formulaires avec `react-hook-form` + Toast |
| Système de catégories    | **Zineb**       | - Modèle `Category` hiérarchique<br />- API avec nested serializers<br />- Fixtures + Cache Redis   | - Composant `CategoryPicker`<br />- Affichage hiérarchique<br />- Mise en cache (Zustand/localStorage)                                     |
| Tests unitaires Sprint 1   | **Partagé**    | - Pytest pour User + Category<br />- Tests API auth + catégories                                       | - React Testing Library : LoginForm, RegisterForm, CategoryPicker                                                                             |

---

## Détail des étapes par développeur

---

### Abdelkhalek – Authentification complète

#### Backend :

- [X] Créer app `authentication`
- [X] Étendre `AbstractUser` (`CustomUser`)
- [X] Champs : `phone`, `user_type`, `is_verified, created_at`
- [X] Configurer `AUTH_USER_MODEL` dans `settings.py`
- [X] Serializers pour inscription et login
- [X] Endpoints : `/api/register/`, `/api/login/`, `/api/logout/`, `/api/profile/`, `/api/token/refresh/`
- [X] Tests avec Postman / Thunder Client

#### Frontend :

- [X] Créer `AuthStore.js` (Zustand)
- [X] Créer `AuthService.js` (API calls)
- [X] Composants :
  - [X] `LoginForm.jsx`
  - [X] `RegisterForm.jsx`
- [X] Ajouter `PrivateRoute.jsx`
- [X] Gérer les erreurs / loading / redirections
- [X] Ajouter des `toasts` pour feedback utilisateur

---

### Zineb – Système de Catégories

#### Backend :

- [X] Créer app `categories`
- [ ] Modèle `Category` avec `parent = models.ForeignKey('self', ...)`
- [ ] Champs : `name`, `slug`, `icon`, `color`
- [ ] API avec ViewSet + nested serializer
- [ ] Ajouter cache Redis (optionnel)
- [ ] Créer des fixtures (base de données de test)

#### Frontend :

- [ ] Composant `CategoryPicker.jsx`
- [ ] Récupérer la structure nested via API
- [ ] Affichage hiérarchique
- [ ] Gérer les erreurs / loading
- [ ] Mettre en cache (Zustand ou localStorage)

---

## Tests (à faire à 2)

### Backend :

- [X] Tests unitaires `User` model + validations
- [X] Tests API auth : register/login/refresh/logout
- [ ] Tests model `Category` + API

### Frontend :

- [X] Tester `LoginForm` et `RegisterForm` (React Testing Library)
- [ ] Tester `CategoryPicker`
- [ ] Couverture visée : **> 80%**

---
