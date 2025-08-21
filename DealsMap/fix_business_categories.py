#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings')
django.setup()

from apps.businesses.models import Business
from apps.categories.models import Category

print("=== FIXING BUSINESS CATEGORIES ===")

# Get the Restaurant category (most appropriate for FastServis)
try:
    restaurant_category = Category.objects.get(name='Restaurant')
    print(f"Found Restaurant category: {restaurant_category.id}")
    
    # Update all FastServis businesses to have the Restaurant category
    businesses = Business.objects.filter(name='FastServis')
    updated_count = 0
    
    for business in businesses:
        business.category = restaurant_category
        business.save()
        updated_count += 1
        print(f"Updated business {business.id} to have category: {restaurant_category.name}")
    
    print(f"\nSuccessfully updated {updated_count} businesses!")
    
    # Verify the changes
    print("\n=== VERIFICATION ===")
    for business in businesses:
        print(f"Business {business.id}: {business.name} | Category: {business.category.name if business.category else 'None'}")
        
except Category.DoesNotExist:
    print("Restaurant category not found!")
except Exception as e:
    print(f"Error: {e}")
