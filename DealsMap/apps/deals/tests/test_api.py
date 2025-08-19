from rest_framework.test import APITestCase
from django.urls import reverse
from DealsMap.apps.deals.models import Deal
from DealsMap.apps.businesses.models import Business
from django.contrib.auth import get_user_model

class DealAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='test', password='testpass')
        self.business = Business.objects.create(name='Test Biz', owner=self.user, location='POINT(0 0)')
        self.deal = Deal.objects.create(title='Test Deal', business=self.business, is_active=True)

    def test_list_deals(self):
        url = reverse('deal-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue('results' in response.data or isinstance(response.data, list))

    def test_filter_deals_by_category(self):
        url = reverse('deal-list')
        response = self.client.get(url, {'business__category': self.business.category_id})
        self.assertEqual(response.status_code, 200)

    def test_nearby_deals(self):
        url = reverse('deal-nearby')
        response = self.client.get(url, {'lat': 0, 'lng': 0, 'radius': 10})
        self.assertEqual(response.status_code, 200)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertTrue(any(d['id'] == self.deal.id for d in data))
