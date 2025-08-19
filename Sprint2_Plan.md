# Sprint 2 – Logique Métier Centrale (Semaines 2)

**Membres de l’équipe :**

- **Abdelkhalek** – Établissements (Backend + Frontend)
- **Zineb** – Offres / Deals (Backend + Frontend)

**Durée :** 7 jours
**Objectif :** Implémenter la logique métier principale avec gestion des établissements géolocalisés et des deals, incluant un tableau de bord propriétaire fonctionnel et des API géospatiales performantes.

---

## 📅 Plan sur 7 jours
 - [X] Intégrer `/deals` API avec filtres dans le frontend.
 - [X] Ajouter statistiques deals (ventes, vues, conversions).

#### **Abdelkhalek** – Établissements

- [X] Configurer **PostGIS** dans Django.
 - [X] Ajouter **Redis cache** pour `/deals`.
 - [X] Optimiser formulaires et filtres.
  - `location` (PointField SRID 4326).
  - `opening_hours` (JSONField).
  - `is_active`, `is_verified`.
- [X] Créer un **index spatial** sur `location`.
 - [X] QA et correction de bugs.
 - [X] Tests backend pour les endpoints.
 - [X] Tests frontend pour formulaires et services.
- [X] Créer le modèle `Deal` lié à `Business` (ForeignKey).
- [X] Champs :
  - `original_price`, `deal_price`, `discount_percentage`.
  - `max_uses`, `current_uses`.
 - [X] Tous les tests passent.
 - [X] Scénario complet fonctionne :
   1. Créer un établissement.
   2. Ajouter des deals.
   3. Rechercher via géolocalisation.
   4. Voir statistiques dans dashboard.
- [X] Données insérables via Django Admin.
- [X] La relation Business → Deal fonctionne.

---
 - [X] Modèle `Business` stocke coordonnées via PostGIS.
 - [X] Modèle `Deal` applique toutes les règles métier.
 - [X] Endpoints `/nearby` et `/deals` filtrent correctement (<500ms).
 - [X] Redis actif pour les requêtes fréquentes.

- [X] Configurer l’upload d’images pour les établissements (**Pillow**).
- [X] Méthodes custom dans le modèle :
  - `get_nearby(lat, lng, radius)`.
 - [X] Formulaires valident les données avant envoi.
 - [X] Upload d’images avec aperçu et enregistrement correct.
 - [X] Dashboard affiche stats correctes.
 - [X] Responsive sur mobile & desktop.
- [X] Configurer l’upload d’images pour les deals (dossier séparé).
- [X] Méthode `clean()` :
  - Valider durée ≤ 4 semaines.
  - Calcul automatique de `discount_percentage`.
 - [X] Flux complet testé : création Business → ajout Deals → recherche → stats.
 - [X] Aucun bug bloquant ou erreur API.
**Validation :**

- [X] Upload d’images fonctionnel et stocké au bon endroit.
- [X] Erreurs levées si contraintes non respectées.

---

### **Jour 3**

#### **Abdelkhalek** – Établissements

- [X] Créer l’endpoint `/api/businesses/nearby/` :
  - Filtres : `category`, `distance`, `rating`.
  - Pagination optimisée.

#### Zineb – Deals

- [X] Créer l’endpoint `/api/deals/` :
  - Filtres : `category`, `distance`.
  - Pagination optimisée.

**Validation :**

- [X] Endpoints renvoient les bonnes données.
- [X] Requêtes avec paramètres (`lat`, `lng`, `radius`) fonctionnelles.
- [X] Pagination correcte.

---

### **Jour 4**

#### **Abdelkhalek** – Établissements

- [X] Frontend : Créer `BusinessForm` :
  - Informations, horaires, upload d’images avec aperçu.
- [X] Implémenter `BusinessService` (CRUD + images).
- [X] Implémenter `GeoService` (géolocalisation + calculs de distance).

#### Zineb – Deals

- [X] Frontend : Créer `DealForm` :
  - Prix, dates, upload d’images avec aperçu.
- [X] Implémenter `DealService` (CRUD + validation côté client).

**Validation :**

- [X] Sauvegarde correcte des formulaires.
- [X] Validation côté client empêche les données invalides.

---

### **Jour 5**

#### **Abdelkhalek** – Établissements

- [X] Intégrer `/nearby` API dans la recherche frontend.
- [X] Ajouter `StatsCards` pour établissements (deals actifs, vues).

#### Zineb – Deals

 - [X] Intégrer `/deals` API avec filtres dans le frontend.
 - [X] Ajouter statistiques deals (ventes, vues, conversions).

**Validation :**

- [X] Recherche renvoie bien les établissements proches.
- [X] Statistiques mises à jour dynamiquement.

---

### **Jour 6**

#### **Abdelkhalek** – Établissements

- [X] Ajouter **Redis cache** pour `/nearby`.
- [X] Optimiser états de chargement/erreur.
- [X] Rendre le tableau de bord responsive.

#### Zineb – Deals

 - [X] Ajouter **Redis cache** pour `/deals`.
 - [X] Optimiser formulaires et filtres.

**Validation :**

- [X] Cache améliore la vitesse des requêtes récurrentes.
- [X] Interface utilisable sur mobile et desktop.

---

### **Jour 7**

#### **Abdelkhalek** & Zineb – Ensemble

 - [X] QA et correction de bugs.
- [ ] Tests backend pour les endpoints.
- [ ] Tests frontend pour formulaires et services.

**Validation :**

 - [X] Tous les tests passent.
 - [X] Scénario complet fonctionne :
  1. Créer un établissement.
  2. Ajouter des deals.
  3. Rechercher via géolocalisation.
  4. Voir statistiques dans dashboard.

---

## ✅ Checklist de Fonctionnalités

### Backend

 - [X] Modèle `Business` stocke coordonnées via PostGIS.
 - [X] Modèle `Deal` applique toutes les règles métier.
 - [X] Endpoints `/nearby` et `/deals` filtrent correctement (<500ms).
 - [X] Redis actif pour les requêtes fréquentes.

### Frontend

 - [X] Formulaires valident les données avant envoi.
 - [X] Upload d’images avec aperçu et enregistrement correct.
 - [X] Dashboard affiche stats correctes.
 - [X] Responsive sur mobile & desktop.

### Intégration

 - [X] Flux complet testé : création Business → ajout Deals → recherche → stats.
 - [X] Aucun bug bloquant ou erreur API.
