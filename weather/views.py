"""
Page views for rendering Django templates.
"""
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages


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


def premium_view(request):
    """Simple Premium information page (MVP - mock activation)."""
    return render(request, 'premium.html', {
        'page': 'premium',
        'page_title': 'Premium - LankaWeather',
    })


# ─── Authentication Views ──────────────────────────────────────────

def login_view(request):
    """Login page — GET shows form, POST authenticates user."""
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next', '/')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')

    return render(request, 'login.html', {
        'page_title': 'Sign In - LankaWeather',
    })


def register_view(request):
    """Registration page — creates a new user account."""
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')

        if not username or not password1:
            messages.error(request, 'Username and password are required.')
        elif password1 != password2:
            messages.error(request, 'Passwords do not match.')
        elif len(password1) < 6:
            messages.error(request, 'Password must be at least 6 characters.')
        elif User.objects.filter(username=username).exists():
            messages.error(request, 'Username is already taken.')
        else:
            user = User.objects.create_user(username=username, email=email, password=password1)
            login(request, user)
            messages.success(request, f'Welcome, {username}! Your account has been created.')
            return redirect('dashboard')

    return render(request, 'register.html', {
        'page_title': 'Create Account - LankaWeather',
    })


def logout_view(request):
    """Log out and redirect to login page."""
    logout(request)
    return redirect('login')
