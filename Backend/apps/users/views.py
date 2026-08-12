from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from utils.permissions import IsAdministrador

from .models import Direccion, Usuario
from .serializers import (
    CambiarPasswordSerializer,
    DireccionSerializer,
    LoginSerializer,
    PerfilUpdateSerializer,
    RegisterSerializer,
    UsuarioAdminUpdateSerializer,
    UsuarioSerializer,
)
from .services import UserService


def _tokens_para(usuario):
    refresh = RefreshToken.for_user(usuario)

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class RegisterView(APIView):

    permission_classes = [AllowAny]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = UserService.crear_usuario(dict(serializer.validated_data))

        return Response(
            {
                "usuario": UsuarioSerializer(usuario).data,
                **_tokens_para(usuario),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):

    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = UserService.autenticar(
            request,
            serializer.validated_data["email"],
            serializer.validated_data["password"],
        )

        if usuario is None:
            return Response(
                {"detail": "Credenciales inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                "usuario": UsuarioSerializer(usuario).data,
                **_tokens_para(usuario),
            }
        )


class MeView(APIView):
    """Perfil del usuario autenticado."""

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)

    def put(self, request):
        serializer = PerfilUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(UsuarioSerializer(request.user).data)


class CambiarPasswordView(APIView):
    """POST /api/users/me/cambiar-password/"""

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = request.user

        if not usuario.check_password(serializer.validated_data["password_actual"]):
            return Response(
                {"detail": "La contraseña actual es incorrecta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario.set_password(serializer.validated_data["password_nuevo"])
        usuario.save(update_fields=["password"])

        return Response({"ok": True, **_tokens_para(usuario)})


class UserListView(APIView):

    permission_classes = [IsAdministrador]

    def get(self, request):
        usuarios = UserService.obtener_usuarios()

        return Response(UsuarioSerializer(usuarios, many=True).data)


class UsuarioDetalleView(APIView):

    permission_classes = [IsAdministrador]

    def get(self, request, id):
        usuario = get_object_or_404(Usuario, id_usuario=id)

        return Response(UsuarioSerializer(usuario).data)

    def put(self, request, id):
        usuario = get_object_or_404(Usuario, id_usuario=id)

        serializer = UsuarioAdminUpdateSerializer(
            usuario,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        # `estado` es la vista de negocio de `is_active`.
        usuario.is_active = usuario.estado == "activo"
        usuario.save(update_fields=["is_active"])

        return Response(UsuarioSerializer(usuario).data)

    def delete(self, request, id):
        usuario = get_object_or_404(Usuario, id_usuario=id)

        if usuario.pk == request.user.pk:
            return Response(
                {"detail": "No puedes desactivar tu propia cuenta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Baja lógica: conserva el histórico de compras del usuario.
        usuario.estado = "inactivo"
        usuario.is_active = False
        usuario.save(update_fields=["estado", "is_active"])

        return Response({"estado": "inactivo"}, status=status.HTTP_200_OK)


class DireccionView(APIView):
    """
    GET  /api/users/direcciones/   -> direcciones del usuario autenticado
    POST /api/users/direcciones/   -> crea una dirección para el usuario
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        direcciones = (
            Direccion.objects
            .filter(usuario=request.user)
            .order_by("-predeterminada", "id_direccion")
        )

        return Response(DireccionSerializer(direcciones, many=True).data)

    def post(self, request):
        serializer = DireccionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        es_primera = not Direccion.objects.filter(usuario=request.user).exists()

        predeterminada = serializer.validated_data.get("predeterminada") or es_primera

        if predeterminada:
            Direccion.objects.filter(
                usuario=request.user, predeterminada=True
            ).update(predeterminada=False)

        direccion = serializer.save(
            usuario=request.user,
            predeterminada=predeterminada,
        )

        return Response(
            DireccionSerializer(direccion).data,
            status=status.HTTP_201_CREATED,
        )


class DireccionDetalleView(APIView):
    """
    PUT    /api/users/direcciones/<id>/
    DELETE /api/users/direcciones/<id>/
    """

    permission_classes = [IsAuthenticated]

    def _get_direccion(self, request, id):
        return get_object_or_404(Direccion, id_direccion=id, usuario=request.user)

    def put(self, request, id):
        direccion = self._get_direccion(request, id)

        serializer = DireccionSerializer(direccion, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get("predeterminada"):
            Direccion.objects.filter(
                usuario=direccion.usuario, predeterminada=True
            ).exclude(id_direccion=direccion.id_direccion).update(predeterminada=False)

        serializer.save()

        return Response(DireccionSerializer(direccion).data)

    def delete(self, request, id):
        direccion = self._get_direccion(request, id)
        direccion.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
