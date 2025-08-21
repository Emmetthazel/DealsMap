#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings')
django.setup()

from apps.businesses.models import Business
from apps.categories.models import Category
from apps.deals.models import Deal

print("=== INVESTIGATING ALL BUSINESSES AND DEALS ===")

print("\n--- ALL BUSINESSES ---")
businesses = Business.objects.all()
for business in businesses:
    print(f"Business ID: {business.id} | Name: {business.name} | Category: {business.category.name if business.category else 'None'} | Owner: {business.owner.username if business.owner else 'None'}")

print("\n--- ALL DEALS ---")
deals = Deal.objects.all()
for deal in deals:
    print(f"Deal: {deal.title} | Business: {deal.business.name} | Business Category: {deal.business.category.name if deal.business.category else 'None'} | Active: {deal.is_active}")

print("\n--- ALL CATEGORIES ---")
categories = Category.objects.all()
for cat in categories:
    print(f"Category ID: {cat.id} | Name: {cat.name} | Active: {cat.is_active}")

print("\n--- BUSINESSES BY CATEGORY ---")
for cat in categories:
    businesses_in_cat = Business.objects.filter(category=cat)
    if businesses_in_cat.exists():
        print(f"\nCategory '{cat.name}':")
        for business in businesses_in_cat:
            deals_count = Deal.objects.filter(business=business, is_active=True).count()
            print(f"  - {business.name} (ID: {business.id}) - {deals_count} active deals")
