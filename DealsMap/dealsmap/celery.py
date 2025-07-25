import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dealsmap.settings.dev')  # ou base

app = Celery('dealsmap')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
