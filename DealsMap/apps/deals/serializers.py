from rest_framework import serializers
from .models import Deal
from apps.businesses.models import Business
from apps.categories.models import Category


class DealSerializer(serializers.ModelSerializer):
    """Serializer for Deal model with validation"""
    
    business_name = serializers.CharField(source='business.name', read_only=True)
    business_address = serializers.CharField(source='business.address', read_only=True)
    category_name = serializers.CharField(source='business.category.name', read_only=True)
    
    # Custom fields for frontend
    days_remaining = serializers.SerializerMethodField()
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_fully_used = serializers.BooleanField(read_only=True)
    remaining_uses = serializers.SerializerMethodField()
    
    class Meta:
        model = Deal
        fields = [
            'id', 'business', 'business_name', 'business_address', 'category_name',
            'title', 'description', 'original_price', 'deal_price', 'discount_percentage',
            'image', 'start_date', 'end_date', 'max_uses', 'current_uses',
            'conditions', 'is_active', 'created_at',
            'days_remaining', 'is_valid', 'is_expired', 'is_fully_used', 'remaining_uses'
        ]
        read_only_fields = ['id', 'created_at', 'current_uses', 'discount_percentage']
    
    def get_days_remaining(self, obj):
        """Get days remaining until deal expires"""
        return obj.get_days_remaining()
    
    def get_remaining_uses(self, obj):
        """Get remaining uses for this deal"""
        return obj.get_remaining_uses()
    
    def validate(self, data):
        """Custom validation for deal data"""
        # Validate that deal price is less than original price
        if 'deal_price' in data and 'original_price' in data:
            if data['deal_price'] >= data['original_price']:
                raise serializers.ValidationError({
                    'deal_price': 'Deal price must be less than original price.'
                })
        
        # Validate date range (max 4 weeks)
        if 'start_date' in data and 'end_date' in data:
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date.'
                })
            
            # Check if duration is more than 4 weeks
            from django.utils import timezone
            duration = data['end_date'] - data['start_date']
            if duration.days > 28:  # 4 weeks = 28 days
                raise serializers.ValidationError({
                    'end_date': 'Deal duration cannot exceed 4 weeks.'
                })
        
        # Auto-calculate discount percentage if not provided
        if 'original_price' in data and 'deal_price' in data:
            if data['deal_price'] < data['original_price']:
                discount = ((data['original_price'] - data['deal_price']) / data['original_price']) * 100
                data['discount_percentage'] = round(discount, 2)
        
        # Validate image size and format
        if 'image' in data and data['image']:
            image = data['image']
            # Check file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                raise serializers.ValidationError({
                    'image': 'Image file size must be under 5MB.'
                })
            
            # Check file format
            allowed_formats = ['image/jpeg', 'image/png', 'image/webp']
            if image.content_type not in allowed_formats:
                raise serializers.ValidationError({
                    'image': 'Only JPEG, PNG and WebP images are allowed.'
                })
        
        return data


class DealCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating deals"""
    
    class Meta:
        model = Deal
        fields = [
            'business', 'title', 'description', 'original_price', 'deal_price',
            'image', 'start_date', 'end_date', 'max_uses', 'conditions', 'is_active'
        ]
    
    def validate_business(self, value):
        """Validate that the business exists and is active"""
        if not value.is_active:
            raise serializers.ValidationError("Cannot create deals for inactive businesses.")
        return value


class DealUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating deals"""
    
    class Meta:
        model = Deal
        fields = [
            'title', 'description', 'original_price', 'deal_price',
            'image', 'start_date', 'end_date', 'max_uses', 'conditions', 'is_active'
        ]
        read_only_fields = ['current_uses']  # Cannot modify current uses directly


class DealListSerializer(serializers.ModelSerializer):
    """Simplified serializer for deal lists"""
    
    business_name = serializers.CharField(source='business.name', read_only=True)
    business_address = serializers.CharField(source='business.address', read_only=True)
    category_name = serializers.CharField(source='business.category.name', read_only=True)
    business_location = serializers.SerializerMethodField()
    
    class Meta:
        model = Deal
        fields = [
            'id', 'title', 'original_price', 'deal_price', 'discount_percentage',
            'image', 'start_date', 'end_date', 'is_active', 'business_name',
            'business_address', 'category_name', 'business_location'
        ]
    
    def get_business_location(self, obj):
        """Get business coordinates for geolocation"""
        if obj.business.location:
            return {
                'latitude': obj.business.location.y,
                'longitude': obj.business.location.x
            }
        return None

