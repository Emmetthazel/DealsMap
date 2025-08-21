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
    # Add explicit fields for latitude and longitude since they're @property fields
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    
    class Meta:
        model = Business
        fields = [
            'name', 'address', 'city', 'postal_code',
            'latitude', 'longitude', 'opening_hours', 'image',
            'category'
        ]
    
    def create(self, validated_data):
        # Debug: print what we're receiving
        print(f"DEBUG: Received data: {validated_data}")
        print(f"DEBUG: Data type: {type(validated_data)}")
        print(f"DEBUG: Data keys: {list(validated_data.keys())}")
        
        # Set the owner to the current user
        validated_data['owner'] = self.context['request'].user
        
        # Convert latitude and longitude to location Point
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        
        print(f"DEBUG: Latitude: {latitude}, Longitude: {longitude}")
        print(f"DEBUG: Latitude type: {type(latitude)}, Longitude type: {type(longitude)}")
        
        if latitude is not None and longitude is not None:
            try:
                from django.contrib.gis.geos import Point
                validated_data['location'] = Point(longitude, latitude, srid=4326)
                print(f"DEBUG: Created Point: {validated_data['location']}")
            except Exception as e:
                print(f"DEBUG: Error creating Point: {e}")
                raise serializers.ValidationError(f"Invalid coordinates: {e}")
        else:
            print("DEBUG: No latitude/longitude provided")
            raise serializers.ValidationError("Latitude and longitude are required")
        
        # Keep category field - let the model handle validation
        if 'category' in validated_data:
            print(f"DEBUG: Category field present: {validated_data['category']}")
            if validated_data['category'] == '' or validated_data['category'] is None:
                validated_data['category'] = None  # Set to None instead of removing
                print("DEBUG: Set category to None")
            else:
                print(f"DEBUG: Category value: {validated_data['category']}")
        
        # Handle opening_hours if it's a JSON string
        if 'opening_hours' in validated_data and isinstance(validated_data['opening_hours'], str):
            try:
                import json
                validated_data['opening_hours'] = json.loads(validated_data['opening_hours'])
                print("DEBUG: Parsed opening_hours JSON string")
            except json.JSONDecodeError as e:
                print(f"DEBUG: Error parsing opening_hours JSON: {e}")
                validated_data['opening_hours'] = {}
        
        print(f"DEBUG: Final validated_data: {validated_data}")
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Convert latitude and longitude to location Point if provided
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        
        if latitude is not None and longitude is not None:
            from django.contrib.gis.geos import Point
            validated_data['location'] = Point(longitude, latitude, srid=4326)
        
        return super().update(instance, validated_data)
    
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
