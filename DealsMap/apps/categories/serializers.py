from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 
            'name',
            'slug',
            'icon',
            'color',
            'description',
            'parent', 
            'children',
            'is_active'
        ]

    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True)
        return CategorySerializer(children, many=True).data if children.exists() else []

    def validate_parent(self, value):
        if not value or not self.instance:
            return value
        parent = value
        while parent is not None:
            if parent == self.instance:
                raise serializers.ValidationError("Circular parent-child relationship detected.")
            parent = parent.parent
        return value


