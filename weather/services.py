"""
OpenWeatherMap API Service
Centralizes all weather API calls and caches results in the database.
"""
import requests
import logging
from datetime import timedelta
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5'
OWM_ONECALL_URL = 'https://api.openweathermap.org/data/3.0/onecall'


def get_api_key():
    return settings.OPENWEATHERMAP_API_KEY


def _deg_to_compass(deg):
    """Convert wind degree to compass direction"""
    directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    idx = round(deg / 22.5) % 16
    return directions[idx]


def _owm_icon_to_material(icon_code, condition):
    """Map OpenWeatherMap icon codes to Material Symbols icon names"""
    mapping = {
        '01d': 'wb_sunny', '01n': 'nights_stay',
        '02d': 'partly_cloudy_day', '02n': 'nights_stay',
        '03d': 'cloud', '03n': 'cloud',
        '04d': 'cloudy_filled', '04n': 'cloudy_filled',
        '09d': 'rainy', '09n': 'rainy',
        '10d': 'rainy', '10n': 'rainy',
        '11d': 'thunderstorm', '11n': 'thunderstorm',
        '13d': 'cloudy_snowing', '13n': 'cloudy_snowing',
        '50d': 'foggy', '50n': 'foggy',
    }
    return mapping.get(icon_code, 'cloud')


