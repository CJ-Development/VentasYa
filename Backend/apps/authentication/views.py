from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import LoginSerializer
from .services import AuthenticationService


class LoginView(APIView):

    def post(self, request):

        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        usuario = AuthenticationService.login(

            serializer.validated_data["email"],

            serializer.validated_data["password"]

        )

        if usuario is None:

            return Response(

                {

                    "success": False,

                    "message": "Correo o contraseña incorrectos"

                },

                status=status.HTTP_401_UNAUTHORIZED

            )

        return Response(

            {

                "success": True,

                "message": "Inicio de sesión correcto",

                "usuario": {

                    "id": usuario.id_usuario,

                    "nombre": usuario.nombres,

                    "apellido": usuario.apellidos,

                    "email": usuario.email

                }

            }

        )