from django.apps import AppConfig


class DealsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.deals'
    verbose_name = 'Deals Management'
    
    def ready(self):
        """Import signals when app is ready"""
        import apps.deals.signals
