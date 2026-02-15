"""
Management command to seed Sri Lankan cities into the database.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from weather.models import City, WeatherAlert, ClimateNormal, ActivityOutlook


class Command(BaseCommand):
    help = 'Seed the database with Sri Lankan cities, sample alerts, climate normals, and activities'

    def handle(self, *args, **options):
        self.stdout.write('Seeding cities...')
        cities_data = [
            {'name': 'Colombo', 'province': 'Western Province', 'lat': 6.9271, 'lon': 79.8612},
            {'name': 'Kandy', 'province': 'Central Province', 'lat': 7.2906, 'lon': 80.6337},
            {'name': 'Galle', 'province': 'Southern Province', 'lat': 6.0535, 'lon': 80.2210},
            {'name': 'Jaffna', 'province': 'Northern Province', 'lat': 9.6615, 'lon': 80.0255},
            {'name': 'Trincomalee', 'province': 'Eastern Province', 'lat': 8.5874, 'lon': 81.2152},
            {'name': 'Ratnapura', 'province': 'Sabaragamuwa Province', 'lat': 6.6828, 'lon': 80.3992},
            {'name': 'Nuwara Eliya', 'province': 'Central Province', 'lat': 6.9497, 'lon': 80.7891},
            {'name': 'Badulla', 'province': 'Uva Province', 'lat': 6.9934, 'lon': 81.0550},
            {'name': 'Anuradhapura', 'province': 'North Central Province', 'lat': 8.3114, 'lon': 80.4037},
            {'name': 'Matara', 'province': 'Southern Province', 'lat': 5.9549, 'lon': 80.5550},
            {'name': 'Negombo', 'province': 'Western Province', 'lat': 7.2008, 'lon': 79.8737},
            {'name': 'Batticaloa', 'province': 'Eastern Province', 'lat': 7.7310, 'lon': 81.6747},
            {'name': 'Hikkaduwa', 'province': 'Southern Province', 'lat': 6.1395, 'lon': 80.1063},
            {'name': 'Ella', 'province': 'Uva Province', 'lat': 6.8667, 'lon': 81.0466},
            {'name': 'Sigiriya', 'province': 'Central Province', 'lat': 7.9570, 'lon': 80.7603},
            {'name': 'Diyatalawa', 'province': 'Uva Province', 'lat': 6.8167, 'lon': 80.9667},
            {'name': 'Vavuniya', 'province': 'Northern Province', 'lat': 8.7514, 'lon': 80.4971},
        ]

        for city_data in cities_data:
            city, created = City.objects.get_or_create(
                name=city_data['name'],
                defaults=city_data
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  {status}: {city.name}')

        self.stdout.write(self.style.SUCCESS(f'  {len(cities_data)} cities processed'))

        # Seed sample alerts
        self.stdout.write('Seeding weather alerts...')
        alerts_data = [
            {
                'severity': 'RED',
                'title': 'RED ALERT: Heavy Rain & Landslide Warning',
                'district': 'Ratnapura',
                'description': 'Severe weather warning for Ratnapura district. Expected precipitation exceeds 150mm in the next 12 hours. Flood zone alert for Kalu Ganga basin. Landslide risk zones include Nivithigala and Pelmadulla areas.',
                'instructions': [
                    'Evacuate low-lying areas near Kalu Ganga immediately',
                    'Avoid travel through mountain passes in Ratnapura district',
                    'Keep emergency kit ready with essentials for 72 hours',
                    'Monitor official channels for evacuation orders'
                ],
                'sources': 'DMC / MET / NBRO',
            },
            {
                'severity': 'ORANGE',
                'title': 'ORANGE WARNING: High Heat Index',
                'district': 'Vavuniya',
                'description': 'Heat index expected to exceed 40°C between 11:00 AM and 04:00 PM. Affected districts include Vavuniya and Anuradhapura. Stay hydrated and avoid prolonged sun exposure.',
                'instructions': [
                    'Stay indoors during peak heat hours (11AM-4PM)',
                    'Drink plenty of water and stay hydrated',
                    'Check on elderly neighbors and vulnerable persons'
                ],
                'sources': 'MET Department',
            },
            {
                'severity': 'YELLOW',
                'title': 'YELLOW ADVISORY: Rough Sea Conditions',
                'district': 'Southern Coast',
                'description': 'Rough sea conditions expected along the southern coast from Galle to Matara. Wave heights may reach 2-3 meters. Advisory active for 24 hours.',
                'instructions': [
                    'Fishing communities advised not to venture into deep sea',
                    'Beach activities should be limited',
                    'Follow lifeguard instructions at all times'
                ],
                'sources': 'Navy / MET Department',
            },
            {
                'severity': 'YELLOW',
                'title': 'YELLOW ADVISORY: Flood Watch',
                'district': 'Colombo',
                'description': 'Minor flooding possible near Kelani River banks. Residents advised to remain alert. Water levels are being monitored continuously.',
                'instructions': [
                    'Monitor water levels in nearby waterways',
                    'Keep emergency supplies ready',
                    'Report any unusual rise in water levels to authorities'
                ],
                'sources': 'Irrigation Department',
            },
        ]

        for alert_data in alerts_data:
            alert, created = WeatherAlert.objects.get_or_create(
                title=alert_data['title'],
                defaults=alert_data
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  {status}: [{alert.severity}] {alert.title[:50]}...')

        # Seed climate normals
        self.stdout.write('Seeding climate normals...')
        normals_data = [
            {'station_name': 'Nuwara Eliya', 'max_temp': 20.2, 'min_temp': 9.4,
             'annual_rainfall': 1905.0, 'rainy_days': 225, 'sunshine_hours': 1820},
            {'station_name': 'Badulla', 'max_temp': 28.4, 'min_temp': 18.1,
             'annual_rainfall': 1780.4, 'rainy_days': 168, 'sunshine_hours': 2150},
            {'station_name': 'Kandy', 'max_temp': 29.1, 'min_temp': 19.8,
             'annual_rainfall': 2083.5, 'rainy_days': 184, 'sunshine_hours': 2280},
            {'station_name': 'Diyatalawa', 'max_temp': 24.5, 'min_temp': 15.2,
             'annual_rainfall': 1620.0, 'rainy_days': 195, 'sunshine_hours': 1980},
            {'station_name': 'Colombo', 'max_temp': 31.5, 'min_temp': 23.8,
             'annual_rainfall': 2398.0, 'rainy_days': 170, 'sunshine_hours': 2450},
        ]

        for normal_data in normals_data:
            normal, created = ClimateNormal.objects.get_or_create(
                station_name=normal_data['station_name'],
                defaults=normal_data
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  {status}: {normal.station_name}')

        # Seed activities
        self.stdout.write('Seeding activities...')
        try:
            colombo = City.objects.get(name='Colombo')
        except City.DoesNotExist:
            colombo = None

        activities_data = [
            {'activity_name': 'Surfing', 'location': 'Hikkaduwa', 'suitability': 'GREAT',
             'description': 'Ideal swells and light offshore winds create perfect surfing conditions.', 'icon': 'surfing'},
            {'activity_name': 'Hiking', 'location': 'Ella Rock', 'suitability': 'FAIR',
             'description': 'Moderate cloud cover expected. Carry rain gear as precaution.', 'icon': 'hiking'},
            {'activity_name': 'Sigiriya Tour', 'location': 'Sigiriya', 'suitability': 'POOR',
             'description': 'Heavy rainfall and poor visibility expected. Consider rescheduling.', 'icon': 'tour'},
            {'activity_name': 'Diving', 'location': 'Trincomalee', 'suitability': 'GREAT',
             'description': 'Clear waters with excellent visibility up to 25m.', 'icon': 'scuba_diving'},
            {'activity_name': 'Beach Visit', 'location': 'Negombo', 'suitability': 'FAIR',
             'description': 'Partly cloudy with moderate waves. Suitable for experienced swimmers.', 'icon': 'beach_access'},
        ]

        for activity_data in activities_data:
            activity, created = ActivityOutlook.objects.get_or_create(
                activity_name=activity_data['activity_name'],
                defaults={**activity_data, 'city': colombo}
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  {status}: {activity.activity_name}')

        # Seed alert preferences
        from weather.models import AlertPreference
        for region in ['Ratnapura', 'Colombo']:
            pref, created = AlertPreference.objects.get_or_create(
                region=region,
                defaults={'emergency_monsoon': True, 'sms_alerts': False, 'email_summary': True}
            )

        self.stdout.write(self.style.SUCCESS('\nAll seed data loaded successfully!'))
