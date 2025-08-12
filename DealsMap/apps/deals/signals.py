from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Deal


@receiver(pre_save, sender=Deal)
def auto_calculate_discount_percentage(sender, instance, **kwargs):
    """
    Auto-calculate discount percentage when deal is saved
    """
    if instance.original_price and instance.deal_price:
        if not instance.discount_percentage:
            discount = ((instance.original_price - instance.deal_price) / instance.original_price) * 100
            instance.discount_percentage = round(discount, 2)


@receiver(post_save, sender=Deal)
def handle_deal_status_changes(sender, instance, created, **kwargs):
    """
    Handle automatic status changes for deals
    """
    if created:
        # New deal created
        pass
    
    # Check if deal has expired and should be deactivated
    if instance.is_active and instance.end_date and instance.end_date < timezone.now():
        instance.is_active = False
        instance.save(update_fields=['is_active'])
