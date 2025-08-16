import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal


class Deal(models.Model):
    """
    Deal/Promotional offer model linked to Business
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Business relationship
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='deals',
        verbose_name="Business"
    )
    
    # Basic deal information
    title = models.CharField(max_length=255, verbose_name="Deal Title")
    description = models.TextField(verbose_name="Deal Description")
    
    # Pricing information
    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Original Price"
    )
    deal_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Deal Price"
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name="Discount Percentage (%)"
    )
    
    # Image
    image = models.ImageField(
        upload_to='deals/images/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name="Deal Image"
    )
    
    # Validity period
    start_date = models.DateTimeField(
        default=timezone.now,
        verbose_name="Start Date"
    )
    end_date = models.DateTimeField(
        verbose_name="End Date"
    )
    
    # Usage limits
    max_uses = models.PositiveIntegerField(
        default=100,
        verbose_name="Maximum Uses"
    )
    current_uses = models.PositiveIntegerField(
        default=0,
        verbose_name="Current Uses"
    )
    
    # Additional information
    conditions = models.TextField(
        blank=True,
        verbose_name="Terms and Conditions"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        verbose_name="Active"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    
    class Meta:
        verbose_name = "Deal"
        verbose_name_plural = "Deals"
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['is_active']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['discount_percentage']),
        ]
        ordering = ['-created_at']
        
        # Constraints
        constraints = [
            models.CheckConstraint(
                check=models.Q(deal_price__lt=models.F('original_price')),
                name='deal_price_less_than_original'
            ),
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='end_date_after_start_date'
            ),
            models.CheckConstraint(
                check=models.Q(current_uses__lte=models.F('max_uses')),
                name='current_uses_not_exceed_max'
            ),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.business.name}"
    
    def clean(self):
        """Custom validation"""
        super().clean()
        
        # Validate that deal price is less than original price
        if self.deal_price and self.original_price:
            if self.deal_price >= self.original_price:
                raise ValidationError({
                    'deal_price': 'Deal price must be less than original price.'
                })
        
        # Validate date range (max 4 weeks)
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError({
                    'end_date': 'End date must be after start date.'
                })
            
            # Check if duration is more than 4 weeks
            duration = self.end_date - self.start_date
            if duration.days > 28:  # 4 weeks = 28 days
                raise ValidationError({
                    'end_date': 'Deal duration cannot exceed 4 weeks.'
                })
        
        # Auto-calculate discount percentage if not provided
        if self.original_price and self.deal_price and not self.discount_percentage:
            discount = ((self.original_price - self.deal_price) / self.original_price) * 100
            self.discount_percentage = round(discount, 2)
    
    def save(self, *args, **kwargs):
        # Run validation before saving
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_valid(self):
        """Check if deal is currently valid"""
        now = timezone.now()
        return (
            self.is_active and
            self.start_date <= now <= self.end_date and
            self.current_uses < self.max_uses
        )
    
    @property
    def is_expired(self):
        """Check if deal has expired"""
        return timezone.now() > self.end_date
    
    @property
    def is_fully_used(self):
        """Check if deal has reached maximum uses"""
        return self.current_uses >= self.max_uses
    
    def calculate_discount(self):
        """Calculate the actual discount amount"""
        return self.original_price - self.deal_price
    
    def increment_usage(self):
        """Increment the current usage count"""
        if self.current_uses < self.max_uses:
            self.current_uses += 1
            self.save(update_fields=['current_uses'])
            return True
        return False
    
    def get_remaining_uses(self):
        """Get remaining uses for this deal"""
        return max(0, self.max_uses - self.current_uses)
    
    def get_days_remaining(self):
        """Get days remaining until deal expires"""
        if self.is_expired:
            return 0
        remaining = self.end_date - timezone.now()
        return max(0, remaining.days)
