import uuid
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from django.core.cache import cache
from .models import Category
from .serializers import CategorySerializer

CACHE_TIMEOUT = 60 * 60  # 1 heure

class CategoryViewSet(viewsets.ViewSet):
    """
    ViewSet for hierarchical categories with Redis caching.
    """

    def list(self, request):
        try:
            # Check if this is a request for business creation (show all categories)
            # or for deal filtering (show only categories with deals)
            show_all_categories = request.query_params.get('all', 'false').lower() == 'true'
            
            if show_all_categories:
                # Show all active categories for business creation
                queryset = Category.objects.filter(is_active=True)
                print(f"DEBUG: Showing ALL {queryset.count()} active categories for business creation")
            else:
                # Only show categories that have businesses with deals (for deal filtering)
                queryset = Category.objects.filter(
                    is_active=True,
                    businesses__deals__is_active=True
                ).distinct()
                print(f"DEBUG: Found {queryset.count()} categories with deals for filtering")
            
            # Add some debugging
            for cat in queryset:
                print(f"DEBUG: Category {cat.id} - {cat.name}")
            
            serializer = CategorySerializer(queryset, many=True)
            print(f"DEBUG: Serialized data length: {len(serializer.data)}")
            
            # Temporarily disable cache to ensure fresh data
            # cache.set("category_list", serializer.data, timeout=CACHE_TIMEOUT)
            return Response(serializer.data)
        except Exception as e:
            print(f"DEBUG: Error in categories list: {e}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def retrieve(self, request, pk=None):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category)
        return Response(serializer.data)
