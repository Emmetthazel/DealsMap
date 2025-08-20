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
]
