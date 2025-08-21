#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings')
django.setup()

from apps.businesses.models import Business
from apps.categories.models import Category

print("=== FIXING FREESOCKS CATEGORY ===")

# Get the Mode category (most appropriate for FreeSocks)
try:
    mode_category = Category.objects.get(name='Mode')
    print(f"Found Mode category: {mode_category.id}")
    
    # Update FreeSocks business to have the Mode category
    businesses = Business.objects.filter(name='FreeSocks')
    updated_count = 0
    
    for business in businesses:
        business.category = mode_category
        business.save()
        updated_count += 1
        print(f"Updated business '{business.name}' (ID: {business.id}) to have category: {mode_category.name}")
    
    print(f"\nSuccessfully updated {updated_count} businesses!")
    
    # Verify the changes
    print("\n=== VERIFICATION ===")
    for business in businesses:
        print(f"Business {business.id}: {business.name} | Category: {business.category.name if business.category else 'None'}")
        
except Category.DoesNotExist:
    print("Mode category not found!")
except Exception as e:
    print(f"Error: {e}")
