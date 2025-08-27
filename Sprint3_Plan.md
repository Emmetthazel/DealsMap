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

- [ ] Endpoint pour filtres combinés (catégories, distance, deals).
- [ ] Endpoint pour sauvegarde/recharge filtres favoris.

**Validation :**

- [ ] API filtre correctement les résultats.
- [ ] Sauvegarde/restauration des filtres fonctionne.

#### Zineb – Reviews

- [ ] Interface admin pour modération manuelle.
- [ ] Calcul de la moyenne des notes en temps réel.
- [ ] Réponses des propriétaires aux avis.

**Validation :**

- [ ] Modération effective (spam et contenu inapproprié bloqués).
- [ ] Moyenne des notes correcte.
- [ ] Réponses visibles pour chaque avis.

---

### **Jour 4 – Optimisation performance frontend**

#### **Abdelkhalek** – Map & Filtrage

- [ ] Lazy loading pages avec `React.lazy`.
- [ ] Memoization composants coûteux (`React.memo`, `useMemo`, `useCallback`).

#### Zineb – Frontend optimisations générales

- [ ] Virtual scrolling pour listes longues de deals.
- [ ] Optimisation images (WebP, lazy loading, CDN).
- [ ] Service Worker pour cache statique.
- [ ] Debouncing pour recherche et filtres.
- [ ] Préchargement données critiques.

**Validation :**

- [ ] Lighthouse score > 85.
- [ ] First Contentful Paint < 1.5s.
- [ ] Performance fluide avec grande quantité de données.

---

### **Jour 5 – PWA Implementation**

#### **Abdelkhalek** – Map & Frontend

- [ ] Configurer `Service Worker` avec Workbox.
- [ ] Offline fallbacks pour pages importantes.
- [ ] Installation prompt personnalisé.

#### Zineb – Frontend & Backend PWA

- [ ] Manifest.json avec icônes et metadata.
- [ ] Cache intelligent pour API (`network-first`).
- [ ] Background sync pour actions offline.
- [ ] Push notifications avec service worker.

**Validation :**

- [ ] Application installable sur mobile/desktop.
- [ ] Fonctionnalité offline opérationnelle.
- [ ] Notifications push fonctionnent correctement.

---

### **Jour 6 – Tests et QA**

#### **Abdelkhalek** & Zineb

- [ ] Tests frontend pour Map, filtres et PWA.
- [ ] Tests backend pour endpoints filtres et reviews.
- [ ] Correction des bugs détectés.

**Validation :**

- [ ] Flux complet testé : carte interactive → filtres → avis → PWA.
- [ ] Aucun bug bloquant.

---

### **Jour 7 – Finalisation et Démo**

#### Abdo & Zineb

- [ ] QA finale et merge vers `dev`.
- [ ] Préparer démonstration Sprint 3.
- [ ] Vérification des performances et accessibilité.

**Validation :**

- [ ] Carte interactive, filtres et reviews fonctionnent ensemble.
- [ ] PWA installable, responsive et offline.
- [ ] Démo prête sans bug.

---

## ✅ Checklist Fonctionnalités

### Carte & Filtres

- [ ] Carte OpenLayers responsive et fluide.
- [ ] Marqueurs cliquables avec popups.
- [ ] Clustering intelligent.
- [ ] Filtres combinables et sauvegardés.
- [ ] Partage de recherche via URL.

### Reviews & Notation

- [ ] Système d’avis complet (notes 1-5, demi-étoiles, commentaires).
- [ ] Modération automatique et manuelle fonctionnelle.
- [ ] Calcul correct des moyennes.
- [ ] Notifications aux propriétaires.

### Optimisation & PWA

- [ ] Lazy loading et memoization appliqués.
- [ ] Virtual scrolling et optimisation images.
- [ ] Service Worker, cache intelligent et background sync.
- [ ] Offline complet et installation sur mobile/desktop.
- [ ] Notifications push opérationnelles.

### Intégration

- [ ] Test complet : carte → filtres → reviews → PWA.
- [ ] Performance fluide même avec beaucoup de données.
- [ ] Interface responsive et accessible.

---

## 📌 Stratégie de Branches

- Abdo : `abdo-sprint3`
- Zineb : `zineb-sprint3`
- Fusion vers `dev` après chaque jalon stable.
