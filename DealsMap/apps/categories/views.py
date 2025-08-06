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
        cached_data = cache.get("category_list")
        if cached_data:
            return Response(cached_data)

        queryset = Category.objects.filter(parent=None, is_active=True)
        serializer = CategorySerializer(queryset, many=True)
        cache.set("category_list", serializer.data, timeout=CACHE_TIMEOUT)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category)
        return Response(serializer.data)
