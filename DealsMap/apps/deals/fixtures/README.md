# 🗂️ Fixtures de test pour l'API des Deals

Ce dossier contient toutes les fixtures nécessaires pour tester l'API des deals avec des données réalistes.

## 📁 Fichiers disponibles

### **1. `categories_fixture.json`**
- **5 catégories** : Restaurant, Shopping, Beauté & Bien-être, Sport & Loisirs, Services
- **Données** : nom, description, icône, couleur, statut

### **2. `users_fixture.json`**
- **3 utilisateurs** : Jean Dupont, Marie Martin, Pierre Durand
- **Profils** : propriétaires de businesses avec emails et téléphones vérifiés

### **3. `businesses_fixture.json`**
- **5 businesses** répartis dans Paris avec coordonnées géographiques réalistes
- **Catégories variées** : restaurants, boutiques, spa, salle de sport, café
- **Données complètes** : adresses, horaires, coordonnées GPS, propriétaires

### **4. `deals_fixture.json`**
- **10 deals** variés avec différentes réductions et conditions
- **Exemples** : menus à -30%, soldes -40%, mois gratuit, happy hour -30%
- **Validation métier** : respect des règles de durée (≤4 semaines), prix cohérents

### **5. `load_fixtures.py`**
- **Script automatique** pour charger toutes les fixtures dans l'ordre
- **Création d'utilisateur de test** avec accès admin
- **Vérification des données** chargées

## 🚀 **Comment utiliser les fixtures**

### **Méthode 1 : Script automatique (Recommandé)**

```bash
# Dans le terminal Docker
cd /code

# Exécuter le script de chargement
python manage.py shell < apps/deals/fixtures/load_fixtures.py
```

### **Méthode 2 : Chargement manuel**

```bash
# Charger dans l'ordre (important pour les relations)
python manage.py loaddata categories_fixture.json --app deals
python manage.py loaddata users_fixture.json --app deals
python manage.py loaddata businesses_fixture.json --app deals
python manage.py loaddata deals_fixture.json --app deals
```

### **Méthode 3 : Via l'admin Django**

1. Aller sur http://127.0.0.1:8000/admin/
2. Se connecter avec `test@dealsmap.com` / `test123`
3. Importer les fichiers JSON un par un

## 🧪 **Tests avec les fixtures**

### **1. Test de l'endpoint principal**
```bash
curl -X GET "http://127.0.0.1:8000/api/deals/"
# Devrait retourner 10 deals avec pagination
```

### **2. Test de géolocalisation**
```bash
# Deals proches du centre de Paris
curl -X GET "http://127.0.0.1:8000/api/deals/nearby/?lat=48.8566&lng=2.3522&radius=5"
# Devrait retourner plusieurs deals dans un rayon de 5km
```

### **3. Test de recherche**
```bash
# Deals avec au moins 20% de réduction
curl -X GET "http://127.0.0.1:8000/api/deals/search/?min_discount=20"
# Devrait retourner deals avec réduction ≥ 20%
```

### **4. Test par catégorie**
```bash
# Deals de restaurants uniquement
curl -X GET "http://127.0.0.1:8000/api/deals/?business__category=1"
# Devrait retourner deals des restaurants (catégorie 1)
```

## 📊 **Données de test incluses**

### **Catégories**
- **Restaurant** (ID: 1) - Restaurants et cafés
- **Shopping** (ID: 2) - Boutiques et magasins
- **Beauté & Bien-être** (ID: 3) - Spas et salons
- **Sport & Loisirs** (ID: 4) - Salles de sport
- **Services** (ID: 5) - Services professionnels

### **Businesses**
- **Le Petit Bistrot** - Restaurant traditionnel (Paris 1er)
- **Mode & Style** - Boutique de vêtements (Champs-Élysées)
- **Spa Zen** - Centre de bien-être (Faubourg Saint-Honoré)
- **Fitness Club** - Salle de sport (Boulevard Haussmann)
- **Café Central** - Café branché (Quai des Grands Augustins)

### **Deals**
- **Restaurants** : Menu du jour -30%, Apéro 2 pour 1
- **Shopping** : Soldes d'hiver -40%, Accessoires -25%
- **Beauté** : Massage -20%, Pack détente -30%
- **Sport** : Mois gratuit, Cours collectifs -15%
- **Café** : Petit-déjeuner -25%, Happy hour -30%

## 🔐 **Accès de test**

Après chargement des fixtures, vous pouvez vous connecter avec :

- **Email** : `test@dealsmap.com`
- **Mot de passe** : `test123`
- **Accès** : Superutilisateur avec tous les droits

## ⚠️ **Notes importantes**

1. **Ordre de chargement** : Respecter l'ordre catégories → utilisateurs → businesses → deals
2. **Base de données** : Les fixtures écrasent les données existantes avec les mêmes IDs
3. **Géolocalisation** : Tous les businesses sont situés à Paris pour les tests
4. **Dates** : Les deals ont des dates de validité réalistes (janvier 2024)
5. **Relations** : Tous les deals sont liés à des businesses et catégories valides

## 🎯 **Scénarios de test recommandés**

1. **Test CRUD** : Créer, lire, modifier, supprimer des deals
2. **Test géolocalisation** : Rechercher des deals à différentes distances
3. **Test filtres** : Tester tous les paramètres de recherche
4. **Test validation** : Essayer de créer des deals invalides
5. **Test pagination** : Vérifier la pagination avec 10+ deals
6. **Test cache** : Vérifier le fonctionnement du cache Redis

## 🚨 **En cas de problème**

Si le chargement échoue :

1. **Vérifier la base** : `python manage.py check`
2. **Vérifier les migrations** : `python manage.py showmigrations`
3. **Réinitialiser** : Supprimer et recréer la base de test
4. **Vérifier les modèles** : S'assurer que tous les champs requis sont présents

---

**🎉 Les fixtures sont prêtes pour tester l'API des deals !**

