from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Deal


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'business', 'original_price', 'deal_price', 
        'discount_percentage', 'is_active', 'is_valid', 
        'current_uses', 'max_uses', 'days_remaining'
    ]
    
    list_filter = [
        'is_active', 'business__city', 'business__category',
        ('start_date', admin.DateFieldListFilter),
        ('end_date', admin.DateFieldListFilter),
        'discount_percentage',
    ]
    
    search_fields = [
        'title', 'description', 'business__name', 
        'business__city', 'business__address'
    ]
    
    list_editable = ['is_active', 'max_uses']
    
    readonly_fields = [
        'id', 'created_at', 'discount_percentage', 
        'is_valid', 'is_expired', 'is_fully_used',
        'days_remaining', 'remaining_uses'
    ]
    
    def get_image_preview(self, obj):
        """Display image preview in admin"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px;" />',
                obj.image.url
            )
        return "No image"
    get_image_preview.short_description = 'Image Preview'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'business', 'image', 'get_image_preview')
        }),
        ('Pricing', {
            'fields': ('original_price', 'deal_price', 'discount_percentage')
        }),
        ('Validity Period', {
            'fields': ('start_date', 'end_date')
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'current_uses')
        }),
        ('Additional Information', {
            'fields': ('conditions', 'is_active')
        }),
        ('System Information', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        }),
        ('Status Properties', {
            'fields': ('is_valid', 'is_expired', 'is_fully_used', 'days_remaining', 'remaining_uses'),
            'classes': ('collapse',)
        }),
    )
    
    def is_valid(self, obj):
        """Display if deal is currently valid"""
        if obj.is_valid:
            return format_html(
                '<span style="color: green;">✓ Valid</span>'
            )
        return format_html(
            '<span style="color: red;">✗ Invalid</span>'
        )
    is_valid.short_description = 'Valid'
    
    def days_remaining(self, obj):
        """Display days remaining until expiration"""
        days = obj.get_days_remaining()
        if days == 0:
            return format_html(
                '<span style="color: red;">Expired</span>'
            )
        elif days <= 7:
            return format_html(
                f'<span style="color: orange;">{days} days</span>'
            )
        else:
            return format_html(
                f'<span style="color: green;">{days} days</span>'
            )
    days_remaining.short_description = 'Days Remaining'
    
    def remaining_uses(self, obj):
        """Display remaining uses"""
        remaining = obj.get_remaining_uses()
        if remaining == 0:
            return format_html(
                '<span style="color: red;">Fully Used</span>'
            )
        elif remaining <= 10:
            return format_html(
                f'<span style="color: orange;">{remaining} left</span>'
            )
        else:
            return format_html(
                f'<span style="color: green;">{remaining} left</span>'
            )
    remaining_uses.short_description = 'Remaining Uses'
    
    def get_queryset(self, request):
        """Optimize queryset with related fields"""
        return super().get_queryset(request).select_related('business', 'business__category')
    
    def save_model(self, request, obj, form, change):
        """Custom save logic"""
        # Auto-calculate discount percentage if not provided
        if obj.original_price and obj.deal_price and not obj.discount_percentage:
            discount = ((obj.original_price - obj.deal_price) / obj.original_price) * 100
            obj.discount_percentage = round(discount, 2)
        
        super().save_model(request, obj, form, change)
    
    actions = ['activate_deals', 'deactivate_deals', 'extend_deals']
    
    def activate_deals(self, request, queryset):
        """Activate selected deals"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request, 
            f'{updated} deal(s) have been activated successfully.'
        )
    activate_deals.short_description = "Activate selected deals"
    
    def deactivate_deals(self, request, queryset):
        """Deactivate selected deals"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request, 
            f'{updated} deal(s) have been deactivated successfully.'
        )
    deactivate_deals.short_description = "Deactivate selected deals"
    
    def extend_deals(self, request, queryset):
        """Extend selected deals by 1 week"""
        for deal in queryset:
            if deal.end_date:
                deal.end_date = deal.end_date + timezone.timedelta(days=7)
                deal.save()
        
        self.message_user(
            request, 
            f'{queryset.count()} deal(s) have been extended by 1 week.'
        )
    extend_deals.short_description = "Extend deals by 1 week"
