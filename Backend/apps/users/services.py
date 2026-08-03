from django.contrib.auth.hashers import make_password, check_password

from .models import Usuario, Rol


class UserService:

    @staticmethod
    def crear_usuario(data):

        rol = Rol.objects.get(nombre_rol="Cliente")

        usuario = Usuario.objects.create(

            rol=rol,

            nombres=data["nombres"],

            apellidos=data["apellidos"],

            tipo_documento=data["tipo_documento"],

            numero_documento=data["numero_documento"],

            email=data["email"],

            fecha_nacimiento=data["fecha_nacimiento"],

            telefono=data["telefono"],

            password_hash=make_password(data["password"])

        )

        return usuario

    @staticmethod
    def login(email, password):

        try:

            usuario = Usuario.objects.get(email=email)

        except Usuario.DoesNotExist():

            return None

        if check_password(password, usuario.password_hash):

            return usuario

        return None

    @staticmethod
    def obtener_usuarios():
        return Usuario.objects.select_related("rol").all()