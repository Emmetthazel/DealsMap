import uuid
from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
# Create your models here.

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    icon = models.CharField(max_length=255, blank=True)
    color = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        """
        Prevent creating circular (looping) parent-child relationships.
        Example: A → B → C → A → ... (invalid)
        """
        if self.parent:
            parent = self.parent
            while parent is not None:
                if parent == self:
                    raise ValidationError("Circular parent-child relationship detected.")
                parent = parent.parent
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        self.full_clean()
        super().save(*args, **kwargs)

    def get_children(self):
        """Return all children categories"""
        return Category.objects.filter(parent=self, is_active=True)
    
    def get_full_path(self):
        """
        Builds the full path of the category from root to this category.
        Example: restaurant > fast-food > burger
        """
        slugs = [self.slug]
        parent = self.parent
        while parent:
            slugs.insert(0, parent.slug)
            parent = parent.parent
        return " > ".join(slugs)
    
    def __str__(self):
        return self.get_full_path()

    
    

    