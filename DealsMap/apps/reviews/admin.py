from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Review
from django.utils import timezone

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'business_or_deal', 'rating', 'status', 
        'created_at', 'moderated_at', 'moderator'
    ]
    list_filter = [
        'status', 'rating', 'created_at', 'moderated_at'
    ]
    search_fields = [
        'user__username', 'user__email', 'comment',
        'business__name', 'deal__title'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'moderated_at', 'moderated_by'
    ]
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Review Information', {
            'fields': ('user', 'business', 'deal', 'rating', 'comment')
        }),
        ('Status & Moderation', {
            'fields': ('status', 'moderated_at', 'moderated_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def business_or_deal(self, obj):
        """Display business or deal name with link"""
        if obj.business:
            url = reverse('admin:businesses_business_change', args=[obj.business.id])
            return format_html('<a href="{}">{}</a>', url, obj.business.name)
        elif obj.deal:
            url = reverse('admin:deals_deal_change', args=[obj.deal.id])
            return format_html('<a href="{}">{}</a>', url, obj.deal.title)
        return 'N/A'
    business_or_deal.short_description = 'Business/Deal'
    business_or_deal.admin_order_field = 'business__name'
    
    def moderator(self, obj):
        """Display moderator with link"""
        if obj.moderated_by:
            url = reverse('admin:authentication_user_change', args=[obj.moderated_by.id])
            return format_html('<a href="{}">{}</a>', url, obj.moderated_by.username)
        return 'N/A'
    moderator.short_description = 'Moderator'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related(
            'user', 'business', 'deal', 'moderated_by'
        )
    
    def save_model(self, request, obj, form, change):
        """Set moderator when status changes"""
        if change and 'status' in form.changed_data:
            obj.moderated_by = request.user
        super().save_model(request, obj, form, change)
    
    actions = ['approve_reviews', 'reject_reviews', 'mark_as_spam']
    
    def approve_reviews(self, request, queryset):
        """Approve selected reviews"""
        updated = queryset.update(
            status='approved',
            moderated_at=timezone.now(),
            moderated_by=request.user
        )
        self.message_user(
            request, 
            f'{updated} review(s) were successfully approved.'
        )
    approve_reviews.short_description = "Approve selected reviews"
    
    def reject_reviews(self, request, queryset):
        """Reject selected reviews"""
        updated = queryset.update(
            status='rejected',
            moderated_at=timezone.now(),
            moderated_by=request.user
        )
        self.message_user(
            request, 
            f'{updated} review(s) were successfully rejected.'
        )
    reject_reviews.short_description = "Reject selected reviews"
    
    def mark_as_spam(self, request, queryset):
        """Mark selected reviews as spam"""
        updated = queryset.update(
            status='spam',
            moderated_at=timezone.now(),
            moderated_by=request.user
        )
        self.message_user(
            request, 
            f'{updated} review(s) were marked as spam.'
        )
    mark_as_spam.short_description = "Mark selected reviews as spam"
    
    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete reviews"""
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        """Staff users can change reviews"""
        return request.user.is_staff
    
    def has_add_permission(self, request):
        """Staff users can add reviews"""
        return request.user.is_staff
