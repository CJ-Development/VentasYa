from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from apps.offers.services import OfertaService
from apps.payments.models import Pago
from apps.products.models import Variante

from .models import Compra, DetalleCompra


class CompraService:

    @staticmethod
    def listar():

        return Compra.objects.select_related(
            "usuario",
            "direccion",
            "metodo_pago"
        ).prefetch_related("detalles").order_by("-fecha_compra")

    @staticmethod
    def de_usuario(usuario):

        return (
            Compra.objects
            .filter(usuario=usuario)
            .select_related("metodo_pago", "direccion")
            .prefetch_related("detalles")
            .order_by("-fecha_compra")
        )

    @staticmethod
    def obtener(id_compra):

        return (
            Compra.objects
            .select_related("usuario", "direccion", "metodo_pago")
            .prefetch_related("detalles__variante__producto")
            .get(id_compra=id_compra)
        )

    @staticmethod
    def actualizar(id_compra, data):

        compra = Compra.objects.get(id_compra=id_compra)

        for campo, valor in data.items():
            setattr(compra, campo, valor)

        compra.save()
        return compra


class CheckoutService:
    """
    Convierte el carrito del usuario en una Compra.

    Reglas:
      - Los precios se recalculan SIEMPRE en el servidor aplicando las
        ofertas vigentes; nunca se confía en lo que envía el cliente.
      - El stock se bloquea con `select_for_update` y se descuenta con
        `F()`, de modo que dos checkouts simultáneos no pueden vender
        la misma unidad dos veces.
      - `idempotency_key` evita compras duplicadas por reintentos o
        doble clic.
    """

    @staticmethod
    def compra_existente(usuario, idempotency_key):
        if not idempotency_key:
            return None

        return (
            Compra.objects
            .filter(usuario=usuario, idempotency_key=idempotency_key)
            .prefetch_related("detalles")
            .first()
        )

    @staticmethod
    @transaction.atomic
    def ejecutar(*, usuario, carrito, direccion, metodo_pago,
                 telefono_contacto=None, idempotency_key=None):

        items = list(
            carrito.items
            .select_related("variante__producto")
            .order_by("variante_id")
        )

        if not items:
            raise ValidationError({"detail": "Tu carrito está vacío."})

        variante_ids = [it.variante_id for it in items]

        # Bloquea las filas de stock hasta el final de la transacción.
        variantes = {
            v.id_variante: v
            for v in Variante.objects
            .select_for_update()
            .select_related("producto")
            .filter(id_variante__in=variante_ids)
        }

        precios = OfertaService.mapa_precios(
            [v.producto for v in variantes.values()]
        )

        total = Decimal("0")
        lineas = []

        for item in items:
            variante = variantes[item.variante_id]

            if item.cantidad > variante.stock:
                raise ValidationError({
                    "detail": (
                        f"Stock insuficiente para {variante.producto.nombre}. "
                        f"Disponible: {variante.stock}, solicitado: {item.cantidad}."
                    )
                })

            precio_unitario = precios.get(
                variante.producto_id,
                Decimal(variante.producto.precio),
            )

            subtotal = precio_unitario * item.cantidad
            total += subtotal

            lineas.append((variante, item.cantidad, precio_unitario, subtotal))

        compra = Compra.objects.create(
            usuario=usuario,
            direccion=direccion,
            metodo_pago=metodo_pago,
            total=total,
            estado_compra="pagado",
            telefono_contacto=telefono_contacto or usuario.telefono,
            idempotency_key=idempotency_key or None,
        )

        DetalleCompra.objects.bulk_create([
            DetalleCompra(
                compra=compra,
                variante=variante,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                subtotal=subtotal,
            )
            for variante, cantidad, precio_unitario, subtotal in lineas
        ])

        for variante, cantidad, _, _ in lineas:
            Variante.objects.filter(id_variante=variante.id_variante).update(
                stock=F("stock") - cantidad
            )

        # Pago simulado: se reemplazará por la pasarela real (Wompi).
        Pago.objects.create(
            compra=compra,
            metodo_pago=metodo_pago,
            monto=total,
            estado="aprobado",
            referencia_transaccion=f"SIM-{compra.id_compra}",
        )

        carrito.items.all().delete()

        return compra
