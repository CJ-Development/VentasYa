from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Carrito
from apps.users.models import Direccion
from utils.permissions import IsAdministrador

from .models import Compra, MetodoPago
from .serializers import CompraSerializer
from .services import CheckoutService, CompraService


class CompraView(APIView):
    """Listado global de compras (solo administradores)."""

    permission_classes = [IsAdministrador]

    def get(self, request):

        compras = CompraService.listar()

        return Response(CompraSerializer(compras, many=True).data)


class CompraDetalleView(APIView):

    ESTADOS_VALIDOS = [estado for estado, _ in Compra.ESTADOS]

    CAMPOS_PERMITIDOS = {"estado_compra", "telefono_contacto"}

    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        compra = get_object_or_404(Compra, id_compra=id)

        if not (
            compra.usuario_id == request.user.pk
            or request.user.es_administrador
        ):
            return Response(
                {"detail": "No tienes permiso sobre esta compra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(CompraSerializer(compra).data)

    def put(self, request, id):
        """Cambio de estado del pedido: solo administradores."""

        if not request.user.es_administrador:
            return Response(
                {"detail": "Se requieren permisos de administrador."},
                status=status.HTTP_403_FORBIDDEN,
            )

        get_object_or_404(Compra, id_compra=id)

        nuevo_estado = request.data.get("estado_compra")

        if nuevo_estado and nuevo_estado not in self.ESTADOS_VALIDOS:

            return Response(
                {"estado_compra": f"Estado inválido. Use uno de: {self.ESTADOS_VALIDOS}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data_filtrada = {
            k: v for k, v in request.data.items() if k in self.CAMPOS_PERMITIDOS
        }

        compra_actualizada = CompraService.actualizar(id, data_filtrada)

        return Response(CompraSerializer(compra_actualizada).data)


class MisPedidosView(APIView):
    """Pedidos del usuario autenticado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):

        pedidos = CompraService.de_usuario(request.user)

        return Response(CompraSerializer(pedidos, many=True).data)


class CheckoutView(APIView):
    """
    POST /api/orders/checkout/

    body: {
        "direccion_id":      int,
        "metodo_pago_id":    int,
        "telefono_contacto": str (opcional),
        "idempotency_key":   str (opcional, recomendado)
    }

    El usuario y los precios NO se toman del cliente: el usuario sale del
    token y los precios se recalculan en el servidor con las ofertas
    vigentes.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):

        direccion_id = request.data.get("direccion_id")
        metodo_pago_id = request.data.get("metodo_pago_id")
        telefono_contacto = request.data.get("telefono_contacto") or None
        idempotency_key = request.data.get("idempotency_key") or None

        if not (direccion_id and metodo_pago_id):
            return Response(
                {"detail": "direccion_id y metodo_pago_id son obligatorios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = request.user

        existente = CheckoutService.compra_existente(usuario, idempotency_key)

        if existente is not None:
            return Response(
                CompraSerializer(existente).data,
                status=status.HTTP_200_OK,
            )

        direccion = get_object_or_404(
            Direccion, id_direccion=direccion_id, usuario=usuario
        )
        metodo_pago = get_object_or_404(MetodoPago, id_metodo_pago=metodo_pago_id)

        try:
            carrito = Carrito.objects.get(usuario=usuario)
        except Carrito.DoesNotExist:
            return Response(
                {"detail": "Tu carrito está vacío."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = CheckoutService.ejecutar(
            usuario=usuario,
            carrito=carrito,
            direccion=direccion,
            metodo_pago=metodo_pago,
            telefono_contacto=telefono_contacto,
            idempotency_key=idempotency_key,
        )

        return Response(
            CompraSerializer(compra).data,
            status=status.HTTP_201_CREATED,
        )
