from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    Modèle personnalisé d'utilisateur étendu depuis AbstractUser.
    Permet de gérer les clients et les propriétaires avec des champs supplémentaires.
    """

    # Choix de type d'utilisateur
    USER_TYPE_CHOICES = [
        ('client', 'Client'),
        ('owner', 'Propriétaire'),
    ]

    user_type = models.CharField(
        choices=USER_TYPE_CHOICES,
        max_length=10,
        default='client'
    )
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']  # Les plus récents en premier

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
