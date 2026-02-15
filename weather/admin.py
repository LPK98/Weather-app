from django.contrib import admin
from .models import (
    City, CurrentWeather, HourlyForecast, DailyForecast,
    WeatherAlert, AlertPreference, HistoricalRecord,
    ClimateNormal, ActivityOutlook
)


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'country', 'lat', 'lon']
    search_fields = ['name', 'province']


@admin.register(CurrentWeather)
class CurrentWeatherAdmin(admin.ModelAdmin):
    list_display = ['city', 'temperature', 'condition', 'humidity', 'wind_speed', 'fetched_at']
    list_filter = ['city', 'condition']


@admin.register(HourlyForecast)
class HourlyForecastAdmin(admin.ModelAdmin):
    list_display = ['city', 'datetime', 'temperature', 'condition']
    list_filter = ['city']


@admin.register(DailyForecast)
class DailyForecastAdmin(admin.ModelAdmin):
    list_display = ['city', 'date', 'temp_high', 'temp_low', 'condition']
    list_filter = ['city']


@admin.register(WeatherAlert)
class WeatherAlertAdmin(admin.ModelAdmin):
    list_display = ['severity', 'title', 'district', 'is_active', 'created_at']
    list_filter = ['severity', 'is_active']
    search_fields = ['title', 'district']


@admin.register(AlertPreference)
class AlertPreferenceAdmin(admin.ModelAdmin):
    list_display = ['region', 'emergency_monsoon', 'sms_alerts', 'email_summary']


@admin.register(HistoricalRecord)
class HistoricalRecordAdmin(admin.ModelAdmin):
    list_display = ['city', 'date', 'avg_temp', 'rainfall', 'is_extreme_event']
    list_filter = ['city', 'is_extreme_event']


@admin.register(ClimateNormal)
class ClimateNormalAdmin(admin.ModelAdmin):
    list_display = ['station_name', 'max_temp', 'min_temp', 'annual_rainfall', 'rainy_days']


@admin.register(ActivityOutlook)
class ActivityOutlookAdmin(admin.ModelAdmin):
    list_display = ['activity_name', 'location', 'suitability', 'updated_at']
    list_filter = ['suitability']
