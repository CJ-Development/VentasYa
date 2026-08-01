from django.contrib.auth.hashers import check_password

from apps.users.models import Usuario


class AuthenticationService:

    @staticmethod
    def login(email, password):

        try:

            usuario = Usuario.objects.get(email=email)

        except Usuario.DoesNotExist:

            return None

        if check_password(password, usuario.password_hash):

            return usuario

        return None