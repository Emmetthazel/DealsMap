from django.apps import AppConfig


class DealsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.deals'
    verbose_name = 'Deals & Promotions'
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.deals.signals
        except ImportError:
            pass
