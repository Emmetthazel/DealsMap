from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'inscription d'un nouvel utilisateur.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'user_type'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'phone': {'required': False},
            'user_type': {'required': True}
        }
    
    def validate(self, attrs):
        """
        Validation personnalisée pour vérifier que les mots de passe correspondent.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
    
    def validate_email(self, value):
        """
        Validation de l'email pour s'assurer qu'il est unique.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un utilisateur avec cet email existe déjà.")
        return value
    
    def validate_username(self, value):
        """
        Validation du nom d'utilisateur pour s'assurer qu'il est unique.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Un utilisateur avec ce nom d'utilisateur existe déjà.")
        return value
    
    def create(self, validated_data):
        """
        Création d'un nouvel utilisateur avec le mot de passe hashé.
        """
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer pour la connexion d'un utilisateur.
    """
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, write_only=True)
    
    def validate(self, attrs):
        """
        Validation des identifiants de connexion.
        """
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password) # Vérifie si l'utilisateur existe et si le mot de passe est correct
            if not user:
                raise serializers.ValidationError("Identifiants invalides.")
            if not user.is_active:
                raise serializers.ValidationError("Ce compte est désactivé.")
            attrs['user'] = user
        else:
            raise serializers.ValidationError("Le nom d'utilisateur et le mot de passe sont requis.")
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer pour afficher et mettre à jour le profil utilisateur.
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'user_type', 'is_verified', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'is_verified']
    
    def update(self, instance, validated_data):
        """
        Mise à jour du profil utilisateur.
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer pour le changement de mot de passe.
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """
        Validation du changement de mot de passe.
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas.")
        return attrs
    
    def validate_old_password(self, value):
        """
        Validation de l'ancien mot de passe.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value 