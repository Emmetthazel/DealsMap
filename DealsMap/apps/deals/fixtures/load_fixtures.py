#!/usr/bin/env python
"""
Script pour charger toutes les fixtures de test pour l'API des deals
Usage: python manage.py shell < load_fixtures.py
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings.dev')
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model
from apps.categories.models import Category
from apps.businesses.models import Business
from apps.deals.models import Deal

User = get_user_model()

def load_fixtures():
    """Charge toutes les fixtures dans l'ordre correct"""
    
    print("🚀 Chargement des fixtures de test...")
    
    # 1. Charger les catégories
    print("📂 Chargement des catégories...")
    try:
        call_command('loaddata', 'categories_fixture.json', app_label='deals')
        print("✅ Catégories chargées avec succès")
    except Exception as e:
        print(f"❌ Erreur lors du chargement des catégories: {e}")
    
    # 2. Charger les utilisateurs
    print("👥 Chargement des utilisateurs...")
    try:
        call_command('loaddata', 'users_fixture.json', app_label='deals')
        print("✅ Utilisateurs chargés avec succès")
    except Exception as e:
        print(f"❌ Erreur lors du chargement des utilisateurs: {e}")
    
    # 3. Charger les businesses
    print("🏢 Chargement des businesses...")
    try:
        call_command('loaddata', 'businesses_fixture.json', app_label='deals')
        print("✅ Businesses chargés avec succès")
    except Exception as e:
        print(f"❌ Erreur lors du chargement des businesses: {e}")
    
    # 4. Charger les deals
    print("🎯 Chargement des deals...")
    try:
        call_command('loaddata', 'deals_fixture.json', app_label='deals')
        print("✅ Deals chargés avec succès")
    except Exception as e:
        print(f"❌ Erreur lors du chargement des deals: {e}")
    
    print("\n🎉 Chargement des fixtures terminé !")
    
    # Afficher un résumé
    print("\n📊 Résumé des données chargées:")
    print(f"   - Catégories: {Category.objects.count()}")
    print(f"   - Utilisateurs: {User.objects.count()}")
    print(f"   - Businesses: {Business.objects.count()}")
    print(f"   - Deals: {Deal.objects.count()}")

def create_test_user():
    """Crée un utilisateur de test avec mot de passe simple"""
    
    print("\n🔐 Création d'un utilisateur de test...")
    
    try:
        # Créer un superutilisateur de test
        user, created = User.objects.get_or_create(
            email='test@dealsmap.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
                'email_verified': True,
                'phone_verified': True
            }
        )
        
        if created:
            user.set_password('test123')
            user.save()
            print("✅ Utilisateur de test créé: test@dealsmap.com / test123")
        else:
            print("ℹ️ Utilisateur de test existe déjà: test@dealsmap.com / test123")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création de l'utilisateur: {e}")

def verify_data():
    """Vérifie que toutes les données ont été chargées correctement"""
    
    print("\n🔍 Vérification des données...")
    
    try:
        # Vérifier les catégories
        categories = Category.objects.all()
        print(f"   📂 Catégories ({categories.count()}):")
        for cat in categories:
            print(f"      - {cat.name}: {cat.description}")
        
        # Vérifier les businesses
        businesses = Business.objects.all()
        print(f"\n   🏢 Businesses ({businesses.count()}):")
        for biz in businesses:
            print(f"      - {biz.name} ({biz.category.name}) - {biz.city}")
        
        # Vérifier les deals
        deals = Deal.objects.all()
        print(f"\n   🎯 Deals ({deals.count()}):")
        for deal in deals:
            print(f"      - {deal.title} ({deal.business.name}) - {deal.discount_percentage}% de réduction")
        
        print("\n✅ Vérification terminée avec succès !")
        
    except Exception as e:
        print(f"❌ Erreur lors de la vérification: {e}")

if __name__ == '__main__':
    print("🎯 Script de chargement des fixtures pour DealsMap")
    print("=" * 50)
    
    # Charger les fixtures
    load_fixtures()
    
    # Créer un utilisateur de test
    create_test_user()
    
    # Vérifier les données
    verify_data()
    
    print("\n🎉 Toutes les fixtures ont été chargées avec succès !")
    print("\n📝 Prochaines étapes:")
    print("   1. Tester l'API: GET /api/deals/")
    print("   2. Tester la géolocalisation: GET /api/deals/nearby/?lat=48.8566&lng=2.3522")
    print("   3. Tester la recherche: GET /api/deals/search/?min_discount=20")
    print("   4. Se connecter à l'admin: test@dealsmap.com / test123")



