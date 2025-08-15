from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DealViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'deals', DealViewSet, basename='deal')

app_name = 'deals'

urlpatterns = [
    # Include all router URLs (without 'api/' prefix since it's already in main urls.py)
    path('', include(router.urls)),
    
    # Additional custom endpoints
    path('deals/', include([
        path('nearby/', DealViewSet.as_view({'get': 'nearby'}), name='deals-nearby'),
        path('my-deals/', DealViewSet.as_view({'get': 'my_deals'}), name='my-deals'),
        path('search/', DealViewSet.as_view({'get': 'search'}), name='deals-search'),
        path('categories/', DealViewSet.as_view({'get': 'categories'}), name='deals-categories'),
    ])),
]
