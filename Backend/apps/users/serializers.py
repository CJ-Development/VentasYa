from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Direccion, Rol, Usuario


class UsuarioSerializer(serializers.ModelSerializer):

    rol_nombre = serializers.CharField(source="rol.nombre_rol", read_only=True)

    es_administrador = serializers.BooleanField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id_usuario",
            "rol",
            "rol_nombre",
            "es_administrador",
            "nombres",
            "apellidos",
            "tipo_documento",
            "numero_documento",
            "email",
            "fecha_nacimiento",
            "telefono",
            "fecha_registro",
            "estado",
        ]
        read_only_fields = ["id_usuario", "rol", "fecha_registro"]


class PerfilUpdateSerializer(serializers.ModelSerializer):
    """Campos que el propio usuario puede editar de su perfil."""

    class Meta:
        model = Usuario
        fields = [
            "nombres",
            "apellidos",
            "tipo_documento",
            "numero_documento",
            "fecha_nacimiento",
            "telefono",
        ]
        extra_kwargs = {
            "tipo_documento": {"required": False, "allow_null": True},
            "numero_documento": {"required": False, "allow_null": True},
            "fecha_nacimiento": {"required": False, "allow_null": True},
        }


class UsuarioAdminUpdateSerializer(serializers.ModelSerializer):
    """Campos que solo un administrador puede modificar."""

    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())

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
            "tipo_documento": {"required": False, "allow_null": True},
            "numero_documento": {"required": False, "allow_null": True},
            "fecha_nacimiento": {"required": False, "allow_null": True},
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
            "password",
        ]
        extra_kwargs = {
            "tipo_documento": {"required": False, "allow_null": True},
            "numero_documento": {"required": False, "allow_null": True},
            "fecha_nacimiento": {"required": False, "allow_null": True},
        }

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
            "nombre_destinatario",
            "direccion",
            "ciudad",
            "departamento",
            "pais",
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
