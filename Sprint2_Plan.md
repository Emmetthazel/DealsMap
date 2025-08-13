# Sprint 2 – Logique Métier Centrale (Semaines 2)

**Membres de l’équipe :**

- **Abdelkhalek** – Établissements (Backend + Frontend)
- **Zineb** – Offres / Deals (Backend + Frontend)

**Durée :** 7 jours
**Objectif :** Implémenter la logique métier principale avec gestion des établissements géolocalisés et des deals, incluant un tableau de bord propriétaire fonctionnel et des API géospatiales performantes.

---

## 📅 Plan sur 7 jours

### **Jour 1**

#### **Abdelkhalek** – Établissements

- [X] Configurer **PostGIS** dans Django.
- [X] Créer le modèle `Business` :
  - `name`, `address`, `city`, `postal_code`.
  - `location` (PointField SRID 4326).
  - `opening_hours` (JSONField).
  - `is_active`, `is_verified`.
- [X] Créer un **index spatial** sur `location`.

#### Zineb – Deals

- [X] Créer le modèle `Deal` lié à `Business` (ForeignKey).
- [X] Champs :
  - `original_price`, `deal_price`, `discount_percentage`.
  - `max_uses`, `current_uses`.
  - `start_date`, `end_date`.
- [X] Contraintes par défaut sur les dates.

**Validation :**

- [X] Les migrations s’exécutent correctement.
- [X] Données insérables via Django Admin.
- [X] La relation Business → Deal fonctionne.

---

### **Jour 2**

#### **Abdelkhalek** – Établissements

- [X] Configurer l’upload d’images pour les établissements (**Pillow**).
- [X] Méthodes custom dans le modèle :
  - `get_nearby(lat, lng, radius)`.
  - `calculate_distance(lat, lng)`.

#### Zineb – Deals

- [ ] Configurer l’upload d’images pour les deals (dossier séparé).
- [ ] Méthode `clean()` :
  - Valider durée ≤ 4 semaines.
  - Calcul automatique de `discount_percentage`.
  - Vérifier les limites d’utilisation.

**Validation :**

- [X] Upload d’images fonctionnel et stocké au bon endroit.
- [ ] Erreurs levées si contraintes non respectées.

---

### **Jour 3**

#### **Abdelkhalek** – Établissements

- [X] Créer l’endpoint `/api/businesses/nearby/` :
  - Filtres : `category`, `distance`, `rating`.
  - Pagination optimisée.

#### Zineb – Deals

- [ ] Créer l’endpoint `/api/deals/` :
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

- [ ] Frontend : Créer `DealForm` :
  - Prix, dates, upload d’images avec aperçu.
- [ ] Implémenter `DealService` (CRUD + validation côté client).

**Validation :**

- [X] Sauvegarde correcte des formulaires.
- [X] Validation côté client empêche les données invalides.

---

### **Jour 5**

#### **Abdelkhalek** – Établissements

- [X] Intégrer `/nearby` API dans la recherche frontend.
- [X] Ajouter `StatsCards` pour établissements (deals actifs, vues).

#### Zineb – Deals

- [ ] Intégrer `/deals` API avec filtres dans le frontend.
- [ ] Ajouter statistiques deals (ventes, vues, conversions).

**Validation :**

- [ ] Recherche renvoie bien les établissements proches.
- [ ] Statistiques mises à jour dynamiquement.

---

### **Jour 6**

#### **Abdelkhalek** – Établissements

- [ ] Ajouter **Redis cache** pour `/nearby`.
- [ ] Optimiser états de chargement/erreur.
- [ ] Rendre le tableau de bord responsive.

#### Zineb – Deals

- [ ] Ajouter **Redis cache** pour `/deals`.
- [ ] Optimiser formulaires et filtres.

**Validation :**

- [ ] Cache améliore la vitesse des requêtes récurrentes.
- [ ] Interface utilisable sur mobile et desktop.

---

### **Jour 7**

#### **Abdelkhalek** & Zineb – Ensemble

- [ ] QA et correction de bugs.
- [ ] Tests backend pour les endpoints.
- [ ] Tests frontend pour formulaires et services.

**Validation :**

- [ ] Tous les tests passent.
- [ ] Scénario complet fonctionne :
  1. Créer un établissement.
  2. Ajouter des deals.
  3. Rechercher via géolocalisation.
  4. Voir statistiques dans dashboard.

---

## ✅ Checklist de Fonctionnalités

### Backend

- [ ] Modèle `Business` stocke coordonnées via PostGIS.
- [ ] Modèle `Deal` applique toutes les règles métier.
- [ ] Endpoints `/nearby` et `/deals` filtrent correctement (<500ms).
- [ ] Redis actif pour les requêtes fréquentes.

### Frontend

- [ ] Formulaires valident les données avant envoi.
- [ ] Upload d’images avec aperçu et enregistrement correct.
- [ ] Dashboard affiche stats correctes.
- [ ] Responsive sur mobile & desktop.

### Intégration

- [ ] Flux complet testé : création Business → ajout Deals → recherche → stats.
- [ ] Aucun bug bloquant ou erreur API.
