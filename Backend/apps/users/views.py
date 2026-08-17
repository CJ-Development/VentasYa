from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404

from .serializers import (
    UsuarioSerializer,
    UsuarioUpdateSerializer,
    RegisterSerializer,
    LoginSerializer,
    CambiarPasswordSerializer,
    DireccionSerializer,
)

from .models import Usuario, Direccion

from .services import UserService


class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        usuario = UserService.crear_usuario(
            serializer.validated_data
        )

        return Response(
            UsuarioSerializer(usuario).data,
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):

    def post(self, request):

        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        usuario = UserService.login(
            serializer.validated_data["email"],
            serializer.validated_data["password"]
        )

        if not usuario:

            return Response(
                {
                    "error": "Credenciales inválidas"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(
            UsuarioSerializer(usuario).data,
            status=status.HTTP_200_OK
        )


class UserListView(APIView):

    def get(self, request):

        usuarios = UserService.obtener_usuarios()

        serializer = UsuarioSerializer(
            usuarios,
            many=True
        )

        return Response(
            serializer.data
        )


class UsuarioDetalleView(APIView):

    def get(self, request, id):

        usuario = get_object_or_404(
            Usuario,
            id_usuario=id
        )

        return Response(
            UsuarioSerializer(usuario).data
        )

    def put(self, request, id):

        usuario = get_object_or_404(
            Usuario,
            id_usuario=id
        )

        serializer = UsuarioUpdateSerializer(
            usuario,
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        usuario.refresh_from_db()

        return Response(
            UsuarioSerializer(usuario).data
        )

    def delete(self, request, id):

        Usuario.objects.filter(
            id_usuario=id
        ).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class CambiarPasswordView(APIView):

    def post(self, request, id):

        usuario = get_object_or_404(
            Usuario,
            id_usuario=id
        )

        serializer = CambiarPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        password_actual = serializer.validated_data[
            "password_actual"
        ]

        password_nuevo = serializer.validated_data[
            "password_nuevo"
        ]

        if not usuario.check_password(
            password_actual
        ):

            return Response(
                {
                    "error": "La contraseña actual es incorrecta."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario.set_password(
            password_nuevo
        )

        usuario.save(
            update_fields=["password"]
        )

        return Response(
            {
                "ok": True
            },
            status=status.HTTP_200_OK
        )


class DireccionView(APIView):

    def get(self, request):

        usuario_id = (
            request.query_params.get("usuario_id")
            or request.query_params.get("usuario")
        )

        if not usuario_id:

            return Response(
                {
                    "detail": (
                        "Se requiere el parámetro "
                        "'usuario_id'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        get_object_or_404(
            Usuario,
            id_usuario=usuario_id
        )

        direcciones = (
            Direccion.objects
            .filter(usuario_id=usuario_id)
            .order_by(
                "-predeterminada",
                "id_direccion"
            )
        )

        serializer = DireccionSerializer(
            direcciones,
            many=True
        )

        return Response(
            serializer.data
        )

    def post(self, request):

        serializer = DireccionSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        usuario = serializer.validated_data[
            "usuario"
        ]

        if serializer.validated_data.get(
            "predeterminada"
        ):

            Direccion.objects.filter(
                usuario=usuario,
                predeterminada=True
            ).update(
                predeterminada=False
            )

        direccion = serializer.save()

        return Response(
            DireccionSerializer(direccion).data,
            status=status.HTTP_201_CREATED
        )


class DireccionDetalleView(APIView):

    def put(self, request, id):

        direccion = get_object_or_404(
            Direccion,
            id_direccion=id
        )

        serializer = DireccionSerializer(
            direccion,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        if serializer.validated_data.get(
            "predeterminada"
        ):

            Direccion.objects.filter(
                usuario=direccion.usuario,
                predeterminada=True
            ).exclude(
                id_direccion=direccion.id_direccion
            ).update(
                predeterminada=False
            )

        serializer.save()

        direccion.refresh_from_db()

        return Response(
            DireccionSerializer(direccion).data
        )

    def delete(self, request, id):

        Direccion.objects.filter(
            id_direccion=id
        ).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )