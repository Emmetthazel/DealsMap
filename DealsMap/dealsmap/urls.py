from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

def home(request):
    return HttpResponse("Bienvenue sur DealsMap backend!")

urlpatterns = [
    path('', home),
    
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.authentication.urls')),
    
    # JWT token endpoints (fallback)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # categories app URLs
    path('api/', include('apps.categories.urls')),
    
    # deals app URLs
    path('api/', include('apps.deals.urls')),
]
