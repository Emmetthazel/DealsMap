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
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_id', 'business', 'deal', 'rating', 'comment',
            'status', 'created_at', 'updated_at', 'business_name', 'deal_title',
            'average_rating'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at', 'average_rating']
    
    def get_average_rating(self, obj):
        return obj.get_average_rating()
    
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

class ReviewCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Review
        fields = ['user_id', 'business', 'deal', 'rating', 'comment']
    
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

class ReviewStatsSerializer(serializers.Serializer):
    total_reviews = serializers.IntegerField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_distribution = serializers.DictField()
    pending_moderation = serializers.IntegerField()
