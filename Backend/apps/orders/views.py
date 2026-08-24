from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from datetime import timedelta

from .models import Compra, DetalleCompra, MetodoPago
from .serializers import CompraSerializer
from .services import CompraService

from apps.cart.models import Carrito
from apps.products.models import Variante
from apps.users.models import Direccion, Usuario
from apps.payments.models import Pago, ReservaStock


# Ventana de reserva de stock: alineada con la expiración del Widget
# de Wompi (30 minutos). Si en este tiempo el cliente no paga, el stock
# se devuelve automáticamente al inventario.
RESERVA_MINUTOS = 30


class CompraView(APIView):

    def get(self, request):
        compras = CompraService.listar()
        serializer = CompraSerializer(compras, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CompraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        compra = CompraService.crear(serializer.validated_data)
        return Response(
            CompraSerializer(compra).data,
            status=status.HTTP_201_CREATED,
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


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CheckoutView(APIView):
    """
    POST /api/orders/checkout/

    Crea la Compra + DetalleCompra + Pago(pendiente) + ReservaStock.

    Si el método es Wompi: la reserva de stock descuenta temporalmente
    el inventario durante RESERVA_MINUTOS minutos. Si el cliente paga,
    la reserva se confirma y el stock queda descontado definitivamente.
    Si no paga, el job de cleanup libera el stock.
    """

    def post(self, request):
        usuario_id = request.data.get("usuario_id")
        direccion_id = request.data.get("direccion_id")
        metodo_pago_id = request.data.get("metodo_pago_id")
        telefono_contacto = request.data.get("telefono_contacto") or None
        terminos_aceptados = request.data.get("terminos_aceptados", False)
        datos_aceptados = request.data.get("datos_aceptados", False)

        if not (usuario_id and direccion_id and metodo_pago_id):
            return Response(
                {
                    "detail": (
                        "usuario_id, direccion_id y metodo_pago_id son obligatorios."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = get_object_or_404(Usuario, id_usuario=usuario_id)
            direccion = get_object_or_404(
                Direccion, id_direccion=direccion_id, usuario=usuario
            )
            metodo_pago = get_object_or_404(
                MetodoPago, id_metodo_pago=metodo_pago_id
            )

            try:
                carrito = Carrito.objects.get(usuario=usuario)
            except Carrito.DoesNotExist:
                return Response(
                    {"detail": "Tu carrito está vacío."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            items = list(
                carrito.items
                .select_related("variante__producto")
                .all()
            )

            if not items:
                return Response(
                    {"detail": "Tu carrito está vacío."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                # Bloquear las variantes para validar y reservar stock
                # de forma atómica.
                variantes_bloqueadas = {}
                for it in items:
                    variante = (
                        Variante.objects
                        .select_for_update()
                        .get(id_variante=it.variante.id_variante)
                    )
                    variantes_bloqueadas[it.variante.id_variante] = variante

                    if it.cantidad > variante.stock:
                        return Response(
                            {
                                "detail": (
                                    f"Stock insuficiente para "
                                    f"{variante.producto.nombre}. "
                                    f"Disponible: {variante.stock}, "
                                    f"solicitado: {it.cantidad}."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                total = sum(
                    (
                        it.variante.producto.precio * it.cantidad
                        for it in items
                    ),
                    start=0,
                )

                # 1) Crear Compra.
                compra = Compra.objects.create(
                    usuario=usuario,
                    direccion=direccion,
                    metodo_pago=metodo_pago,
                    total=total,
                    estado_compra="pendiente",
                    telefono_contacto=telefono_contacto or usuario.telefono,
                )

                # 2) Crear DetalleCompra.
                for it in items:
                    DetalleCompra.objects.create(
                        compra=compra,
                        variante=it.variante,
                        cantidad=it.cantidad,
                        precio_unitario=it.variante.producto.precio,
                        subtotal=it.variante.producto.precio * it.cantidad,
                    )

                # 3) Crear Pago pendiente.
                fecha_aceptacion = (
                    timezone.now()
                    if (terminos_aceptados and datos_aceptados)
                    else None
                )
                pago = Pago.objects.create(
                    compra=compra,
                    metodo_pago=metodo_pago,
                    monto=total,
                    estado="pendiente",
                    terminos_aceptados=terminos_aceptados,
                    datos_aceptados=datos_aceptados,
                    fecha_aceptacion=fecha_aceptacion,
                    customer_email=getattr(usuario, "email", None),
                )

                # 4) Reservar stock temporalmente.
                #    Descontamos YA para que nadie más pueda comprar
                #    las mismas unidades mientras el cliente paga.
                #    Si paga, queda descontado. Si no paga, se devuelve.
                ReservaStock.objects.create(
                    compra=compra,
                    estado="activa",
                    fecha_expiracion=(
                        timezone.now() + timedelta(minutes=RESERVA_MINUTOS)
                    ),
                )

                for it in items:
                    variante = variantes_bloqueadas[it.variante.id_variante]
                    variante.stock -= it.cantidad
                    variante.save(update_fields=["stock"])

                # 5) Limpiar carrito (ya estamos en transacción).
                carrito.items.all().delete()

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "pago_id": pago.id_pago,
                    "estado": "pendiente",
                    "total": float(total),
                    "reserva_minutos": RESERVA_MINUTOS,
                    "metodo_pago": {
                        "id": metodo_pago.id_metodo_pago,
                        "tipo": metodo_pago.tipo,
                        "detalle": metodo_pago.detalle or "",
                    },
                    "aceptaciones_legales": {
                        "terminos_aceptados": pago.terminos_aceptados,
                        "datos_aceptados": pago.datos_aceptados,
                        "fecha_aceptacion": (
                            pago.fecha_aceptacion.isoformat()
                            if pago.fecha_aceptacion else None
                        ),
                    },
                    "compra": CompraSerializer(compra).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"detail": f"Error en checkout: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
