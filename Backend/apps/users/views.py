from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    UsuarioSerializer,
    RegisterSerializer,
    LoginSerializer
)

from .services import UserService


class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        usuario = UserService.crear_usuario(serializer.validated_data)

        return Response(

            UsuarioSerializer(usuario).data,

            status=status.HTTP_201_CREATED

        )


class LoginView(APIView):

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        usuario = UserService.login(

            serializer.validated_data["email"],

            serializer.validated_data["password"]

        )

        if not usuario:

            return Response(

                {"error": "Credenciales inválidas"},

                status=401

            )

        return Response(

            UsuarioSerializer(usuario).data

        )

class UserListView(APIView):

    def get(self, request):

        usuarios = UserService.obtener_usuarios()

        serializer = UsuarioSerializer(
            usuarios,
            many=True
        )

        return Response(serializer.data)