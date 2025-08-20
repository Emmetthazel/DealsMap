from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from decimal import Decimal
from django.utils import timezone

from .models import Deal
from .serializers import (
    DealSerializer, 
    DealCreateSerializer, 
    DealUpdateSerializer,
    DealListSerializer
)


class DealViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Deal model with CRUD operations and filtering
    """
    queryset = Deal.objects.select_related('business', 'business__category').all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'business__category']
    search_fields = ['title', 'description', 'business__name']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'discount_percentage', 'original_price']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return DealCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DealUpdateSerializer
        elif self.action == 'list':
            return DealListSerializer
        return DealSerializer
    
    def get_queryset(self):
        """Custom queryset with filtering"""
        queryset = super().get_queryset()
        
        # Filter by active deals only for public endpoints
        if self.action in ['list', 'nearby']:
            queryset = queryset.filter(is_active=True)
        
        # Filter by business owner if authenticated
        if self.request.user.is_authenticated and self.action in ['my_deals']:
            queryset = queryset.filter(business__owner=self.request.user)
        
        return queryset
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        """
        Get deals near a specific location with distance filtering
        """
        # Get query parameters - support both lat/lng and latitude/longitude
        lat = request.query_params.get('lat') or request.query_params.get('latitude')
        lng = request.query_params.get('lng') or request.query_params.get('longitude')
        radius = request.query_params.get('radius', 10)  # Default 10km
        category = request.query_params.get('category')
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude are required (use lat/lng or latitude/longitude)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lng = float(lng)
            radius = float(radius)
        except ValueError:
            return Response(
                {'error': 'Invalid coordinates or radius'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create point and filter by distance
        user_location = Point(lng, lat, srid=4326)
        
        # Use select_related and prefetch_related for better performance
        queryset = self.get_queryset().select_related(
            'business', 'business__category'
        ).filter(
            business__location__distance_lte=(user_location, D(km=radius))
        ).annotate(
            distance=Distance('business__location', user_location)
        ).order_by('distance')
        
        # Filter by category if provided
        if category:
            queryset = queryset.filter(business__category__name__icontains=category)
        
        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DealListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = DealListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-deals')
    def my_deals(self, request):
        """
        Get deals for businesses owned by the authenticated user
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        queryset = self.get_queryset().filter(business__owner=request.user)
        
        # Apply additional filters
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'expired':
            queryset = queryset.filter(end_date__lt=timezone.now())
        elif status_filter == 'upcoming':
            queryset = queryset.filter(start_date__gt=timezone.now())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DealSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = DealSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @method_decorator(cache_page(60 * 3))  # Cache for 3 minutes
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        Advanced search with multiple filters
        """
        # Use select_related for better performance
        queryset = self.get_queryset().select_related(
            'business', 'business__category'
        )
        
        # Price range filtering
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        
        if min_price:
            try:
                min_price = Decimal(min_price)
                queryset = queryset.filter(deal_price__gte=min_price)
            except ValueError:
                pass
        
        if max_price:
            try:
                max_price = Decimal(max_price)
                queryset = queryset.filter(deal_price__lte=max_price)
            except ValueError:
                pass
        
        # Discount filtering
        min_discount = request.query_params.get('min_discount')
        if min_discount:
            try:
                min_discount = Decimal(min_discount)
                queryset = queryset.filter(discount_percentage__gte=min_discount)
            except ValueError:
                pass
        
        # Date filtering
        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                from datetime import datetime
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                queryset = queryset.filter(start_date__gte=start_date)
            except ValueError:
                pass
        
        # Apply search and ordering
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DealListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = DealListSerializer(page, many=True)
        return Response(serializer.data)
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Get all categories that have active deals
        """
        from apps.categories.models import Category
        
        categories = Category.objects.filter(
            businesses__deals__is_active=True
        ).distinct().values('id', 'name')
        
        return Response(categories)

    @method_decorator(cache_page(60 * 10))  # Cache for 10 minutes
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get deal statistics for dashboard
        """
        from django.db.models import Count, Avg, Sum
        from django.utils import timezone
        
        now = timezone.now()
        
        # Get user's deals if authenticated
        if request.user.is_authenticated:
            user_deals = Deal.objects.filter(business__owner=request.user)
            
            stats = {
                'total_deals': user_deals.count(),
                'active_deals': user_deals.filter(
                    is_active=True,
                    start_date__lte=now,
                    end_date__gte=now
                ).count(),
                'upcoming_deals': user_deals.filter(
                    is_active=True,
                    start_date__gt=now
                ).count(),
                'expired_deals': user_deals.filter(
                    end_date__lt=now
                ).count(),
                'total_views': user_deals.aggregate(
                    total=Sum('current_uses')
                )['total'] or 0,
                'average_discount': user_deals.aggregate(
                    avg=Avg('discount_percentage')
                )['avg'] or 0,
                'total_savings': user_deals.aggregate(
                    savings=Sum(
                        F('original_price') - F('deal_price')
                    )
                )['savings'] or 0
            }
        else:
            # Public stats
            all_deals = Deal.objects.filter(is_active=True)
            stats = {
                'total_deals': all_deals.count(),
                'active_deals': all_deals.filter(
                    start_date__lte=now,
                    end_date__gte=now
                ).count(),
                'upcoming_deals': all_deals.filter(
                    start_date__gt=now
                ).count(),
                'average_discount': all_deals.aggregate(
                    avg=Avg('discount_percentage')
                )['avg'] or 0
            }
        
        return Response(stats)
    
    def perform_create(self, serializer):
        """Custom create logic"""
        # Set the business owner automatically if not provided
        if not serializer.validated_data.get('business'):
            # This would need to be implemented based on your business logic
            pass
        
        serializer.save()
    
    def perform_update(self, serializer):
        """Custom update logic"""
        # Prevent updating deals that are expired or fully used
        instance = self.get_object()
        if instance.is_expired:
            raise serializers.ValidationError("Cannot update expired deals.")
        
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        """Custom delete logic"""
        instance = self.get_object()
        
        # Check if user owns the business
        if not request.user.is_authenticated or instance.business.owner != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Soft delete instead of hard delete
        instance.is_active = False
        instance.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
