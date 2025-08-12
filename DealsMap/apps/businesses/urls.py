from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessViewSet

# Create router for ViewSet
router = DefaultRouter()
router.register(r'businesses', BusinessViewSet, basename='business')

urlpatterns = [
    # Include all ViewSet URLs
    path('', include(router.urls)),
]
