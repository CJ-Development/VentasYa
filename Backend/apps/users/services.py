from django.contrib.auth import authenticate

from .models import Usuario


class UserService:

    @staticmethod
    def crear_usuario(data):
        password = data.pop("password")
        return Usuario.objects.create_user(password=password, **data)

    @staticmethod
    def autenticar(request, email, password):
        return authenticate(request, username=email, password=password)

    @staticmethod
    def obtener_usuarios():
        return Usuario.objects.order_by("id_usuario")

    @staticmethod
    def obtener(id_usuario):
        return Usuario.objects.get(id_usuario=id_usuario)
