from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class Business(models.Model):
    """
    Business/Establishment model with geolocation support using PostGIS
    """
    name = models.CharField(max_length=255, verbose_name="Business Name")
    address = models.CharField(max_length=500, verbose_name="Address")
    city = models.CharField(max_length=100, verbose_name="City")
    postal_code = models.CharField(max_length=20, verbose_name="Postal Code")
    
    # PostGIS PointField for geolocation (SRID 4326 for WGS84)
    location = gis_models.PointField(
        srid=4326, 
        verbose_name="Location (Latitude, Longitude)",
        help_text="Geographic coordinates (latitude, longitude)"
    )
    
    # Opening hours stored as JSON
    opening_hours = models.JSONField(
        default=dict,
        verbose_name="Opening Hours",
        help_text="JSON format: {'monday': {'open': '09:00', 'close': '18:00'}, ...}"
    )
    
    # Status fields
    is_active = models.BooleanField(default=True, verbose_name="Active")
    is_verified = models.BooleanField(default=False, verbose_name="Verified")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    # Owner relationship
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='businesses',
        verbose_name="Owner"
    )
    
    # Category relationship (assuming you have a Category model)
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='businesses',
        verbose_name="Category"
    )
    
    class Meta:
        verbose_name = "Business"
        verbose_name_plural = "Businesses"
        # Spatial index on location field for efficient geospatial queries
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['city']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_verified']),
            # Spatial index will be created automatically by PostGIS
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.city}"
    
    def save(self, *args, **kwargs):
        # Ensure location is a Point object if coordinates are provided
        if hasattr(self, '_temp_lat') and hasattr(self, '_temp_lng'):
            self.location = Point(self._temp_lng, self._temp_lat, srid=4326)
        super().save(*args, **kwargs)
    
    @property
    def latitude(self):
        """Get latitude from location point"""
        if self.location:
            return self.location.y
        return None
    
    @property
    def longitude(self):
        """Get longitude from location point"""
        if self.location:
            return self.location.x
        return None
    
    def set_location(self, lat, lng):
        """Set location using latitude and longitude"""
        self.location = Point(lng, lat, srid=4326)
    
    def get_nearby(self, lat, lng, radius_km=10):
        """
        Get nearby businesses within specified radius
        This will be implemented in Day 2
        """
        pass
    
    def calculate_distance(self, lat, lng):
        """
        Calculate distance to a point
        This will be implemented in Day 2
        """
        pass