def fetch_current_weather(city_name):
    """
    Fetch current weather from OpenWeatherMap API.
    Returns parsed data dict or None on error.
    """
    api_key = get_api_key()
    if not api_key:
        logger.error("No OpenWeatherMap API key configured")
        return None

    try:
        url = f"{OWM_BASE_URL}/weather"
        params = {
            'q': f"{city_name},LK",
            'appid': api_key,
            'units': 'metric'
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        wind_deg = data.get('wind', {}).get('deg', 0)
        icon_code = data['weather'][0].get('icon', '01d')
        condition = data['weather'][0].get('main', 'Clear')

        return {
            'temperature': round(data['main']['temp'], 1),
            'feels_like': round(data['main'].get('feels_like', data['main']['temp']), 1),
            'condition': condition,
            'description': data['weather'][0].get('description', '').title(),
            'icon': _owm_icon_to_material(icon_code, condition),
            'humidity': data['main']['humidity'],
            'wind_speed': round(data['wind'].get('speed', 0) * 3.6, 1),  # m/s to km/h
            'wind_direction': _deg_to_compass(wind_deg),
            'wind_deg': wind_deg,
            'visibility': round(data.get('visibility', 10000) / 1000, 1),  # m to km
            'pressure': data['main'].get('pressure'),
            'clouds': data.get('clouds', {}).get('all', 0),
            'lat': data['coord']['lat'],
            'lon': data['coord']['lon'],
        }
    except requests.RequestException as e:
        logger.error(f"Error fetching weather for {city_name}: {e}")
        return None
    except (KeyError, IndexError) as e:
        logger.error(f"Error parsing weather data for {city_name}: {e}")
        return None


def fetch_forecast(lat, lon):
    """
    Fetch 5-day/3-hour forecast from OpenWeatherMap.
    Returns parsed hourly and daily data.
    """
    api_key = get_api_key()
    if not api_key:
        return None, None

    try:
        url = f"{OWM_BASE_URL}/forecast"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric'
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        hourly_data = []
        daily_data = {}

        for item in data.get('list', []):
            from datetime import datetime
            dt = datetime.fromtimestamp(item['dt'], tz=timezone.get_current_timezone())
            icon_code = item['weather'][0].get('icon', '01d')
            condition = item['weather'][0].get('main', 'Clear')

            hourly_data.append({
                'datetime': dt,
                'temperature': round(item['main']['temp'], 1),
                'condition': condition,
                'description': item['weather'][0].get('description', '').title(),
                'icon': _owm_icon_to_material(icon_code, condition),
                'humidity': item['main'].get('humidity'),
                'wind_speed': round(item['wind'].get('speed', 0) * 3.6, 1),
                'pop': item.get('pop', 0),
            })

            # Aggregate daily data
            date_str = dt.strftime('%Y-%m-%d')
            if date_str not in daily_data:
                daily_data[date_str] = {
                    'date': dt.date(),
                    'temps': [],
                    'condition': condition,
                    'description': item['weather'][0].get('description', '').title(),
                    'icon': _owm_icon_to_material(icon_code, condition),
                    'humidity': item['main'].get('humidity'),
                    'wind_speed': round(item['wind'].get('speed', 0) * 3.6, 1),
                    'pop': item.get('pop', 0),
                }
            daily_data[date_str]['temps'].append(item['main']['temp'])

        # Process daily aggregates
        daily_list = []
        for date_str, d in daily_data.items():
            daily_list.append({
                'date': d['date'],
                'temp_high': round(max(d['temps']), 1),
                'temp_low': round(min(d['temps']), 1),
                'condition': d['condition'],
                'description': d['description'],
                'icon': d['icon'],
                'humidity': d['humidity'],
                'wind_speed': d['wind_speed'],
                'pop': d['pop'],
            })

        return hourly_data[:24], daily_list[:7]

    except requests.RequestException as e:
        logger.error(f"Error fetching forecast for ({lat}, {lon}): {e}")
        return None, None
    except (KeyError, IndexError) as e:
        logger.error(f"Error parsing forecast data: {e}")
        return None, None


def get_or_update_current_weather(city):
    """
    Get current weather from DB cache, or fetch from API if stale (>15 min).
    """
    from .models import CurrentWeather

    cache_ttl = timedelta(minutes=15)
    latest = city.current_weather.first()

    if latest and (timezone.now() - latest.fetched_at) < cache_ttl:
        return latest

    weather_data = fetch_current_weather(city.name)
    if not weather_data:
        return latest  # Return stale data if API fails

    # Update city coordinates if needed
    if not city.lat or not city.lon:
        city.lat = weather_data.pop('lat', city.lat)
        city.lon = weather_data.pop('lon', city.lon)
        city.save()
    else:
        weather_data.pop('lat', None)
        weather_data.pop('lon', None)

    current = CurrentWeather.objects.create(city=city, **weather_data)

    # Clean up old records (keep last 10)
    old_records = city.current_weather.all()[10:]
    if old_records.exists():
        CurrentWeather.objects.filter(id__in=old_records.values_list('id', flat=True)).delete()

    return current


def get_or_update_forecasts(city):
    """
    Get forecasts from DB cache, or fetch from API if stale (>30 min).
    """
    from .models import HourlyForecast, DailyForecast

    cache_ttl = timedelta(minutes=30)
    latest_hourly = city.hourly_forecasts.first()

    if latest_hourly and (timezone.now() - latest_hourly.fetched_at) < cache_ttl:
        hourly = list(city.hourly_forecasts.filter(datetime__gte=timezone.now())[:24])
        daily = list(city.daily_forecasts.all()[:7])
        return hourly, daily

    hourly_data, daily_data = fetch_forecast(city.lat, city.lon)
    if not hourly_data:
        hourly = list(city.hourly_forecasts.filter(datetime__gte=timezone.now())[:24])
        daily = list(city.daily_forecasts.all()[:7])
        return hourly, daily

    # Clear old and save new
    city.hourly_forecasts.all().delete()
    city.daily_forecasts.all().delete()

    hourly_objects = []
    for h in hourly_data:
        hourly_objects.append(HourlyForecast(city=city, **h))
    HourlyForecast.objects.bulk_create(hourly_objects)

    daily_objects = []
    for d in daily_data:
        daily_objects.append(DailyForecast(city=city, **d))
    DailyForecast.objects.bulk_create(daily_objects)

    return hourly_objects, daily_objects


def get_uv_index_label(uv):
    """Get UV index label"""
    if uv is None:
        return 'N/A'
    if uv <= 2:
        return f"{uv:.0f} Low"
    elif uv <= 5:
        return f"{uv:.0f} Moderate"
    elif uv <= 7:
        return f"{uv:.0f} High"
    elif uv <= 10:
        return f"{uv:.0f} Very High"
    else:
        return f"{uv:.0f} Extreme"
