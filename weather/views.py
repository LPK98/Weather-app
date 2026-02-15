"""
Page views for rendering Django templates.
"""
from django.shortcuts import render


def dashboard_view(request):
    """Main dashboard page"""
    return render(request, 'dashboard.html', {
        'page': 'dashboard',
        'page_title': 'Dashboard - LankaWeather',
    })


def alerts_view(request):
    """Weather alerts page"""
    return render(request, 'alerts.html', {
        'page': 'alerts',
        'page_title': 'Weather Alerts - LankaWeather',
    })


def history_view(request):
    """Historical weather analytics page"""
    return render(request, 'history.html', {
        'page': 'history',
        'page_title': 'Historical Data - LankaWeather',
    })


def explorer_view(request):
    """Interactive weather map explorer"""
    return render(request, 'explorer.html', {
        'page': 'explorer',
        'page_title': 'Map Explorer - LankaWeather',
    })
