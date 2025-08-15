from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from decimal import Decimal
from datetime import timedelta

from .models import Deal
from businesses.models import Business
from categories.models import Category

User = get_user_model()


class DealModelTest(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test category
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        
        # Create test business
        self.business = Business.objects.create(
            name='Test Business',
            address='123 Test Street',
            city='Test City',
            postal_code='12345',
            location=Point(2.3522, 48.8566, srid=4326),  # Paris coordinates
            owner=self.user,
            category=self.category
        )
        
        # Create test deal
        self.deal = Deal.objects.create(
            business=self.business,
            title='Test Deal',
            description='A test deal for testing purposes',
            original_price=Decimal('100.00'),
            deal_price=Decimal('75.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=14),
            max_uses=50,
            conditions='Standard terms apply'
        )
    
    def test_deal_creation(self):
        """Test basic deal creation"""
        self.assertEqual(self.deal.title, 'Test Deal')
        self.assertEqual(self.deal.business, self.business)
        self.assertEqual(self.deal.original_price, Decimal('100.00'))
        self.assertEqual(self.deal.deal_price, Decimal('75.00'))
        self.assertTrue(self.deal.is_active)
        self.assertEqual(self.deal.current_uses, 0)
    
    def test_discount_percentage_auto_calculation(self):
        """Test automatic discount percentage calculation"""
        # Discount should be automatically calculated: (100-75)/100 * 100 = 25%
        self.assertEqual(self.deal.discount_percentage, Decimal('25.00'))
    
    def test_deal_price_validation(self):
        """Test that deal price must be less than original price"""
        with self.assertRaises(ValidationError):
            invalid_deal = Deal(
                business=self.business,
                title='Invalid Deal',
                description='Invalid deal with wrong pricing',
                original_price=Decimal('50.00'),
                deal_price=Decimal('75.00'),  # Higher than original
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=7)
            )
            invalid_deal.full_clean()
    
    def test_date_validation(self):
        """Test date validation constraints"""
        # Test end date before start date
        with self.assertRaises(ValidationError):
            invalid_deal = Deal(
                business=self.business,
                title='Invalid Date Deal',
                description='Invalid deal with wrong dates',
                original_price=Decimal('100.00'),
                deal_price=Decimal('75.00'),
                start_date=timezone.now() + timedelta(days=7),
                end_date=timezone.now()  # Before start date
            )
            invalid_deal.full_clean()
        
        # Test duration more than 4 weeks
        with self.assertRaises(ValidationError):
            invalid_deal = Deal(
                business=self.business,
                title='Too Long Deal',
                description='Invalid deal with too long duration',
                original_price=Decimal('100.00'),
                deal_price=Decimal('75.00'),
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=30)  # More than 4 weeks
            )
            invalid_deal.full_clean()
    
    def test_deal_validity(self):
        """Test deal validity properties"""
        # Deal should be valid initially
        self.assertTrue(self.deal.is_valid)
        self.assertFalse(self.deal.is_expired)
        self.assertFalse(self.deal.is_fully_used)
        
        # Test expired deal
        expired_deal = Deal.objects.create(
            business=self.business,
            title='Expired Deal',
            description='An expired deal',
            original_price=Decimal('100.00'),
            deal_price=Decimal('75.00'),
            start_date=timezone.now() - timedelta(days=14),
            end_date=timezone.now() - timedelta(days=7)
        )
        self.assertFalse(expired_deal.is_valid)
        self.assertTrue(expired_deal.is_expired)
    
    def test_usage_limits(self):
        """Test usage limit functionality"""
        # Test increment usage
        initial_uses = self.deal.current_uses
        self.assertTrue(self.deal.increment_usage())
        self.assertEqual(self.deal.current_uses, initial_uses + 1)
        
        # Test reaching max uses
        self.deal.current_uses = self.deal.max_uses
        self.deal.save()
        self.assertFalse(self.deal.increment_usage())
        self.assertTrue(self.deal.is_fully_used)
        self.assertFalse(self.deal.is_valid)
    
    def test_calculate_discount(self):
        """Test discount calculation"""
        discount_amount = self.deal.calculate_discount()
        expected_discount = self.deal.original_price - self.deal.deal_price
        self.assertEqual(discount_amount, expected_discount)
        self.assertEqual(discount_amount, Decimal('25.00'))
    
    def test_remaining_uses(self):
        """Test remaining uses calculation"""
        self.assertEqual(self.deal.get_remaining_uses(), 50)
        
        self.deal.current_uses = 25
        self.deal.save()
        self.assertEqual(self.deal.get_remaining_uses(), 25)
        
        self.deal.current_uses = 50
        self.deal.save()
        self.assertEqual(self.deal.get_remaining_uses(), 0)
    
    def test_days_remaining(self):
        """Test days remaining calculation"""
        # Deal should have 14 days remaining
        days_remaining = self.deal.get_days_remaining()
        self.assertGreater(days_remaining, 0)
        self.assertLessEqual(days_remaining, 14)
        
        # Expired deal should have 0 days
        expired_deal = Deal.objects.create(
            business=self.business,
            title='Expired Deal',
            description='An expired deal',
            original_price=Decimal('100.00'),
            deal_price=Decimal('75.00'),
            start_date=timezone.now() - timedelta(days=14),
            end_date=timezone.now() - timedelta(days=7)
        )
        self.assertEqual(expired_deal.get_days_remaining(), 0)
    
    def test_string_representation(self):
        """Test string representation of deal"""
        expected_string = f"{self.deal.title} - {self.deal.business.name}"
        self.assertEqual(str(self.deal), expected_string)
    
    def test_deal_constraints(self):
        """Test database constraints"""
        # Test that we can't save a deal with current_uses > max_uses
        self.deal.current_uses = 60  # More than max_uses (50)
        with self.assertRaises(Exception):
            self.deal.save()
    
    def test_deal_without_image(self):
        """Test deal creation without image"""
        deal_no_image = Deal.objects.create(
            business=self.business,
            title='Deal Without Image',
            description='A deal without an image',
            original_price=Decimal('100.00'),
            deal_price=Decimal('80.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7)
        )
        self.assertIsNone(deal_no_image.image)
        self.assertTrue(deal_no_image.is_valid)
    
    def test_deal_conditions_optional(self):
        """Test that conditions field is optional"""
        deal_no_conditions = Deal.objects.create(
            business=self.business,
            title='Deal Without Conditions',
            description='A deal without conditions',
            original_price=Decimal('100.00'),
            deal_price=Decimal('80.00'),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7)
        )
        self.assertEqual(deal_no_conditions.conditions, '')
        self.assertTrue(deal_no_conditions.is_valid)
