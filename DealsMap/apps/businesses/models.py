from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
import os

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
    
    # Business image
    image = models.ImageField(
        upload_to='businesses/',
        null=True,
        blank=True,
        verbose_name="Business Image",
        help_text="Upload a photo of your business"
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
    
    # Category relationship
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
        Returns queryset of businesses within the specified radius
        """
        if not self.location:
            return Business.objects.none()
        
        # Create a point from the given coordinates
        search_point = Point(lng, lat, srid=4326)
        
        # Find businesses within the specified radius
        nearby_businesses = Business.objects.filter(
            location__distance_lte=(search_point, D(km=radius_km)),
            is_active=True
        ).annotate(
            distance=Distance('location', search_point)
        ).order_by('distance')
        
        return nearby_businesses
    
    def calculate_distance(self, lat, lng):
        """
        Calculate distance to a point
        Returns distance in kilometers
        """
        if not self.location:
            return None
        
        # Create a point from the given coordinates
        search_point = Point(lng, lat, srid=4326)
        
        # Calculate distance
        distance = self.location.distance(search_point)
        
        # Convert to kilometers (distance is in degrees, roughly 111km per degree)
        distance_km = distance * 111.32
        
        return round(distance_km, 2)
    
    @classmethod
    def find_nearby_businesses(cls, lat, lng, radius_km=10, category=None):
        """
        Class method to find nearby businesses from any point
        """
        search_point = Point(lng, lat, srid=4326)
        
        queryset = cls.objects.filter(
            location__distance_lte=(search_point, D(km=radius_km)),
            is_active=True
        ).annotate(
            distance=Distance('location', search_point)
        ).order_by('distance')
        
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset
