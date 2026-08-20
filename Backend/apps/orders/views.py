from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Compra, DetalleCompra, MetodoPago
from .serializers import CompraSerializer

from .services import CompraService

from apps.cart.models import Carrito
from apps.products.models import Variante
from apps.users.models import Direccion, Usuario
from apps.payments.models import Pago


class CompraView(APIView):

    def get(self,request):

        compras=CompraService.listar()

        serializer=CompraSerializer(
            compras,
            many=True
        )

        return Response(serializer.data)


    def post(self,request):

        serializer=CompraSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        compra=CompraService.crear(
            serializer.validated_data
        )

        return Response(

            CompraSerializer(compra).data,

            status=status.HTTP_201_CREATED
        )


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CompraDetalleView(APIView):

    ESTADOS_VALIDOS = ["pendiente", "pagado", "enviado", "entregado", "cancelado"]

    CAMPOS_PERMITIDOS = {"estado_compra", "telefono_contacto"}

    def get(self, request, id):

        compra = get_object_or_404(Compra, id_compra=id)

        return Response(CompraSerializer(compra).data)

    def put(self, request, id):

        compra = get_object_or_404(Compra, id_compra=id)

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

    def delete(self, request, id):

        CompraService.eliminar(id)

        return Response(status=status.HTTP_204_NO_CONTENT)


class MisPedidosView(APIView):

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

        pedidos = (
            Compra.objects
            .filter(usuario_id=usuario_id)
            .select_related("metodo_pago")
            .prefetch_related("detalles")
            .order_by("-fecha_compra")
        )

        return Response(CompraSerializer(pedidos, many=True).data)


class CheckoutView(APIView):
    """
    POST /api/orders/checkout/
    body: {
        "usuario_id":      int,
        "direccion_id":    int,
        "metodo_pago_id":  int,
        "telefono_contacto": str (opcional)
    }

    Flujo transaccional:
      1. Valida usuario, dirección, método de pago y stock del carrito.
      2. Crea la Compra con sus DetalleCompra.
      3. Descuenta stock de cada Variante.
      4. Crea el Pago (simulado, estado 'aprobado').
      5. Marca la Compra como 'pagado'.
      6. Vacía el carrito del usuario.

    Devuelve la Compra creada con sus detalles.
    """

    def post(self, request):

        usuario_id = request.data.get("usuario_id")
        direccion_id = request.data.get("direccion_id")
        metodo_pago_id = request.data.get("metodo_pago_id")
        telefono_contacto = request.data.get("telefono_contacto") or None

        if not (usuario_id and direccion_id and metodo_pago_id):
            return Response(
                {
                    "detail": "usuario_id, direccion_id y metodo_pago_id son obligatorios."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = get_object_or_404(Usuario, id_usuario=usuario_id)
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

        items = list(carrito.items.select_related("variante__producto").all())

        if not items:
            return Response(
                {"detail": "Tu carrito está vacío."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar stock antes de hacer cualquier cambio
        for it in items:
            if it.cantidad > it.variante.stock:
                return Response(
                    {
                        "detail": (
                            f"Stock insuficiente para {it.variante.producto.nombre}. "
                            f"Disponible: {it.variante.stock}, solicitado: {it.cantidad}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():

            total = sum(
                (it.variante.producto.precio * it.cantidad for it in items),
                start=0,
            )

            compra = Compra.objects.create(
                usuario=usuario,
                direccion=direccion,
                metodo_pago=metodo_pago,
                total=total,
                estado_compra="pagado",
                telefono_contacto=telefono_contacto or usuario.telefono,
            )

            for it in items:
                DetalleCompra.objects.create(
                    compra=compra,
                    variante=it.variante,
                    cantidad=it.cantidad,
                    precio_unitario=it.variante.producto.precio,
                    subtotal=it.variante.producto.precio * it.cantidad,
                )

                # Descontar stock
                Variante.objects.filter(
                    id_variante=it.variante.id_variante
                ).update(stock=it.variante.stock - it.cantidad)

            Pago.objects.create(
                compra=compra,
                metodo_pago=metodo_pago,
                monto=total,
                estado="aprobado",
                referencia_transaccion=f"SIM-{compra.id_compra}",
            )

            # Vaciar carrito
            carrito.items.all().delete()

        return Response(
            CompraSerializer(compra).data,
            status=status.HTTP_201_CREATED,
        )