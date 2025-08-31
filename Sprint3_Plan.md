# Sprint 3 – Carte & Expérience Utilisateur (Semaines 3)

**Membres de l’équipe :**

- **Abdelkhalek** – Map & Filtrage (Backend + Frontend)
- **Zineb** – Reviews & Optimisation Frontend (Backend + Frontend)

**Durée :** 7 jours
**Objectif :** Créer l’expérience utilisateur principale avec carte interactive, filtres avancés, système d’avis et PWA.

---

## 📅 Plan sur 7 jours

### **Jour 1 – Intégration OpenLayers**

#### **Abdelkhalek** – Map

- [X] Installer et configurer OpenLayers avec React.
- [X] Créer `MapContainer` avec tuiles OpenStreetMap.
- [X] Implémenter géolocalisation utilisateur.
- [X] Ajouter marqueurs dynamiques par catégorie.
- [X] Popups informatifs au clic sur marqueur.
- [X] Contrôles : zoom, centrage, plein écran.
- [X] Clustering intelligent des marqueurs proches.

**Validation :**

- [X] Carte responsive et fluide.
- [X] Marqueurs cliquables avec popups corrects.
- [X] Clustering fonctionnel.

#### Zineb – Reviews (préparation backend)

- [X] Créer modèle `Review` :
  - `user`, `business`, `deal`, `rating` (1-5 étoiles, demi-étoiles), `comment`.
- [X] Ajouter contraintes : un avis par utilisateur et business/deal.
- [X] Implémenter modération automatique (spam/contenu inapproprié).

**Validation :**

- [X] Reviews enregistrées avec contraintes respectées.
- [X] Contenu inapproprié détecté.

---

### **Jour 2 – Filtres Avancés**

#### **Abdelkhalek** – Map & Filtrage

- [X] Composant `FilterPanel` avec état local.
- [X] Filtres géographiques : slider distance, ville, quartier.
- [X] Multi-sélection catégories avec recherche.
- [X] Range slider pour pourcentage de réduction.
- [X] Filtres temporels : expire dans X jours.
- [X] Sauvegarde filtres dans localStorage/backend.
- [X] URL state pour partage de recherches.

**Validation :**

- [X] Filtres combinables et résultats temps réel.
- [X] Sauvegarde fonctionnelle (localStorage ou backend).
- [X] Partage de recherche via URL fonctionne.

#### Zineb – Reviews (frontend)

- [X] Frontend : composants `RatingStars` et `ReviewForm`.
- [X] Affichage des avis pour business et deals.
- [X] Notifications aux propriétaires pour nouveaux avis.

**Validation :**

- [X] Avis soumis correctement.
- [X] Affichage dynamique des notes et commentaires.
- [X] Notifications déclenchées correctement.

---

### **Jour 3 – Modération et calcul notes**

#### **Abdelkhalek** – Map (backend filtrage)

- [X] Endpoint pour filtres combinés (catégories, distance, deals).
- [X] Endpoint pour sauvegarde/recharge filtres favoris.

**Validation :**

- [X] API filtre correctement les résultats.
- [X] Sauvegarde/restauration des filtres fonctionne.

#### Zineb – Reviews

- [X] Interface admin pour modération manuelle.
- [X] Calcul de la moyenne des notes en temps réel.
- [X] Réponses des propriétaires aux avis.

**Validation :**

- [X] Modération effective (spam et contenu inapproprié bloqués).
- [X] Moyenne des notes correcte.
- [X] Réponses visibles pour chaque avis.

---

### **Jour 4 – Optimisation performance frontend**

#### **Abdelkhalek** – Map & Filtrage

- [X] Lazy loading pages avec `React.lazy`.
- [X] Memoization composants coûteux (`React.memo`, `useMemo`, `useCallback`).

#### Zineb – Frontend optimisations générales

- [X] Virtual scrolling pour listes longues de deals.
- [X] Optimisation images (WebP, lazy loading, CDN).
- [X] Service Worker pour cache statique.
- [X] Debouncing pour recherche et filtres.
- [X] Préchargement données critiques.

**Validation :**

- [X] Lighthouse score > 85.
- [X] First Contentful Paint < 1.5s.
- [X] Performance fluide avec grande quantité de données.

---

### **Jour 5 – PWA Implementation**

#### **Abdelkhalek** – Map & Frontend

- [X] Configurer `Service Worker` avec Workbox.
- [X] Offline fallbacks pour pages importantes.
- [X] Installation prompt personnalisé.

#### Zineb – Frontend & Backend PWA

- [X] Manifest.json avec icônes et metadata.
- [X] Cache intelligent pour API (`network-first`).
- [X] Background sync pour actions offline.
- [X] Push notifications avec service worker.

**Validation :**

- [X] Application installable sur mobile/desktop.
- [X] Fonctionnalité offline opérationnelle.
- [X] Notifications push fonctionnent correctement.

---

### **Jour 6 – Tests et QA**

#### **Abdelkhalek** & Zineb

- [X] Tests frontend pour Map, filtres et PWA.
- [X] Tests backend pour endpoints filtres et reviews.
- [X] Correction des bugs détectés.

**Validation :**

- [X] Flux complet testé : carte interactive → filtres → avis → PWA.
- [X] Aucun bug bloquant.
