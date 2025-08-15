#!/usr/bin/env python
"""
Script de test pour vérifier les fonctionnalités Deals
Usage: python test_deals_functionality.py
"""

import os
import sys
import django
from datetime import timedelta
from decimal import Decimal
from django.contrib.gis.geos import Point


# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings')
django.setup()

from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.deals.models import Deal
from apps.businesses.models import Business
from apps.categories.models import Category
from django.contrib.auth import get_user_model

User = get_user_model()


def test_deal_creation():
    """Test de création d'un deal"""
    print("🧪 Test de création d'un deal...")
    
    try:
        # Créer un utilisateur de test
        user, created = User.objects.get_or_create(
            email='test@deals.com',
            defaults={'password': 'testpass123'}
        )
        
        # Créer une catégorie de test
        category, created = Category.objects.get_or_create(
            name='Test Category',
            defaults={'description': 'Category for testing'}
        )
        
        # Créer un business de test
        business, created = Business.objects.get_or_create(
            name='Test Business',
            defaults={
            'address': '123 Test St',
            'city': 'Test City',
            'postal_code': '12345',
            'owner': user,
            'category': category,
            'is_active': True,
            'is_verified': True,
            'location': Point(2.3522, 48.8566,  srid=4326),  # Longitude, Latitude (ex : Paris)
        }
        )
        
        # Créer un deal de test
        deal = Deal.objects.create(
            business=business,
            title='Test Deal',
            description='Test deal description',
            original_price=Decimal('20.00'),
            deal_price=Decimal('15.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            max_uses=100,
            is_active=True
        )
        
        print(f"✅ Deal créé avec succès: {deal.title}")
        print(f"   - Remise calculée: {deal.discount_percentage}%")
        print(f"   - Valide: {deal.is_valid}")
        print(f"   - Jours restants: {deal.get_days_remaining()}")
        
        return deal
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du deal: {e}")
        return None


def test_deal_validation():
    """Test des règles de validation"""
    print("\n🧪 Test des règles de validation...")
    
    try:
        # Test 1: Durée > 4 semaines
        print("   Test 1: Durée > 4 semaines...")
        deal = Deal(
            business=Business.objects.first(),
            title='Invalid Duration Deal',
            original_price=Decimal('30.00'),
            deal_price=Decimal('20.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),  # 30 jours > 28
            max_uses=50
        )
        
        try:
            deal.clean()
            print("   ❌ La validation aurait dû échouer pour la durée")
        except ValidationError as e:
            print("   ✅ Validation échoue correctement pour la durée")
        
        # Test 2: Prix invalide
        print("   Test 2: Prix invalide...")
        deal = Deal(
            business=Business.objects.first(),
            title='Invalid Price Deal',
            original_price=Decimal('20.00'),
            deal_price=Decimal('25.00'),  # Plus élevé que l'original
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            max_uses=50
        )
        
        try:
            deal.clean()
            print("   ❌ La validation aurait dû échouer pour le prix")
        except ValidationError as e:
            print("   ✅ Validation échoue correctement pour le prix")
            
    except Exception as e:
        print(f"   ❌ Erreur lors des tests de validation: {e}")


def test_deal_properties():
    """Test des propriétés du deal"""
    print("\n🧪 Test des propriétés du deal...")
    
    try:
        deal = Deal.objects.first()
        if deal:
            print(f"   - Deal: {deal.title}")
            print(f"   - Valide: {deal.is_valid}")
            print(f"   - Expiré: {deal.is_expired}")
            print(f"   - Complètement utilisé: {deal.is_fully_used}")
            print(f"   - Jours restants: {deal.get_days_remaining()}")
            print(f"   - Utilisations restantes: {deal.get_remaining_uses()}")
            print(f"   - Remise calculée: {deal.calculate_discount()}")
            print("   ✅ Propriétés testées avec succès")
        else:
            print("   ❌ Aucun deal trouvé pour les tests")
            
    except Exception as e:
        print(f"   ❌ Erreur lors des tests des propriétés: {e}")


def test_deal_usage():
    """Test de l'utilisation du deal"""
    print("\n🧪 Test de l'utilisation du deal...")
    
    try:
        deal = Deal.objects.first()
        if deal:
            initial_uses = deal.current_uses
            print(f"   - Utilisations initiales: {initial_uses}")
            
            # Incrémenter l'utilisation
            success = deal.increment_usage()
            if success:
                print(f"   - Utilisation incrémentée: {deal.current_uses}")
                print("   ✅ Incrémentation réussie")
            else:
                print("   ❌ Échec de l'incrémentation")
                
    except Exception as e:
        print(f"   ❌ Erreur lors du test d'utilisation: {e}")


def main():
    """Fonction principale"""
    print("🚀 Test des fonctionnalités Deals")
    print("=" * 50)
    
    # Vérifier que Django est configuré
    try:
        from django.conf import settings
        print(f"✅ Django configuré: {settings.DATABASES['default']['NAME']}")
    except Exception as e:
        print(f"❌ Erreur de configuration Django: {e}")
        return
    
    # Exécuter les tests
    deal = test_deal_creation()
    test_deal_validation()
    test_deal_properties()
    test_deal_usage()
    
    print("\n" + "=" * 50)
    print("🎯 Résumé des tests")
    
    if deal:
        print(f"✅ Deal de test créé: {deal.title}")
        print(f"   - ID: {deal.id}")
        print(f"   - Business: {deal.business.name}")
        print(f"   - Remise: {deal.discount_percentage}%")
        print(f"   - Statut: {'Actif' if deal.is_active else 'Inactif'}")
    else:
        print("❌ Aucun deal de test créé")
    
    print("\n✨ Tests terminés!")


if __name__ == '__main__':
    main()
