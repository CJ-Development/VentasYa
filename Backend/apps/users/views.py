from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password, make_password

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


class UsuarioDetalleView(APIView):

    def get(self, request, id):

        usuario = get_object_or_404(Usuario, id_usuario=id)

        return Response(UsuarioSerializer(usuario).data)

    def put(self, request, id):

        usuario = get_object_or_404(Usuario, id_usuario=id)

        serializer = UsuarioUpdateSerializer(
            usuario,
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        usuario.refresh_from_db()

        return Response(UsuarioSerializer(usuario).data)

    def delete(self, request, id):

        Usuario.objects.filter(id_usuario=id).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class CambiarPasswordView(APIView):
    """
    POST /api/users/<id>/cambiar-password/
    body: { password_actual, password_nuevo }
    """

    def post(self, request, id):

        usuario = get_object_or_404(Usuario, id_usuario=id)

        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        actual = serializer.validated_data["password_actual"]
        nuevo = serializer.validated_data["password_nuevo"]

        if not check_password(actual, usuario.password_hash):
            return Response(
                {"error": "La contraseña actual es incorrecta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario.password_hash = make_password(nuevo)
        usuario.save(update_fields=["password_hash"])

        return Response({"ok": True})


class DireccionView(APIView):
    """
    GET  /api/users/direcciones/?usuario_id=X      -> lista
    POST /api/users/direcciones/                    body: { usuario_id, direccion, ciudad, departamento, codigo_postal, predeterminada }
    """

    def get(self, request):

        usuario_id = (
            request.query_params.get("usuario_id")
            or request.query_params.get("usuario")
        )

        if not usuario_id:
            return Response(
                {"detail": "Se requiere el parámetro 'usuario_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        get_object_or_404(Usuario, id_usuario=usuario_id)

        direcciones = (
            Direccion.objects
            .filter(usuario_id=usuario_id)
            .order_by("-predeterminada", "id_direccion")
        )

        return Response(DireccionSerializer(direcciones, many=True).data)

    def post(self, request):

        serializer = DireccionSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        usuario = serializer.validated_data["usuario"]

        # Si llega como predeterminada, desmarcamos las demás
        if serializer.validated_data.get("predeterminada"):
            Direccion.objects.filter(
                usuario=usuario, predeterminada=True
            ).update(predeterminada=False)

        direccion = serializer.save()

        return Response(
            DireccionSerializer(direccion).data,
            status=status.HTTP_201_CREATED,
        )


class DireccionDetalleView(APIView):
    """
    PUT    /api/users/direcciones/<id>/   actualizar
    DELETE /api/users/direcciones/<id>/   eliminar
    """

    def put(self, request, id):

        direccion = get_object_or_404(Direccion, id_direccion=id)

        serializer = DireccionSerializer(direccion, data=request.data, partial=True)

        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get("predeterminada"):
            Direccion.objects.filter(
                usuario=direccion.usuario, predeterminada=True
            ).exclude(id_direccion=direccion.id_direccion).update(predeterminada=False)

        serializer.save()

        return Response(DireccionSerializer(direccion).data)

    def delete(self, request, id):

        Direccion.objects.filter(id_direccion=id).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)