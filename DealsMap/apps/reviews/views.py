from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

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
        serializer.save(user_id=self.request.user.id)
    
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
    
    @action(detail=False, methods=['get'])
    def deal_reviews(self, request):
        """Get reviews for a specific deal"""
        deal_id = request.query_params.get('deal_id')
        if not deal_id:
            return Response(
                {'error': 'deal_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = Review.objects.filter(
            deal_id=deal_id, 
            status='approved'
        ).order_by('-created_at')
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
