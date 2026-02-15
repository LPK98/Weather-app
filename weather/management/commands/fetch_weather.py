"""
Management command to fetch current weather for all seeded cities.
Usage: python manage.py fetch_weather
"""
from django.core.management.base import BaseCommand
from weather.models import City
from weather import services


class Command(BaseCommand):
    help = 'Fetch current weather and forecasts for all seeded cities from OpenWeatherMap'

    def add_arguments(self, parser):
        parser.add_argument(
            '--city',
            type=str,
            help='Fetch weather for a specific city only',
        )

    def handle(self, *args, **options):
        city_name = options.get('city')

        if city_name:
            cities = City.objects.filter(name__iexact=city_name)
            if not cities.exists():
                self.stdout.write(self.style.ERROR(f'City "{city_name}" not found in database'))
                return
        else:
            cities = City.objects.all()

        self.stdout.write(f'Fetching weather for {cities.count()} cities...\n')

        success_count = 0
        error_count = 0

        for city in cities:
            self.stdout.write(f'  Fetching: {city.name}...')

            # Fetch current weather
            current = services.get_or_update_current_weather(city)
            if current:
                self.stdout.write(
                    f'    Current: {current.temperature}°C, {current.condition}'
                )
                success_count += 1
            else:
                self.stdout.write(self.style.WARNING(f'    Failed to fetch current weather'))
                error_count += 1
                continue

            # Fetch forecasts
            hourly, daily = services.get_or_update_forecasts(city)
            if hourly:
                self.stdout.write(f'    Hourly: {len(hourly)} entries')
            if daily:
                self.stdout.write(f'    Daily: {len(daily)} entries')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done! Success: {success_count}, Errors: {error_count}'
        ))
