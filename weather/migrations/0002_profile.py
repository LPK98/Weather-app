from django.db import migrations, models
from django.conf import settings


def create_profiles(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL.split('.')[0], settings.AUTH_USER_MODEL.split('.')[1])
    Profile = apps.get_model('weather', 'Profile')
    for user in User.objects.all():
        Profile.objects.get_or_create(user_id=user.id)


class Migration(migrations.Migration):

    dependencies = [
        ('weather', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_premium', models.BooleanField(default=False)),
                ('unit', models.CharField(default='C', max_length=1, choices=[('C', 'Celsius'), ('F', 'Fahrenheit')])),
                ('email_notifications', models.BooleanField(default=True)),
                ('alert_thresholds', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('default_city', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='+', to='weather.city')),
                ('user', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RunPython(create_profiles, reverse_code=migrations.RunPython.noop),
    ]
