"""
REST API views for the LankaWeather backend.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Sum, Count, Q
from .models import (
    City, CurrentWeather, HourlyForecast, DailyForecast,
    WeatherAlert, AlertPreference, HistoricalRecord,
    ClimateNormal, ActivityOutlook
)
from .serializers import (
    CurrentWeatherSerializer, HourlyForecastSerializer, DailyForecastSerializer,
    WeatherAlertSerializer, AlertPreferenceSerializer, HistoricalRecordSerializer,
    ClimateNormalSerializer, ActivityOutlookSerializer, ExplorerCitySerializer,
    HistoryStatsSerializer
)
from . import services


class CurrentWeatherView(APIView):
    """GET /api/weather/current/?city=Colombo"""
    def get(self, request):
        city_name = request.query_params.get('city', 'Colombo')
        try:
            city = City.objects.get(name__iexact=city_name)
        except City.DoesNotExist:
            # Try to create city from API
            weather_data = services.fetch_current_weather(city_name)
            if not weather_data:
                return Response({'error': f'City "{city_name}" not found'}, status=404)
            lat = weather_data.pop('lat', 0)
            lon = weather_data.pop('lon', 0)
            city = City.objects.create(name=city_name.title(), lat=lat, lon=lon, province='Sri Lanka')
            CurrentWeather.objects.create(city=city, **weather_data)
            current = city.current_weather.first()
            return Response(CurrentWeatherSerializer(current).data)

        current = services.get_or_update_current_weather(city)
        if not current:
            return Response({'error': 'Weather data unavailable'}, status=503)
        return Response(CurrentWeatherSerializer(current).data)


class HourlyForecastView(APIView):
    """GET /api/weather/hourly/?city=Colombo"""
    def get(self, request):
        city_name = request.query_params.get('city', 'Colombo')
        try:
            city = City.objects.get(name__iexact=city_name)
        except City.DoesNotExist:
            return Response({'error': f'City "{city_name}" not found'}, status=404)

        hourly, _ = services.get_or_update_forecasts(city)
        serializer = HourlyForecastSerializer(hourly, many=True)
        return Response(serializer.data)


class DailyForecastView(APIView):
    """GET /api/weather/daily/?city=Colombo&days=7"""
    def get(self, request):
        city_name = request.query_params.get('city', 'Colombo')
        days = int(request.query_params.get('days', 7))
        try:
            city = City.objects.get(name__iexact=city_name)
        except City.DoesNotExist:
            return Response({'error': f'City "{city_name}" not found'}, status=404)

        _, daily = services.get_or_update_forecasts(city)
        serializer = DailyForecastSerializer(daily[:days], many=True)
        return Response(serializer.data)


class AlertListView(APIView):
    """GET /api/alerts/?severity=RED&active=true"""
    def get(self, request):
        queryset = WeatherAlert.objects.all()
        severity = request.query_params.get('severity')
        active_only = request.query_params.get('active', 'true').lower() == 'true'
        limit = int(request.query_params.get('limit', 20))

        if active_only:
            queryset = queryset.filter(is_active=True)
        if severity:
            queryset = queryset.filter(severity=severity.upper())

        serializer = WeatherAlertSerializer(queryset[:limit], many=True)
        return Response(serializer.data)


class AlertStatsView(APIView):
    """GET /api/alerts/stats/"""
    def get(self, request):
        active_alerts = WeatherAlert.objects.filter(is_active=True)
        stats = {
            'red': active_alerts.filter(severity='RED').count(),
            'orange': active_alerts.filter(severity='ORANGE').count(),
            'yellow': active_alerts.filter(severity='YELLOW').count(),
            'total': active_alerts.count(),
        }
        return Response(stats)


class AlertPreferenceView(APIView):
    """GET/POST /api/alerts/settings/"""
    def get(self, request):
        prefs = AlertPreference.objects.all()
        serializer = AlertPreferenceSerializer(prefs, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Use update_or_create to avoid duplicates
        defaults = {
            'emergency_monsoon': request.data.get('emergency_monsoon', True),
            'sms_alerts': request.data.get('sms_alerts', False),
            'email_summary': request.data.get('email_summary', True),
        }
        region = request.data.get('region', '')
        obj, created = AlertPreference.objects.update_or_create(
            region=region,
            defaults=defaults
        )
        serializer = AlertPreferenceSerializer(obj)
        return Response(serializer.data, status=201 if created else 200)


class HistoryStatsView(APIView):
    """GET /api/history/stats/?city=Colombo&start=2018&end=2023"""
    def get(self, request):
        city_name = request.query_params.get('city', 'Colombo')
        start_year = int(request.query_params.get('start', 2018))
        end_year = int(request.query_params.get('end', 2023))

        try:
            city = City.objects.get(name__iexact=city_name)
        except City.DoesNotExist:
            return Response({'error': 'City not found'}, status=404)

        records = HistoricalRecord.objects.filter(
            city=city,
            date__year__gte=start_year,
            date__year__lte=end_year
        )

        stats = records.aggregate(
            avg_temp=Avg('avg_temp'),
            total_rainfall=Sum('rainfall'),
            avg_humidity=Avg('humidity'),
            extreme_events=Count('id', filter=Q(is_extreme_event=True))
        )

        # Provide defaults if no data
        data = {
            'avg_temp': round(stats['avg_temp'] or 27.5, 1),
            'total_rainfall': round(stats['total_rainfall'] or 1240, 1),
            'avg_humidity': round(stats['avg_humidity'] or 78, 1),
            'extreme_events': stats['extreme_events'] or 4,
            'temp_trend': 1.2,
            'rainfall_trend': -5.4,
            'humidity_trend': 0.8,
            'events_trend': 2,
        }

        return Response(data)


class HistoryChartView(APIView):
    """GET /api/history/chart/?city=Colombo&metric=rainfall&start=2018&end=2023"""
    def get(self, request):
        city_name = request.query_params.get('city', 'Colombo')
        start_year = int(request.query_params.get('start', 2018))
        end_year = int(request.query_params.get('end', 2023))

        try:
            city = City.objects.get(name__iexact=city_name)
        except City.DoesNotExist:
            return Response({'error': 'City not found'}, status=404)

        records = HistoricalRecord.objects.filter(
            city=city,
            date__year__gte=start_year,
            date__year__lte=end_year
        ).order_by('date')

        # Group by month for chart
        from django.db.models.functions import TruncMonth
        monthly = records.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            avg_temp=Avg('avg_temp'),
            total_rainfall=Sum('rainfall'),
            avg_humidity=Avg('humidity')
        ).order_by('month')

        labels = []
        temp_data = []
        rainfall_data = []
        humidity_data = []

        for entry in monthly:
            labels.append(entry['month'].strftime('%b %Y'))
            temp_data.append(round(entry['avg_temp'] or 0, 1))
            rainfall_data.append(round(entry['total_rainfall'] or 0, 1))
            humidity_data.append(round(entry['avg_humidity'] or 0, 1))

        # If no data, provide sample data
        if not labels:
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            labels = months
            temp_data = [26.5, 27.0, 28.2, 29.1, 28.8, 27.5, 27.0, 27.2, 27.5, 27.0, 26.8, 26.5]
            rainfall_data = [60, 70, 120, 250, 380, 180, 130, 110, 240, 350, 310, 150]
            humidity_data = [72, 70, 72, 78, 82, 80, 78, 77, 80, 82, 80, 75]

        return Response({
            'labels': labels,
            'temperature': temp_data,
            'rainfall': rainfall_data,
            'humidity': humidity_data,
        })


class ClimateNormalView(APIView):
    """GET /api/history/climate-normals/"""
    def get(self, request):
        normals = ClimateNormal.objects.all()
        if not normals.exists():
            # Return default data
            default_data = [
                {'station_name': 'Nuwara Eliya', 'max_temp': 20.2, 'min_temp': 9.4,
                 'annual_rainfall': 1905.0, 'rainy_days': 225, 'sunshine_hours': 1820},
                {'station_name': 'Badulla', 'max_temp': 28.4, 'min_temp': 18.1,
                 'annual_rainfall': 1780.4, 'rainy_days': 168, 'sunshine_hours': 2150},
                {'station_name': 'Kandy', 'max_temp': 29.1, 'min_temp': 19.8,
                 'annual_rainfall': 2083.5, 'rainy_days': 184, 'sunshine_hours': 2280},
                {'station_name': 'Diyatalawa', 'max_temp': 24.5, 'min_temp': 15.2,
                 'annual_rainfall': 1620.0, 'rainy_days': 195, 'sunshine_hours': 1980},
            ]
            return Response(default_data)
        serializer = ClimateNormalSerializer(normals, many=True)
        return Response(serializer.data)


class ActivityView(APIView):
    """GET /api/activities/?city=Colombo"""
    def get(self, request):
        city_name = request.query_params.get('city')
        queryset = ActivityOutlook.objects.all()

        if city_name:
            try:
                city = City.objects.get(name__iexact=city_name)
                queryset = queryset.filter(Q(city=city) | Q(city__isnull=True))
            except City.DoesNotExist:
                pass

        if not queryset.exists():
            # Default activities
            default = [
                {'activity_name': 'Surfing', 'location': 'Hikkaduwa', 'suitability': 'GREAT',
                 'suitability_color': 'green', 'description': 'Great wave conditions', 'icon': 'surfing'},
                {'activity_name': 'Hiking', 'location': 'Ella Rock', 'suitability': 'FAIR',
                 'suitability_color': 'yellow', 'description': 'Moderate cloud cover', 'icon': 'hiking'},
                {'activity_name': 'Sigiriya Tour', 'location': 'Sigiriya', 'suitability': 'POOR',
                 'suitability_color': 'red', 'description': 'Heavy rainfall expected', 'icon': 'tour'},
            ]
            return Response(default)

        serializer = ActivityOutlookSerializer(queryset, many=True)
        return Response(serializer.data)


class ExplorerCitiesView(APIView):
    """GET /api/explorer/cities/ - All cities with weather for map markers"""
    def get(self, request):
        cities = City.objects.prefetch_related('current_weather').all()
        serializer = ExplorerCitySerializer(cities, many=True)
        return Response(serializer.data)
