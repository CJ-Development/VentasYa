from django.contrib.auth import authenticate

from .models import ROL_CLIENTE, Rol, Usuario


class UserService:

    @staticmethod
    def crear_usuario(data):
        password = data.pop("password")

        rol = Rol.objects.filter(nombre_rol__iexact=ROL_CLIENTE).first()

        if rol is not None:
            data["rol"] = rol

        return Usuario.objects.create_user(password=password, **data)

    @staticmethod
    def autenticar(request, email, password):
        """
        Devuelve el usuario si las credenciales son válidas y la cuenta
        está activa; en caso contrario None.
        """
        return authenticate(request, username=email, password=password)

    @staticmethod
    def obtener_usuarios():
        return Usuario.objects.select_related("rol").order_by("id_usuario")

    @staticmethod
    def obtener(id_usuario):
        return Usuario.objects.select_related("rol").get(id_usuario=id_usuario)
