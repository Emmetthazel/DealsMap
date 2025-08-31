from rest_framework import serializers
from .models import Review
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    deal_title = serializers.CharField(source='deal.title', read_only=True)
    owner_response = serializers.CharField(read_only=True)
    owner_response_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_id', 'business', 'deal', 'rating', 'comment',
            'status', 'created_at', 'updated_at', 'business_name', 'deal_title',
            'owner_response', 'owner_response_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at', 'owner_response', 'owner_response_at']
    
    def validate(self, data):
        # Ensure either business or deal is provided, but not both
        business = data.get('business')
        deal = data.get('deal')
        
        if not business and not deal:
            raise serializers.ValidationError("Either business or deal must be provided.")
        
        if business and deal:
            raise serializers.ValidationError("Cannot review both business and deal simultaneously.")
        
        # Check if user already reviewed this business/deal
        user_id = data.get('user_id')
        if business:
            if Review.objects.filter(user_id=user_id, business=business).exists():
                raise serializers.ValidationError("You have already reviewed this business.")
        elif deal:
            if Review.objects.filter(user_id=user_id, deal=deal).exists():
                raise serializers.ValidationError("You have already reviewed this deal.")
        
        return data
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        validated_data['user_id'] = user_id
        return super().create(validated_data)

from decimal import Decimal

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['business', 'deal', 'rating', 'comment']
    
    def validate_rating(self, value):
        # Convert any numeric value to Decimal
        if isinstance(value, (int, float)):
            value = Decimal(str(value))
        
        # Round to nearest 0.5 to match the choices
        value = round(value * 2) / 2
        
        # Ensure rating is within valid range
        if value < Decimal('0.5') or value > Decimal('5.0'):
            raise serializers.ValidationError("Rating must be between 0.5 and 5.0")
        
        return value
    
    def validate(self, data):
        # Ensure either business or deal is provided, but not both
        business = data.get('business')
        deal = data.get('deal')
        
        if not business and not deal:
            raise serializers.ValidationError("Either business or deal must be provided.")
        
        if business and deal:
            raise serializers.ValidationError("Cannot review both business and deal simultaneously.")
        
        return data

class ReviewModerationSerializer(serializers.ModelSerializer):
    moderator_id = serializers.IntegerField(write_only=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Review
        fields = ['moderator_id', 'reason']
    
    def update(self, instance, validated_data):
        moderator_id = validated_data.pop('moderator_id', None)
        reason = validated_data.pop('reason', '')
        
        if moderator_id:
            try:
                moderator = User.objects.get(id=moderator_id)
                if validated_data.get('status') == 'approved':
                    instance.approve(moderator)
                elif validated_data.get('status') == 'rejected':
                    instance.reject(moderator, reason)
            except User.DoesNotExist:
                raise serializers.ValidationError("Moderator not found.")
        
        return instance

class OwnerResponseSerializer(serializers.ModelSerializer):
    """Serializer for business owner responses to reviews"""
    
    class Meta:
        model = Review
        fields = ['owner_response']
    
    def validate_owner_response(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Response text cannot be empty.")
        if len(value) > 1000:
            raise serializers.ValidationError("Response text cannot exceed 1000 characters.")
        return value.strip()

class ReviewStatsSerializer(serializers.Serializer):
    total_reviews = serializers.IntegerField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_distribution = serializers.DictField()
    pending_moderation = serializers.IntegerField()
