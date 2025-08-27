from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import re

User = get_user_model()

class Review(models.Model):
    RATING_CHOICES = [
        (0.5, '0.5'),
        (1.0, '1.0'),
        (1.5, '1.5'),
        (2.0, '2.0'),
        (2.5, '2.5'),
        (3.0, '3.0'),
        (3.5, '3.5'),
        (4.0, '4.0'),
        (4.5, '4.5'),
        (5.0, '5.0'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('spam', 'Spam détecté'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    deal = models.ForeignKey('deals.Deal', on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        choices=RATING_CHOICES,
        validators=[MinValueValidator(0.5), MaxValueValidator(5.0)]
    )
    comment = models.TextField(max_length=1000)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_reviews')
    
    class Meta:
        unique_together = [
            ('user', 'business'),
            ('user', 'deal'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(business__isnull=False) | models.Q(deal__isnull=False),
                name='review_must_have_business_or_deal'
            ),
            models.CheckConstraint(
                check=~(models.Q(business__isnull=False) & models.Q(deal__isnull=False)),
                name='review_cannot_have_both_business_and_deal'
            ),
        ]
    
    def __str__(self):
        if self.business:
            return f"Review by {self.user.username} for {self.business.name} - {self.rating}/5"
        else:
            return f"Review by {self.user.username} for {self.deal.title} - {self.rating}/5"
    
    def save(self, *args, **kwargs):
        # Auto-moderation for spam detection
        if self.status == 'pending':
            if self._detect_spam():
                self.status = 'spam'
            elif self._detect_inappropriate_content():
                self.status = 'rejected'
        
        super().save(*args, **kwargs)
    
    def _detect_spam(self):
        """Detect spam patterns in comments"""
        spam_patterns = [
            r'\b(?:buy|cheap|discount|offer|limited|urgent)\b',
            r'[A-Z]{5,}',  # Too many caps
            r'[!]{3,}',    # Too many exclamation marks
            r'https?://',   # URLs
        ]
        
        comment_lower = self.comment.lower()
        spam_score = 0
        
        for pattern in spam_patterns:
            if re.search(pattern, comment_lower, re.IGNORECASE):
                spam_score += 1
        
        return spam_score >= 2
    
    def _detect_inappropriate_content(self):
        """Detect inappropriate content"""
        inappropriate_words = [
            'spam', 'scam', 'fake', 'fraud', 'illegal', 'inappropriate'
        ]
        
        comment_lower = self.comment.lower()
        return any(word in comment_lower for word in inappropriate_words)
    
    def approve(self, moderator):
        """Approve the review"""
        self.status = 'approved'
        self.moderated_at = timezone.now()
        self.moderated_by = moderator
        self.save()
    
    def reject(self, moderator, reason=''):
        """Reject the review"""
        self.status = 'rejected'
        self.moderated_at = timezone.now()
        self.moderated_by = moderator
        self.save()
    
    def get_average_rating(self):
        """Get average rating for the business or deal"""
        if self.business:
            return Review.objects.filter(
                business=self.business, 
                status='approved'
            ).aggregate(avg_rating=models.Avg('rating'))['avg_rating'] or 0
        elif self.deal:
            return Review.objects.filter(
                deal=self.deal, 
                status='approved'
            ).aggregate(avg_rating=models.Avg('rating'))['avg_rating']['avg_rating'] or 0
        return 0
