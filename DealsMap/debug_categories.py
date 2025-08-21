#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings')
django.setup()

from apps.businesses.models import Business
from apps.categories.models import Category
from apps.deals.models import Deal

print("=== DEBUGGING CATEGORIES AND BUSINESSES ===")

print("\n--- ALL BUSINESSES WITH CATEGORIES ---")
businesses = Business.objects.all()
for business in businesses:
    print(f"Business: {business.name} | Category: {business.category.name if business.category else 'None'} | Owner: {business.owner.username if business.owner else 'None'}")

print("\n--- ALL DEALS WITH BUSINESS CATEGORIES ---")
deals = Deal.objects.filter(is_active=True)
for deal in deals:
    print(f"Deal: {deal.title} | Business: {deal.business.name} | Category: {deal.business.category.name if deal.business.category else 'None'}")

print("\n--- CATEGORIES WITH ACTIVE DEALS (what the filter should show) ---")
categories_with_deals = Category.objects.filter(
    is_active=True,
    businesses__deals__is_active=True
).distinct()
print(f"Found {categories_with_deals.count()} categories with deals:")
for cat in categories_with_deals:
    print(f"  - {cat.name} (ID: {cat.id})")

print("\n--- ALL ACTIVE CATEGORIES (what business creation should show) ---")
all_categories = Category.objects.filter(is_active=True)
print(f"Found {all_categories.count()} total active categories:")
for cat in all_categories:
    print(f"  - {cat.name} (ID: {cat.id})")
