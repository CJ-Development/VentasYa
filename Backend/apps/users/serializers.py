from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Direccion, Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    es_administrador = serializers.BooleanField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id_usuario",
            "es_administrador",
            "nombres",
            "apellidos",
            "email",
            "fecha_nacimiento",
            "telefono",
        ]
        read_only_fields = ["id_usuario"]


class PerfilUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            "nombres",
            "apellidos",
            "fecha_nacimiento",
            "telefono",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            "nombres",
            "apellidos",
            "email",
            "fecha_nacimiento",
            "telefono",
            "password",
        ]

    def validate_password(self, value):
        validate_password(value)
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class DireccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direccion
        fields = [
            "id_direccion",
            "direccion",
            "ciudad",
            "departamento",
            "codigo_postal",
            "predeterminada",
        ]
        read_only_fields = ["id_direccion"]


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(required=True, write_only=True)
    password_nuevo = serializers.CharField(required=True, write_only=True)

    def validate_password_nuevo(self, value):
        validate_password(value)
        return value
