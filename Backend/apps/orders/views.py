from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction, OperationalError, IntegrityError, ProgrammingError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone

import logging

from .models import Compra, DetalleCompra, MetodoPago
from .serializers import CompraSerializer
from .services import CompraService

from apps.cart.models import Carrito
from apps.products.models import Variante
from apps.users.models import Direccion, Usuario
from apps.payments.models import Pago


logger = logging.getLogger(__name__)


@method_decorator(ensure_csrf_cookie, name="dispatch")
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


@method_decorator(ensure_csrf_cookie, name="dispatch")
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

    Crea la Compra + DetalleCompra + Pago(pendiente).
    Descuenta stock definitivamente y vacía el carrito.

    Responde con los datos completos del pedido para que el frontend
    pueda generar el mensaje de WhatsApp.
    """

    def post(self, request):
        usuario_id = request.data.get("usuario_id")
        direccion_id = request.data.get("direccion_id")
        telefono_contacto = request.data.get("telefono_contacto") or None
        terminos_aceptados = request.data.get("terminos_aceptados", False)
        datos_aceptados = request.data.get("datos_aceptados", False)

        if not (usuario_id and direccion_id):
            return Response(
                {
                    "detail": (
                        "usuario_id y direccion_id son obligatorios."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = get_object_or_404(Usuario, id_usuario=usuario_id)
            direccion = get_object_or_404(
                Direccion, id_direccion=direccion_id, usuario=usuario
            )
            
            # Obtener o crear el método de pago WhatsApp internamente
            metodo_pago, _ = MetodoPago.objects.get_or_create(
                tipo="WhatsApp",
                defaults={"detalle": "Envía tu pedido directamente por WhatsApp"}
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
                # Bloquear las variantes para validar y deducir stock.
                for it in items:
                    variante = (
                        Variante.objects
                        .select_for_update()
                        .get(id_variante=it.variante.id_variante)
                    )

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
                detalles_compra = []
                for it in items:
                    detalle = DetalleCompra.objects.create(
                        compra=compra,
                        variante=it.variante,
                        cantidad=it.cantidad,
                        precio_unitario=it.variante.producto.precio,
                        subtotal=it.variante.producto.precio * it.cantidad,
                    )
                    detalles_compra.append(detalle)

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
                )

                # 4) Descontar stock definitivamente.
                for it in items:
                    variante = (
                        Variante.objects
                        .select_for_update()
                        .get(id_variante=it.variante.id_variante)
                    )
                    variante.stock -= it.cantidad
                    variante.save(update_fields=["stock"])

                # 5) Vaciar carrito.
                carrito.items.all().delete()

            # Construir datos detallados para WhatsApp.
            productos_whatsapp = []
            for it in items:
                v = it.variante
                p = v.producto
                productos_whatsapp.append({
                    "nombre": p.nombre,
                    "sku": v.sku or "",
                    "color": v.color or "",
                    "talla": v.talla or "",
                    "cantidad": it.cantidad,
                    "precio_unitario": float(p.precio),
                    "subtotal": float(p.precio * it.cantidad),
                    "imagen": (
                        p.imagen.url if p.imagen else ""
                    ),
                })

            whatsapp_number = getattr(settings, "WHATSAPP_NUMBER", "573001234567")

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "pago_id": pago.id_pago,
                    "estado": "pendiente",
                    "total": float(total),
                    "whatsapp_number": whatsapp_number,
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
                    "cliente": {
                        "nombre": usuario.nombre,
                        "email": usuario.email or "",
                        "telefono": telefono_contacto or usuario.telefono or "",
                    },
                    "direccion_envio": {
                        "direccion": direccion.direccion,
                        "ciudad": direccion.ciudad,
                        "departamento": direccion.departamento,
                        "codigo_postal": direccion.codigo_postal or "",
                    },
                    "productos": productos_whatsapp,
                    "compra": CompraSerializer(compra).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.exception(
                "Checkout falló | usuario_id=%s direccion_id=%s "
                "metodo_pago_id=%s items=%s",
                usuario_id, direccion_id, metodo_pago_id,
                len(items) if 'items' in locals() else 0,
            )

            if isinstance(e, OperationalError):
                return Response(
                    {
                        "detail": (
                            "No se pudo conectar con la base de datos. "
                            "Intenta de nuevo en unos segundos."
                        ),
                        "error_type": "db_unavailable",
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            if isinstance(e, ProgrammingError):
                msg = str(e).lower()
                if (
                    "does not exist" in msg
                    and (
                        "column" in msg
                        or "relation" in msg
                        or "table" in msg
                    )
                ):
                    return Response(
                        {
                            "detail": (
                                "La base de datos no está sincronizada "
                                "con la última versión del backend. "
                                "Por favor contacta al administrador."
                            ),
                            "error_type": "migrations_pending",
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

            if isinstance(e, IntegrityError):
                return Response(
                    {
                        "detail": (
                            "Datos inconsistentes al crear la compra. "
                            "Verifica dirección y método de pago."
                        ),
                        "error_type": "data_integrity",
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            return Response(
                {
                    "detail": f"Error en checkout: {type(e).__name__}: {e}",
                    "error_type": "internal_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
