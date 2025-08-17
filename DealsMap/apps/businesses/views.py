from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from django_filters.rest_framework import DjangoFilterBackend
from django.core.paginator import Paginator
from django.db.models import Avg, Count
from django.core.cache import cache
import time

from .models import Business
from .serializers import BusinessSerializer, BusinessDetailSerializer
from .cache import cache_nearby_search, invalidate_nearby_cache, CacheManager


class BusinessViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Business model with geospatial capabilities
    """
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [AllowAny]  # Allow public access for nearby search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['city', 'is_active', 'is_verified', 'category']
    search_fields = ['name', 'address', 'city']
    ordering_fields = ['name', 'created_at', 'distance']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['retrieve', 'nearby']:
            return BusinessDetailSerializer
        return BusinessSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = Business.objects.filter(is_active=True)
        
        # If user is authenticated, show their own businesses first
        if self.request.user.is_authenticated:
            queryset = queryset.select_related('owner', 'category')
        else:
            queryset = queryset.select_related('category')
        
        return queryset

    def perform_create(self, serializer):
        """Override to invalidate cache after creating a business"""
        business = serializer.save()
        # Invalidate nearby cache since new business might appear in nearby searches
        invalidate_nearby_cache()
        return business

    def perform_update(self, serializer):
        """Override to invalidate cache after updating a business"""
        business = serializer.save()
        # Invalidate nearby cache since business data changed
        invalidate_nearby_cache()
        return business

    def perform_destroy(self, instance):
        """Override to invalidate cache after deleting a business"""
        # Invalidate nearby cache since business was removed
        invalidate_nearby_cache()
        instance.delete()

    @action(detail=False, methods=['get'], url_path='nearby')
    @cache_nearby_search(timeout=300)  # Cache for 5 minutes
    def nearby(self, request):
        """
        Find nearby businesses with filters
        Query parameters:
        - lat: latitude (required)
        - lng: longitude (required)
        - radius: search radius in km (default: 10)
        - category: category ID or name
        - distance: max distance filter
        - rating: minimum rating filter
        - page: page number for pagination
        - page_size: items per page (default: 10, max: 50)
        """
        # Get required parameters
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude (lat) and longitude (lng) are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            return Response(
                {'error': 'Latitude and longitude must be valid numbers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional parameters
        radius = float(request.query_params.get('radius', 10))
        category = request.query_params.get('category')
        max_distance = request.query_params.get('distance')
        min_rating = request.query_params.get('rating')
        
        # Pagination parameters
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        
        # Create search point
        search_point = Point(lng, lat, srid=4326)
        
        # Build queryset with geospatial filtering
        queryset = Business.objects.filter(
            location__distance_lte=(search_point, D(km=radius)),
            is_active=True
        ).annotate(
            distance=Distance('location', search_point)
        ).select_related('category', 'owner')
        
        # Apply category filter
        if category:
            try:
                # Try to parse as integer (category ID)
                category_id = int(category)
                queryset = queryset.filter(category_id=category_id)
            except ValueError:
                # Treat as category name
                queryset = queryset.filter(category__name__icontains=category)
        
        # Apply distance filter
        if max_distance:
            try:
                max_distance_km = float(max_distance)
                queryset = queryset.filter(distance__lte=D(km=max_distance_km))
            except ValueError:
                pass
        
        # Apply rating filter (if reviews are implemented)
        if min_rating:
            try:
                min_rating_val = float(min_rating)
                # This would need to be implemented when reviews are added
                # queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=min_rating_val)
                pass
            except ValueError:
                pass
        
        # Order by distance
        queryset = queryset.order_by('distance')
        
        # Apply pagination
        paginator = Paginator(queryset, page_size)
        try:
            businesses_page = paginator.page(page)
        except:
            return Response(
                {'error': 'Invalid page number'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serialize results
        serializer = self.get_serializer(businesses_page, many=True)
        
        # Prepare response with pagination info
        response_data = {
            'count': paginator.count,
            'next': businesses_page.has_next(),
            'previous': businesses_page.has_previous(),
            'page': page,
            'pages': paginator.num_pages,
            'page_size': page_size,
            'results': serializer.data
        }
        
        return Response(response_data)

    @action(detail=True, methods=['get'], url_path='distance')
    def distance(self, request, pk=None):
        """
        Calculate distance from a business to a point
        Query parameters:
        - lat: latitude (required)
        - lng: longitude (required)
        """
        business = self.get_object()
        
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude (lat) and longitude (lng) are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            return Response(
                {'error': 'Latitude and longitude must be valid numbers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        distance = business.calculate_distance(lat, lng)
        
        return Response({
            'business_id': business.id,
            'business_name': business.name,
            'from_lat': lat,
            'from_lng': lng,
            'distance_km': distance
        })

    @action(detail=False, methods=['get', 'post'], url_path='cache/clear')
    def clear_cache(self, request):
        """
        Clear cache endpoints
        GET: Get cache information
        POST: Clear all cache or specific cache
        """
        if request.method == 'GET':
            cache_info = CacheManager.get_cache_info()
            return Response({
                'cache_info': cache_info,
                'message': 'Use POST to clear cache'
            })
        
        elif request.method == 'POST':
            cache_type = request.data.get('type', 'all')
            
            if cache_type == 'nearby':
                result = CacheManager.clear_nearby_cache()
            elif cache_type == 'all':
                result = CacheManager.clear_all_cache()
            else:
                return Response(
                    {'error': 'Invalid cache type. Use "nearby" or "all"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(result)
