from django.urls import path
from . import views, api_views

urlpatterns = [
    # Page views
    path('', views.dashboard_view, name='dashboard'),
    path('explorer/', views.explorer_view, name='explorer'),
    path('history/', views.history_view, name='history'),
    path('alerts/', views.alerts_view, name='alerts'),

    # API endpoints
    path('api/weather/current/', api_views.CurrentWeatherView.as_view(), name='api-current-weather'),
    path('api/weather/hourly/', api_views.HourlyForecastView.as_view(), name='api-hourly-forecast'),
    path('api/weather/daily/', api_views.DailyForecastView.as_view(), name='api-daily-forecast'),

    path('api/alerts/', api_views.AlertListView.as_view(), name='api-alerts'),
    path('api/alerts/stats/', api_views.AlertStatsView.as_view(), name='api-alert-stats'),
    path('api/alerts/settings/', api_views.AlertPreferenceView.as_view(), name='api-alert-settings'),

    path('api/history/stats/', api_views.HistoryStatsView.as_view(), name='api-history-stats'),
    path('api/history/chart/', api_views.HistoryChartView.as_view(), name='api-history-chart'),
    path('api/history/climate-normals/', api_views.ClimateNormalView.as_view(), name='api-climate-normals'),

    path('api/activities/', api_views.ActivityView.as_view(), name='api-activities'),
    path('api/explorer/cities/', api_views.ExplorerCitiesView.as_view(), name='api-explorer-cities'),
]
