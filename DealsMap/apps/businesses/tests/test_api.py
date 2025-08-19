from rest_framework.test import APITestCase
from django.urls import reverse
from apps.businesses.models import Business
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point

class BusinessNearbyAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='test', password='testpass')
        self.business = Business.objects.create(name='Test Biz', owner=self.user, location=Point(0, 0))

    def test_nearby_businesses(self):
        url = reverse('business-nearby')
        response = self.client.get(url, {'lat': 0, 'lng': 0, 'radius': 10})
        self.assertEqual(response.status_code, 200)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertTrue(any(b['id'] == self.business.id for b in data))
