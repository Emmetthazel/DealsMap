from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError

from .models import Deal
from apps.businesses.models import Business
from apps.categories.models import Category

User = get_user_model()


class DealViewSetTestCase(APITestCase):
    """Test cases for DealViewSet"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test category
        self.category = Category.objects.create(
            name='Restaurant',
            description='Food and dining'
        )
        
        # Create test business
        self.business = Business.objects.create(
            name='Test Restaurant',
            address='123 Test St',
            city='Test City',
            postal_code='12345',
            owner=self.user,
            category=self.category,
            is_active=True,
            is_verified=True
        )
        
        # Create test deal
        self.deal = Deal.objects.create(
            business=self.business,
            title='Test Deal',
            description='Test deal description',
            original_price=Decimal('20.00'),
            deal_price=Decimal('15.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            max_uses=100,
            is_active=True
        )
    
    def test_list_deals(self):
        """Test listing deals"""
        url = reverse('deal-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Deal')
    
    def test_create_deal(self):
        """Test creating a new deal"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('deal-list')
        data = {
            'business': self.business.id,
            'title': 'New Deal',
            'description': 'New deal description',
            'original_price': '25.00',
            'deal_price': '18.00',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timedelta(days=14)).isoformat(),
            'max_uses': 50,
            'is_active': True
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Deal.objects.count(), 2)
        
        # Check if discount percentage was auto-calculated
        new_deal = Deal.objects.get(title='New Deal')
        self.assertEqual(new_deal.discount_percentage, Decimal('28.00'))
    
    def test_deal_validation_rules(self):
        """Test deal validation rules"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('deal-list')
        
        # Test: duration > 4 weeks should fail
        data = {
            'business': self.business.id,
            'title': 'Invalid Duration Deal',
            'description': 'Test deal with invalid duration',
            'original_price': '30.00',
            'deal_price': '20.00',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timedelta(days=30)).isoformat(),  # 30 days > 28
            'max_uses': 50,
            'is_active': True
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('end_date', response.data)
        
        # Test: deal price >= original price should fail
        data = {
            'business': self.business.id,
            'title': 'Invalid Price Deal',
            'description': 'Test deal with invalid price',
            'original_price': '20.00',
            'deal_price': '25.00',  # Higher than original
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timedelta(days=7)).isoformat(),
            'max_uses': 50,
            'is_active': True
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('deal_price', response.data)
    
    def test_nearby_deals(self):
        """Test nearby deals endpoint"""
        url = reverse('deals-nearby')
        params = {
            'lat': '48.8566',
            'lng': '2.3522',
            'radius': '10'
        }
        
        response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_search_deals(self):
        """Test search deals endpoint"""
        url = reverse('deals-search')
        params = {
            'min_price': '10.00',
            'max_price': '30.00',
            'min_discount': '20.00'
        }
        
        response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_my_deals(self):
        """Test my deals endpoint"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('my-deals')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_deal_validation(self):
        """Test deal validation rules"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('deal-list')
        
        # Test: deal price >= original price
        data = {
            'business': self.business.id,
            'title': 'Invalid Deal',
            'description': 'Invalid deal',
            'original_price': '20.00',
            'deal_price': '25.00',  # Higher than original
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timedelta(days=7)).isoformat(),
            'max_uses': 50
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('deal_price', response.data)
        
        # Test: duration > 4 weeks
        data = {
            'business': self.business.id,
            'title': 'Long Deal',
            'description': 'Long deal',
            'original_price': '20.00',
            'deal_price': '15.00',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timedelta(days=30)).isoformat(),  # 30 days
            'max_uses': 50
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('end_date', response.data)


class DealModelTestCase(TestCase):
    """Test cases for Deal model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.category = Category.objects.create(
            name='Restaurant',
            description='Food and dining'
        )
        
        self.business = Business.objects.create(
            name='Test Restaurant',
            address='123 Test St',
            city='Test City',
            postal_code='12345',
            owner=self.user,
            category=self.category,
            is_active=True,
            is_verified=True
        )
    
    def test_deal_creation(self):
        """Test deal creation with validation"""
        deal = Deal(
            business=self.business,
            title='Test Deal',
            description='Test deal description',
            original_price=Decimal('20.00'),
            deal_price=Decimal('15.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            max_uses=100
        )
        
        # This should not raise validation errors
        deal.full_clean()
        deal.save()
        
        self.assertEqual(deal.discount_percentage, Decimal('25.00'))
        self.assertTrue(deal.is_valid)
    
    def test_deal_validation_rules(self):
        """Test deal validation rules"""
        # Test: deal price >= original price
        deal = Deal(
            business=self.business,
            title='Invalid Deal',
            description='Invalid deal',
            original_price=Decimal('20.00'),
            deal_price=Decimal('25.00'),  # Higher than original
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            max_uses=100
        )
        
        with self.assertRaises(ValidationError):
            deal.full_clean()
        
        # Test: duration > 4 weeks
        deal = Deal(
            business=self.business,
            title='Long Deal',
            description='Long deal',
            original_price=Decimal('20.00'),
            deal_price=Decimal('15.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),  # 30 days
            max_uses=100
        )
        
        with self.assertRaises(ValidationError):
            deal.full_clean()
    
    def test_deal_properties(self):
        """Test deal computed properties"""
        deal = Deal.objects.create(
            business=self.business,
            title='Test Deal',
            description='Test deal description',
            original_price=Decimal('20.00'),
            deal_price=Decimal('15.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            max_uses=100,
            current_uses=50
        )
        
        self.assertEqual(deal.get_remaining_uses(), 50)
        self.assertEqual(deal.calculate_discount(), Decimal('5.00'))
        self.assertTrue(deal.is_valid)
        self.assertFalse(deal.is_expired)
        self.assertFalse(deal.is_fully_used)

