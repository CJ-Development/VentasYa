from django.contrib.auth.hashers import make_password, check_password

from .models import Usuario, Rol


class UserService:

    @staticmethod
    def crear_usuario(data):

        rol = Rol.objects.get(nombre_rol="Cliente")

        # Si no llega documento, generamos uno único a partir del email
        # para mantener compatibilidad con la constraint unique.
        tipo_doc = data.get("tipo_documento") or "CC"
        num_doc = data.get("numero_documento")
        if not num_doc:
            num_doc = f"AUTO-{data['email']}"

        usuario = Usuario.objects.create(

            rol=rol,

            nombres=data["nombres"],

            apellidos=data["apellidos"],

            tipo_documento=tipo_doc,

            numero_documento=num_doc,

            email=data["email"],

            fecha_nacimiento=data["fecha_nacimiento"],

            telefono=data.get("telefono"),

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

    @staticmethod
    def obtener(id_usuario):
        return Usuario.objects.select_related("rol").get(id_usuario=id_usuario)

    @staticmethod
    def actualizar(id_usuario, data):
        usuario = Usuario.objects.get(id_usuario=id_usuario)

        for campo, valor in data.items():
            setattr(usuario, campo, valor)

        usuario.save()
        return usuario