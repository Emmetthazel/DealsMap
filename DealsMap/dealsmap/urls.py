from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
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
    
    # businesses app URLs
    path('api/', include('apps.businesses.urls')),
    
    # deals app URLs
    path('api/', include('apps.deals.urls')),
    
    # reviews app URLs
    path('api/', include('apps.reviews.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
