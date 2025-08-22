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
        if self.action in ['list', 'nearby', 'search']:
            queryset = queryset.filter(is_active=True)
        
        # Filter by business owner if authenticated
        if self.request.user.is_authenticated and self.action in ['my_deals']:
            queryset = queryset.filter(business__owner=self.request.user)
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
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
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)
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
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        Advanced search with multiple filters
        """
        # Use select_related for better performance
        queryset = self.get_queryset().select_related(
            'business', 'business__category'
        )
        
        # Owner filtering for authenticated users
        owner_filter = request.query_params.get('owner')
        if owner_filter == 'me' and request.user.is_authenticated:
            # For user's own deals, we need to show all deals (including inactive ones)
            # So we need to override the is_active filter from get_queryset
            queryset = queryset.model.objects.filter(
                business__owner=request.user
            ).select_related('business', 'business__category')
        # Note: For public search, get_queryset already filters by is_active=True
        
        # Category filtering
        category_filter = request.query_params.get('category')
        print(f"DEBUG: Category filter received: {category_filter}")
        print(f"DEBUG: Queryset count before category filter: {queryset.count()}")
        if category_filter:
            print(f"DEBUG: Filtering by category ID: {category_filter}")
            queryset = queryset.filter(business__category__id=category_filter)
            print(f"DEBUG: Queryset count after category filter: {queryset.count()}")
            print(f"DEBUG: Category filter type: {type(category_filter)}")
            print(f"DEBUG: Category filter value: '{category_filter}'")
        
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
        
        # Custom search logic for more precise results
        search_query = request.query_params.get('search')
        if search_query:
            from django.db.models import Q, Case, When, IntegerField
            
            # Create a more targeted search query
            search_q = Q(title__icontains=search_query) | Q(description__icontains=search_query)
            
            # Add exact title match with higher priority
            exact_title_q = Q(title__iexact=search_query)
            
            # Combine queries and annotate with priority for ordering
            queryset = queryset.filter(search_q | exact_title_q).annotate(
                search_priority=Case(
                    When(exact_title_q, then=1),  # Exact title match gets highest priority
                    When(Q(title__icontains=search_query), then=2),  # Title contains gets medium priority
                    When(Q(description__icontains=search_query), then=3),  # Description contains gets lowest priority
                    default=4,
                    output_field=IntegerField(),
                )
            )
            # Note: We don't apply order_by here anymore, sorting will be applied later
            print(f"DEBUG: Search applied, search_priority annotated")
        else:
            # Apply default ordering if no search
            queryset = self.filter_queryset(queryset)
        
        # Apply sorting AFTER search logic (so user sorting takes precedence)
        sort_filter = request.query_params.get('sort')
        print(f"DEBUG: Sort filter received: {sort_filter}")
        if sort_filter:
            print(f"DEBUG: Applying sorting: {sort_filter}")
            if sort_filter == 'expiry':
                # Sort by expiration date (closest to expiring first)
                if search_query:
                    # If there's a search, combine search priority with expiry sorting
                    queryset = queryset.order_by('search_priority', 'end_date')
                else:
                    queryset = queryset.order_by('end_date')
                print(f"DEBUG: Sorted by expiry date")
            elif sort_filter == 'discount':
                # Sort by discount percentage (highest discount first)
                if search_query:
                    # If there's a search, combine search priority with discount sorting
                    queryset = queryset.order_by('search_priority', '-discount_percentage')
                else:
                    queryset = queryset.order_by('-discount_percentage')
                print(f"DEBUG: Sorted by discount percentage")
            elif sort_filter == 'rating':
                # Sort by rating (highest rating first)
                # Note: Rating field doesn't exist yet, so use creation date as fallback
                if search_query:
                    # If there's a search, combine search priority with creation date sorting
                    queryset = queryset.order_by('search_priority', '-created_at')
                else:
                    queryset = queryset.order_by('-created_at')
                print(f"DEBUG: Rating sorting not implemented yet, using creation date")
            elif sort_filter == 'price':
                # Sort by deal price (lowest price first)
                if search_query:
                    # If there's a search, combine search priority with price sorting
                    queryset = queryset.order_by('search_priority', 'deal_price')
                else:
                    queryset = queryset.order_by('deal_price')
                print(f"DEBUG: Sorted by deal price")
            else:
                # Default sorting by creation date (newest first)
                if search_query:
                    # If there's a search, combine search priority with creation date sorting
                    queryset = queryset.order_by('search_priority', '-created_at')
                else:
                    queryset = queryset.order_by('-created_at')
                print(f"DEBUG: Default sorting by creation date")
        else:
            # Default sorting by creation date (newest first)
            if search_query:
                # If there's a search, use search priority first, then creation date
                queryset = queryset.order_by('search_priority', '-created_at')
            else:
                queryset = queryset.order_by('-created_at')
            print(f"DEBUG: No sort specified, using default sorting")
        
        print(f"DEBUG: Final queryset count: {queryset.count()}")
        print(f"DEBUG: Final queryset SQL: {queryset.query}")
        print(f"DEBUG: Sample deals from queryset:")
        for deal in queryset[:3]:  # Show first 3 deals for debugging
            print(f"  - Deal ID: {deal.id}, Title: {deal.title}, is_active: {deal.is_active}")
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DealListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = DealListSerializer(page, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Get categories based on user authentication status
        - Public users: only categories with active deals
        - Authenticated users: all categories (so they can see categories even when deals are inactive)
        """
        from apps.categories.models import Category
        
        if request.user.is_authenticated:
            # For authenticated users, show all categories
            # This allows business owners to see categories even when their deals are inactive
            categories = Category.objects.all().values('id', 'name')
        else:
            # For public users, only show categories with active deals
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
