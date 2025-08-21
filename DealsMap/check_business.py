#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings')
django.setup()

from apps.businesses.models import Business
from apps.categories.models import Category
from apps.deals.models import Deal

print("=== CHECKING BUSINESSES ===")
businesses = Business.objects.filter(name='FastServis')
print(f"Found {businesses.count()} businesses named 'FastServis'")
for i, business in enumerate(businesses):
    print(f"\nBusiness {i+1}:")
    print(f"  ID: {business.id}")
    print(f"  Name: {business.name}")
    print(f"  Category ID: {business.category_id}")
    print(f"  Category: {business.category}")
    print(f"  Owner: {business.owner.username if business.owner else 'None'}")

print("\n=== CHECKING CATEGORIES ===")
categories = Category.objects.all()
print(f"Total categories: {categories.count()}")
for cat in categories:
    print(f"ID: {cat.id} | Name: {cat.name} | Active: {cat.is_active}")

print("\n=== CHECKING DEALS ===")
deals = Deal.objects.all()
print(f"Total deals: {deals.count()}")
for deal in deals:
    print(f"Deal: {deal.title} | Business: {deal.business.name} | Category: {deal.business.category.name if deal.business.category else 'None'}")
