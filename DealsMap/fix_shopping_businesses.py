#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings')
django.setup()

from apps.businesses.models import Business
from apps.categories.models import Category

print("=== ASSIGNING SHOPPING CATEGORY TO BUSINESSES ===")

# Get the Shopping category
try:
    shopping_category = Category.objects.get(name='Shopping')
    print(f"Found Shopping category: {shopping_category.id}")
    
    # Assign Shopping category to businesses that should have it
    businesses_to_update = ['lbssMzyan', 'Kool']
    updated_count = 0
    
    for business_name in businesses_to_update:
        businesses = Business.objects.filter(name=business_name)
        for business in businesses:
            business.category = shopping_category
            business.save()
            updated_count += 1
            print(f"Updated business '{business.name}' (ID: {business.id}) to have category: {shopping_category.name}")
    
    print(f"\nSuccessfully updated {updated_count} businesses!")
    
    # Verify the changes
    print("\n=== VERIFICATION ===")
    for business_name in businesses_to_update:
        businesses = Business.objects.filter(name=business_name)
        for business in businesses:
            print(f"Business {business.id}: {business.name} | Category: {business.category.name if business.category else 'None'}")
            
except Category.DoesNotExist:
    print("Shopping category not found!")
except Exception as e:
    print(f"Error: {e}")
