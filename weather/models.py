from django.db import models
from django.utils import timezone
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class City(models.Model):
    """Sri Lankan cities for weather tracking"""
    name = models.CharField(max_length=100, unique=True)
    country = models.CharField(max_length=10, default='LK')
    province = models.CharField(max_length=100, blank=True)
    lat = models.FloatField()
    lon = models.FloatField()

    class Meta:
        verbose_name_plural = 'Cities'
        ordering = ['name']

    def __str__(self):
        return f"{self.name}, {self.province}"


class CurrentWeather(models.Model):
    """Current weather snapshot for a city"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='current_weather')
    temperature = models.FloatField(help_text='Temperature in Celsius')
    feels_like = models.FloatField(null=True, blank=True)
    condition = models.CharField(max_length=100)
    description = models.CharField(max_length=200, blank=True)
    icon = models.CharField(max_length=20, blank=True)
    humidity = models.IntegerField()
    wind_speed = models.FloatField(help_text='Wind speed in km/h')
    wind_direction = models.CharField(max_length=10, blank=True)
    wind_deg = models.IntegerField(null=True, blank=True)
    visibility = models.FloatField(help_text='Visibility in km', null=True, blank=True)
    uv_index = models.FloatField(null=True, blank=True)
    pressure = models.IntegerField(null=True, blank=True)
    clouds = models.IntegerField(null=True, blank=True, help_text='Cloudiness %')
    fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fetched_at']
        get_latest_by = 'fetched_at'

    def __str__(self):
        return f"{self.city.name}: {self.temperature}°C, {self.condition}"


class HourlyForecast(models.Model):
    """Hourly forecast data"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='hourly_forecasts')
    datetime = models.DateTimeField()
    temperature = models.FloatField()
    condition = models.CharField(max_length=100)
    description = models.CharField(max_length=200, blank=True)
    icon = models.CharField(max_length=20, blank=True)
    humidity = models.IntegerField(null=True, blank=True)
    wind_speed = models.FloatField(null=True, blank=True)
    pop = models.FloatField(null=True, blank=True, help_text='Probability of precipitation')
    fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['datetime']

    def __str__(self):
        return f"{self.city.name} @ {self.datetime}: {self.temperature}°C"


class DailyForecast(models.Model):
    """Daily forecast data"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='daily_forecasts')
    date = models.DateField()
    temp_high = models.FloatField()
    temp_low = models.FloatField()
    condition = models.CharField(max_length=100)
    description = models.CharField(max_length=200, blank=True)
    icon = models.CharField(max_length=20, blank=True)
    humidity = models.IntegerField(null=True, blank=True)
    wind_speed = models.FloatField(null=True, blank=True)
    pop = models.FloatField(null=True, blank=True)
    fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.city.name} {self.date}: {self.temp_high}°/{self.temp_low}°"


class WeatherAlert(models.Model):
    """Weather alerts and warnings"""
    SEVERITY_CHOICES = [
        ('RED', 'Red Alert'),
        ('ORANGE', 'Orange Warning'),
        ('YELLOW', 'Yellow Advisory'),
    ]
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    title = models.CharField(max_length=200)
    district = models.CharField(max_length=100)
    description = models.TextField()
    instructions = models.JSONField(default=list, blank=True)
    sources = models.CharField(max_length=200, blank=True)
    validity = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.title}"

    @property
    def severity_color(self):
        colors = {'RED': 'red', 'ORANGE': 'orange', 'YELLOW': 'yellow'}
        return colors.get(self.severity, 'gray')


class AlertPreference(models.Model):
    """User's alert notification preferences"""
    region = models.CharField(max_length=100)
    emergency_monsoon = models.BooleanField(default=True)
    sms_alerts = models.BooleanField(default=False)
    email_summary = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Preferences for {self.region}"


class HistoricalRecord(models.Model):
    """Historical weather data for analytics"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='historical_records')
    date = models.DateField()
    avg_temp = models.FloatField()
    max_temp = models.FloatField(null=True, blank=True)
    min_temp = models.FloatField(null=True, blank=True)
    rainfall = models.FloatField(default=0, help_text='Rainfall in mm')
    humidity = models.FloatField(null=True, blank=True)
    is_extreme_event = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date']
        unique_together = ['city', 'date']

    def __str__(self):
        return f"{self.city.name} {self.date}: {self.avg_temp}°C"


class ClimateNormal(models.Model):
    """Climate normal data for weather stations"""
    station_name = models.CharField(max_length=100)
    max_temp = models.FloatField()
    min_temp = models.FloatField()
    annual_rainfall = models.FloatField(help_text='mm')
    rainy_days = models.IntegerField()
    sunshine_hours = models.IntegerField()

    class Meta:
        ordering = ['station_name']

    def __str__(self):
        return self.station_name


class ActivityOutlook(models.Model):
    """Activity suitability based on weather"""
    SUITABILITY_CHOICES = [
        ('GREAT', 'Great'),
        ('FAIR', 'Fair'),
        ('POOR', 'Poor'),
    ]
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    activity_name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    suitability = models.CharField(max_length=10, choices=SUITABILITY_CHOICES)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='sports')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['activity_name']

    def __str__(self):
        return f"{self.activity_name} @ {self.location}: {self.suitability}"


class Profile(models.Model):
    """Per-user profile and preferences (MVP - mock premium flag)."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    is_premium = models.BooleanField(default=False)
    unit = models.CharField(max_length=1, choices=(('C', 'Celsius'), ('F', 'Fahrenheit')), default='C')
    email_notifications = models.BooleanField(default=True)
    default_city = models.ForeignKey(City, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    alert_thresholds = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user}"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
