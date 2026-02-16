from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Profile, City

User = get_user_model()


class ProfileModelAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client = APIClient()

    def test_profile_auto_created(self):
        profile = Profile.objects.filter(user=self.user).first()
        self.assertIsNotNone(profile)
        self.assertFalse(profile.is_premium)
        self.assertEqual(profile.unit, 'C')

    def test_profile_api_requires_auth(self):
        url = reverse('api-user-profile')
        res = self.client.get(url)
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_get_and_patch_profile(self):
        self.client.force_authenticate(self.user)
        url = reverse('api-user-profile')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('is_premium', res.data)

        # Update unit preference
        patch = {'unit': 'F'}
        res2 = self.client.patch(url, patch, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.unit, 'F')

    def test_subscription_toggle(self):
        self.client.force_authenticate(self.user)
        url = reverse('api-user-subscription')
        res = self.client.post(url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.is_premium)
        # Toggle off explicitly
        res2 = self.client.post(url, {'action': 'disable'}, format='json')
        self.user.profile.refresh_from_db()
        self.assertFalse(self.user.profile.is_premium)
