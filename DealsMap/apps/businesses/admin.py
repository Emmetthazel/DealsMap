from django.contrib import admin
from .models import Business


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    """
    Admin interface for Business model with OpenStreetMap integration
    """
    list_display = ('name', 'city', 'is_active', 'is_verified', 'owner', 'created_at')
    list_filter = ('is_active', 'is_verified', 'city', 'category', 'created_at')
    search_fields = ('name', 'address', 'city')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'address', 'city', 'postal_code', 'category')
        }),
        ('Location', {
            'fields': ('location',),
            'description': 'Click on the map to set the business location'
        }),
        ('Opening Hours', {
            'fields': ('opening_hours',),
            'description': 'JSON format for opening hours'
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified')
        }),
        ('Ownership', {
            'fields': ('owner',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner', 'category')
