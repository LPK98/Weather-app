# LankaWeather - Sri Lankan Weather Monitoring System

[![Django](https://img.shields.io/badge/Django-6.0.2-green.svg)](https://djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.14.1-blue.svg)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive weather monitoring and analysis platform specifically designed for Sri Lanka, providing real-time weather data, forecasts, historical analysis, and weather alerts for all major cities across the island.

## 🌟 Features

### 📊 Dashboard

- **Real-time Weather Overview**: Current conditions for major Sri Lankan cities
- **Interactive Maps**: Visual representation of weather patterns using Leaflet.js
- **Weather Statistics**: Key metrics and trends at a glance
- **Quick Access**: Fast navigation to detailed city information

### 🗺️ Weather Explorer

- **City-by-City Analysis**: Detailed weather information for 17+ Sri Lankan cities
- **Interactive Charts**: Temperature, humidity, and wind patterns using Chart.js
- **Comparative Analysis**: Side-by-side comparison of multiple cities
- **Geographic Visualization**: Map-based exploration of weather data

### 🚨 Weather Alerts

- **Customizable Alerts**: Set personal weather alert preferences
- **Alert History**: Track past weather warnings and notifications
- **Severity Classification**: Color-coded alerts by severity level
- **Real-time Notifications**: Instant alerts for critical weather conditions

### 📈 Historical Analysis

- **Climate Trends**: Long-term weather pattern analysis
- **Data Visualization**: Historical charts and climate normals
- **Statistical Insights**: Temperature averages, precipitation patterns
- **Comparative Studies**: Year-over-year weather comparisons

## 🏗️ Architecture

### Backend Architecture

```
lanka_weather/
├── lanka_weather/          # Django project settings
│   ├── settings.py        # Configuration with environment variables
│   ├── urls.py           # Main URL routing
│   └── wsgi.py           # WSGI configuration
├── weather/               # Main Django app
│   ├── models.py         # Database models (9 models)
│   ├── views.py          # Page views (4 pages)
│   ├── api_views.py      # REST API endpoints (11 endpoints)
│   ├── serializers.py    # DRF serializers
│   ├── services.py       # Business logic and API integration
│   ├── urls.py           # App URL routing
│   └── management/       # Custom management commands
├── static/                # Static files (CSS, JS, images)
├── templates/             # HTML templates
└── db.sqlite3            # SQLite database (default)
```

### Technology Stack

#### Backend

- **Django 6.0.2**: Web framework
- **Django REST Framework 3.16.1**: API development
- **PostgreSQL/SQLite**: Database (configurable)
- **OpenWeatherMap API**: Weather data source

#### Frontend

- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Interactive charts and graphs
- **Leaflet.js**: Interactive maps
- **Material Symbols**: Icon library
- **Vanilla JavaScript**: Frontend interactions

#### Development Tools

- **Python 3.14.1**: Runtime environment
- **python-decouple**: Environment variable management
- **Git**: Version control
- **pip**: Package management

## 🚀 Quick Start

### Prerequisites

- Python 3.14.1 or higher
- Git
- PostgreSQL (optional, SQLite used by default)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/LPK98/Weather-app.git
   cd Weather-app
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**

   ```bash
   cp .env.example .env  # If available, otherwise create .env
   ```

   Configure your `.env` file:

   ```env
   # Django Core
   SECRET_KEY=your-secret-key-here
   DEBUG=True

   # API Keys
   OPENWEATHERMAP_API_KEY=your-openweathermap-api-key

   # Database Configuration (SQLite by default)
   DB_ENGINE=django.db.backends.sqlite3
   DB_NAME=lankaweather
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432

   # Security & Environment-Specific
   ALLOWED_HOSTS=localhost,127.0.0.1
   TIME_ZONE=Asia/Colombo
   LANGUAGE_CODE=en-us
   CORS_ALLOW_ALL_ORIGINS=True
   ```

5. **Database setup**

   ```bash
   python manage.py migrate
   ```

6. **Seed initial data**

   ```bash
   python manage.py seed_cities
   python manage.py fetch_weather
   ```

7. **Run development server**

   ```bash
   python manage.py runserver
   ```

8. **Access the application**
   - Open your browser and navigate to `http://localhost:8000`
   - Dashboard: `http://localhost:8000/`
   - Weather Explorer: `http://localhost:8000/explorer/`
   - Weather Alerts: `http://localhost:8000/alerts/`
   - History: `http://localhost:8000/history/`

## 📖 Usage

### API Endpoints

The application provides 11 REST API endpoints:

#### Weather Data

- `GET /api/weather/current/` - Current weather for all cities
- `GET /api/weather/hourly/` - Hourly forecast data
- `GET /api/weather/daily/` - Daily forecast data

#### Alerts

- `GET /api/alerts/` - Weather alerts list
- `GET /api/alerts/stats/` - Alert statistics
- `POST /api/alerts/settings/` - Update alert preferences

#### History & Analytics

- `GET /api/history/stats/` - Historical weather statistics
- `GET /api/history/chart/` - Chart data for visualizations
- `GET /api/history/climate-normals/` - Climate normal data

#### Explorer

- `GET /api/explorer/cities/` - Cities data for exploration
- `GET /api/activities/` - Recent user activities

### Management Commands

- `python manage.py seed_cities` - Populate Sri Lankan cities
- `python manage.py fetch_weather` - Update weather data from API
- `python manage.py clear_old_data` - Clean up old weather records

## 🔧 Configuration

### Environment Variables

| Variable                 | Description                   | Default                      |
| ------------------------ | ----------------------------- | ---------------------------- |
| `SECRET_KEY`             | Django secret key             | Required                     |
| `DEBUG`                  | Enable/disable debug mode     | `True`                       |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap API key        | Required                     |
| `DB_ENGINE`              | Database engine               | `django.db.backends.sqlite3` |
| `ALLOWED_HOSTS`          | Comma-separated allowed hosts | `localhost,127.0.0.1`        |
| `TIME_ZONE`              | Application timezone          | `Asia/Colombo`               |

### Database Configuration

The application supports both SQLite (default) and PostgreSQL:

**SQLite (Default):**

```env
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=lankaweather
```

**PostgreSQL:**

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=lankaweather
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

## 🧪 Testing

Run the test suite:

```bash
python manage.py test
```

Run with coverage:

```bash
pip install coverage
coverage run manage.py test
coverage report
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Generate a secure `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` for production domain
- [ ] Set up PostgreSQL database
- [ ] Configure static files serving
- [ ] Set up proper logging
- [ ] Enable HTTPS

### Docker Deployment (Future)

```dockerfile
# Dockerfile will be added in future updates
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Set up development environment (see Quick Start)
4. Make your changes
5. Run tests: `python manage.py test`
6. Commit your changes: `git commit -m "Add your message"`
7. Push to your branch: `git push origin feature/your-feature-name`
8. Create a Pull Request

### Code Style

- Follow PEP 8 Python style guidelines
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions small and focused
- Write tests for new features

### Commit Guidelines

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Reference issue numbers when applicable: `Fix #123: Resolve weather API timeout`

## 📋 Git Workflow

### Cloning the Repository

```bash
git clone https://github.com/LPK98/Weather-app.git
cd Weather-app
```

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Daily Workflow

```bash
# 1. Update your local main branch
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# Edit files, test your changes

# 4. Stage your changes
git add .

# 5. Commit with descriptive message
git commit -m "Add: Brief description of changes"

# 6. Push your branch
git push origin feature/your-feature-name

# 7. Create Pull Request on GitHub
# - Go to GitHub repository
# - Click "New Pull Request"
# - Select your branch
# - Add description and reviewers
```

### Syncing with Main

```bash
# While working on your feature branch
git checkout main
git pull origin main
git checkout your-feature-branch
git rebase main  # Or git merge main
```

### Handling Merge Conflicts

```bash
# If conflicts occur during rebase/merge
# 1. Edit conflicting files
# 2. Stage resolved files
git add resolved-file.py
# 3. Continue rebase
git rebase --continue
# Or for merge
git commit
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenWeatherMap**: For providing comprehensive weather data API
- **Sri Lankan Government**: For geographical and administrative data
- **Open Source Community**: For the amazing tools and libraries used

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/LPK98/Weather-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/LPK98/Weather-app/discussions)
- **Email**: For security issues, email the maintainers directly

---

**Built with ❤️ for Sri Lanka's weather monitoring needs**
