from rest_framework import serializers
from .models import Usuario, Direccion, Rol


class UsuarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Usuario
        exclude = ["password_hash"]


class UsuarioUpdateSerializer(serializers.ModelSerializer):

    rol = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all()
    )

    class Meta:
        model = Usuario
        fields = [
            "rol",
            "nombres",
            "apellidos",
            "tipo_documento",
            "numero_documento",
            "email",
            "fecha_nacimiento",
            "telefono",
            "estado",
        ]
        extra_kwargs = {
            "tipo_documento": {"required": False, "allow_blank": True, "allow_null": True},
            "numero_documento": {"required": False, "allow_blank": True, "allow_null": True},
        }


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
        extra_kwargs = {
            "tipo_documento": {"required": False, "allow_blank": True, "allow_null": True},
            "numero_documento": {"required": False, "allow_blank": True, "allow_null": True},
        }


class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField()


class DireccionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Direccion
        fields = "__all__"


class CambiarPasswordSerializer(serializers.Serializer):

    password_actual = serializers.CharField(required=True, write_only=True)
    password_nuevo = serializers.CharField(
        required=True,
        write_only=True,
        min_length=6,
    )