from rest_framework import serializers
from .models import (
    City, CurrentWeather, HourlyForecast, DailyForecast,
    WeatherAlert, AlertPreference, HistoricalRecord,
    ClimateNormal, ActivityOutlook, Profile
)


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = '__all__'


class CurrentWeatherSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    province = serializers.CharField(source='city.province', read_only=True)

    class Meta:
        model = CurrentWeather
        fields = [
            'id', 'city', 'city_name', 'province', 'temperature', 'feels_like',
            'condition', 'description', 'icon', 'humidity', 'wind_speed',
            'wind_direction', 'wind_deg', 'visibility', 'uv_index',
            'pressure', 'clouds', 'fetched_at'
        ]


class HourlyForecastSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()

    class Meta:
        model = HourlyForecast
        fields = [
            'id', 'city', 'datetime', 'time', 'temperature', 'condition',
            'description', 'icon', 'humidity', 'wind_speed', 'pop', 'fetched_at'
        ]

    def get_time(self, obj):
        return obj.datetime.strftime('%I %p').lstrip('0')


class DailyForecastSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = DailyForecast
        fields = [
            'id', 'city', 'date', 'day_name', 'temp_high', 'temp_low',
            'condition', 'description', 'icon', 'humidity', 'wind_speed',
            'pop', 'fetched_at'
        ]

    def get_day_name(self, obj):
        from datetime import date
        if obj.date == date.today():
            return 'Today'
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return f"{days[obj.date.weekday()]}, {obj.date.day}"


class WeatherAlertSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    severity_color = serializers.ReadOnlyField()

    class Meta:
        model = WeatherAlert
        fields = [
            'id', 'severity', 'severity_color', 'title', 'district',
            'description', 'instructions', 'sources', 'validity',
            'created_at', 'updated_at', 'is_active', 'time_ago'
        ]

    def get_time_ago(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        hours = int(diff.total_seconds() / 3600)
        if hours < 1:
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} Minutes Ago"
        elif hours < 24:
            return f"{hours} Hours Ago"
        else:
            days = hours // 24
            return f"{days} Days Ago"


class AlertPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertPreference
        fields = '__all__'


class HistoricalRecordSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = HistoricalRecord
        fields = [
            'id', 'city', 'city_name', 'date', 'avg_temp', 'max_temp',
            'min_temp', 'rainfall', 'humidity', 'is_extreme_event'
        ]


class ClimateNormalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClimateNormal
        fields = '__all__'


class ActivityOutlookSerializer(serializers.ModelSerializer):
    suitability_color = serializers.SerializerMethodField()

    class Meta:
        model = ActivityOutlook
        fields = [
            'id', 'city', 'activity_name', 'location', 'suitability',
            'suitability_color', 'description', 'icon', 'updated_at'
        ]

    def get_suitability_color(self, obj):
        colors = {'GREAT': 'green', 'FAIR': 'yellow', 'POOR': 'red'}
        return colors.get(obj.suitability, 'gray')


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    default_city_name = serializers.CharField(source='default_city.name', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username', 'is_premium', 'unit', 'email_notifications',
            'default_city', 'default_city_name', 'alert_thresholds',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['username', 'created_at', 'updated_at']


class ExplorerCitySerializer(serializers.ModelSerializer):
    """City with current weather for map markers"""
    temperature = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()

    class Meta:
        model = City
        fields = ['id', 'name', 'lat', 'lon', 'province', 'temperature', 'condition']

    def get_temperature(self, obj):
        latest = obj.current_weather.first()
        return latest.temperature if latest else None

    def get_condition(self, obj):
        latest = obj.current_weather.first()
        return latest.condition if latest else None


class HistoryStatsSerializer(serializers.Serializer):
    """Aggregated historical stats"""
    avg_temp = serializers.FloatField()
    total_rainfall = serializers.FloatField()
    avg_humidity = serializers.FloatField()
    extreme_events = serializers.IntegerField()
    temp_trend = serializers.FloatField()
    rainfall_trend = serializers.FloatField()
    humidity_trend = serializers.FloatField()
    events_trend = serializers.IntegerField()
