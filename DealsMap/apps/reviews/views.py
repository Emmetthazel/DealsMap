from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Review
from .serializers import (
    ReviewSerializer, 
    ReviewCreateSerializer, 
    ReviewModerationSerializer,
    ReviewStatsSerializer
)

User = get_user_model()

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'business', 'deal')
        
        # Filter by business
        business_id = self.request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        
        # Filter by deal
        deal_id = self.request.query_params.get('deal_id')
        if deal_id:
            queryset = queryset.filter(deal_id=deal_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        max_rating = self.request.query_params.get('max_rating')
        if max_rating:
            queryset = queryset.filter(rating__lte=max_rating)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        elif self.action in ['approve', 'reject']:
            return ReviewModerationSerializer
        return ReviewSerializer
    
    def perform_create(self, serializer):
        # Set the user_id from the authenticated user
        user_id = self.request.user.id
        deal_id = serializer.validated_data.get('deal')
        business_id = serializer.validated_data.get('business')
        
        print(f"🔐 Creating review for user: {user_id}")
        print(f"🔐 Review data: {serializer.validated_data}")
        
        # Check if user already reviewed this deal/business
        if deal_id:
            existing_review = Review.objects.filter(user_id=user_id, deal_id=deal_id).first()
        elif business_id:
            existing_review = Review.objects.filter(user_id=user_id, business_id=business_id).first()
        else:
            existing_review = None
        
        if existing_review:
            print(f"🔄 User already reviewed, updating existing review: {existing_review.id}")
            # Update existing review
            existing_review.rating = serializer.validated_data['rating']
            existing_review.comment = serializer.validated_data['comment']
            existing_review.status = 'pending'  # Reset to pending for moderation
            existing_review.save()
            print(f"✅ Existing review updated successfully")
            
            # Return the updated review data
            return Response({
                'id': existing_review.id,
                'rating': existing_review.rating,
                'comment': existing_review.comment,
                'business': existing_review.business_id,
                'deal': existing_review.deal_id,
                'status': existing_review.status,
                'created_at': existing_review.created_at,
                'updated_at': existing_review.updated_at
            }, status=status.HTTP_200_OK)
        else:
            print(f"🆕 Creating new review")
            # Create new review
            new_review = serializer.save(user_id=user_id)
            print(f"✅ New review created successfully")
            
            # Return the new review data
            return Response({
                'id': new_review.id,
                'rating': new_review.rating,
                'comment': new_review.comment,
                'business': new_review.business_id,
                'deal': new_review.deal_id,
                'status': new_review.status,
                'created_at': new_review.created_at,
                'updated_at': new_review.updated_at
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a review (admin only)"""
        review = self.get_object()
        serializer = self.get_serializer(review, data={'status': 'approved'})
        
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Review approved successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject a review (admin only)"""
        review = self.get_object()
        reason = request.data.get('reason', '')
        serializer = self.get_serializer(review, data={'status': 'rejected'})
        
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Review rejected successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def owner_response(self, request, pk=None):
        """Allow business owner to respond to a review"""
        review = self.get_object()
        
        # Check if user owns the business or deal
        if review.business and review.business.owner != request.user:
            return Response(
                {'error': 'Only business owner can respond to reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif review.deal and review.deal.business.owner != request.user:
            return Response(
                {'error': 'Only business owner can respond to reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        response_text = request.data.get('response')
        if not response_text:
            return Response(
                {'error': 'Response text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the review with owner response
        review.owner_response = response_text
        review.owner_response_at = timezone.now()
        review.save()
        
        return Response({
            'message': 'Owner response added successfully',
            'owner_response': response_text,
            'owner_response_at': review.owner_response_at.isoformat()
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def pending_moderation(self, request):
        """Get reviews pending moderation (admin only)"""
        pending_reviews = Review.objects.filter(status='pending').order_by('created_at')
        serializer = self.get_serializer(pending_reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get review statistics"""
        business_id = request.query_params.get('business_id')
        deal_id = request.query_params.get('deal_id')
        
        if business_id:
            queryset = Review.objects.filter(business_id=business_id, status='approved')
        elif deal_id:
            queryset = Review.objects.filter(deal_id=deal_id, status='approved')
        else:
            queryset = Review.objects.filter(status='approved')
        
        total_reviews = queryset.count()
        average_rating = queryset.aggregate(avg=Avg('rating'))['avg'] or 0
        
        # Rating distribution
        rating_distribution = {}
        for i in range(1, 6):
            count = queryset.filter(rating=i).count()
            rating_distribution[str(i)] = count
        
        # Pending moderation count
        pending_count = Review.objects.filter(status='pending').count()
        
        stats_data = {
            'total_reviews': total_reviews,
            'average_rating': round(average_rating, 2),
            'rating_distribution': rating_distribution,
            'pending_moderation': pending_count
        }
        
        serializer = ReviewStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get current user's reviews"""
        user_reviews = Review.objects.filter(user=request.user).order_by('-created_at')
        serializer = self.get_serializer(user_reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def business_reviews(self, request):
        """Get reviews for a specific business"""
        business_id = request.query_params.get('business_id')
        if not business_id:
            return Response(
                {'error': 'business_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = Review.objects.filter(
            business_id=business_id, 
            status='approved'
        ).order_by('-created_at')
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def deal_reviews(self, request):
        """Get reviews for a specific deal - public access"""
        deal_id = request.query_params.get('deal_id')
        if not deal_id:
            return Response(
                {'error': 'deal_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Show ALL reviews for the deal, not just approved ones
        # This allows users to see their own pending reviews
        reviews = Review.objects.filter(
            deal_id=deal_id
        ).order_by('-created_at')
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
