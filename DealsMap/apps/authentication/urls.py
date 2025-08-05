from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.UserLogoutView.as_view(), name='logout'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('user-info/', views.user_info, name='user_info'),
    
    # Password management
    path('change-password/', views.PasswordChangeView.as_view(), name='change_password'),
    
    # Token management
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin functions
    path('verify-user/', views.verify_user, name='verify_user'),
    path('verify-email/', views.verify_email, name='verify_email'),
]