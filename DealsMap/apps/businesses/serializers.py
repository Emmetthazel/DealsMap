from rest_framework import serializers
from .models import Business
from apps.categories.serializers import CategorySerializer
from apps.authentication.serializers import UserProfileSerializer


class BusinessSerializer(serializers.ModelSerializer):
    """
    Basic serializer for Business model
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    distance = serializers.SerializerMethodField()
    
    def get_distance(self, obj):
        """Get distance in kilometers"""
        if hasattr(obj, 'distance'):
            return round(obj.distance.km, 2)
        return None
    
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'address', 'city', 'postal_code',
            'latitude', 'longitude', 'opening_hours', 'image',
            'is_active', 'is_verified', 'created_at', 'updated_at',
            'category', 'category_name', 'owner', 'owner_name', 'distance'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'distance']


class BusinessDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Business model with related data
    """
    category = CategorySerializer(read_only=True)
    owner = UserProfileSerializer(read_only=True)
    distance = serializers.SerializerMethodField()
    
    def get_distance(self, obj):
        """Get distance in kilometers"""
        if hasattr(obj, 'distance'):
            return round(obj.distance.km, 2)
        return None
    
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'address', 'city', 'postal_code',
            'latitude', 'longitude', 'opening_hours', 'image',
            'is_active', 'is_verified', 'created_at', 'updated_at',
            'category', 'owner', 'distance'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'distance']


class BusinessCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new businesses
    """
    class Meta:
        model = Business
        fields = [
            'name', 'address', 'city', 'postal_code',
            'latitude', 'longitude', 'opening_hours', 'image',
            'category'
        ]
    
    def create(self, validated_data):
        # Set the owner to the current user
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_latitude(self, value):
        """Validate latitude is between -90 and 90"""
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        """Validate longitude is between -180 and 180"""
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value


class NearbyBusinessSerializer(serializers.ModelSerializer):
    """
    Serializer for nearby business search results
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    distance_km = serializers.SerializerMethodField()
    
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'address', 'city', 'postal_code',
            'latitude', 'longitude', 'image', 'is_verified',
            'category_name', 'distance_km'
        ]
    
    def get_distance_km(self, obj):
        """Get distance in kilometers"""
        if hasattr(obj, 'distance'):
            # Convert from degrees to kilometers (roughly 111.32 km per degree)
            return round(obj.distance.km, 2)
        return None
