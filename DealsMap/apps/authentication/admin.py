from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin interface personnalisée pour le modèle User.
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_verified', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    # Champs à afficher dans la liste
    list_editable = ('user_type', 'is_verified', 'is_active')
    
    # Champs dans le formulaire d'édition
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'email', 'phone')}),
        ('Type et statut', {'fields': ('user_type', 'is_verified', 'is_active')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Champs en lecture seule
    readonly_fields = ('last_login', 'date_joined')
    
    # Filtres de recherche
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # Actions personnalisées
    actions = ['make_verified', 'make_owner', 'make_client']
    
    def make_verified(self, request, queryset):
        """Marquer les utilisateurs sélectionnés comme vérifiés."""
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} utilisateur(s) marqué(s) comme vérifié(s).')
    make_verified.short_description = "Marquer comme vérifié"
    
    def make_owner(self, request, queryset):
        """Changer le type d'utilisateur en Propriétaire."""
        updated = queryset.update(user_type='owner')
        self.message_user(request, f'{updated} utilisateur(s) changé(s) en Propriétaire.')
    make_owner.short_description = "Changer en Propriétaire"
    
    def make_client(self, request, queryset):
        """Changer le type d'utilisateur en Client."""
        updated = queryset.update(user_type='client')
        self.message_user(request, f'{updated} utilisateur(s) changé(s) en Client.')
    make_client.short_description = "Changer en Client"
