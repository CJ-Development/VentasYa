from rest_framework import serializers
from .models import Usuario, Direccion


class UsuarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Usuario
        exclude = ["password_hash"]


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            "nombres",
            "apellidos",
            "tipo_documento",
            "numero_documento",
            "email",
            "fecha_nacimiento",
            "telefono",
            "password"
        ]


class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField()


class DireccionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Direccion
        fields = "__all__"