from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

# from apps.products.models import Variante
# TODO: Actualizar orders para usar SizeVariant

from .models import Compra, DetalleCompra


class CompraService:

    @staticmethod
    def listar():
        return Compra.objects.select_related("usuario", "direccion", "metodo_pago").prefetch_related("detalles").order_by("-fecha_compra")

    @staticmethod
    def de_usuario(usuario):
        return Compra.objects.filter(usuario=usuario).select_related("metodo_pago", "direccion").prefetch_related("detalles").order_by("-fecha_compra")

    @staticmethod
    def obtener(id_compra):
        return Compra.objects.select_related("usuario", "direccion", "metodo_pago").prefetch_related("detalles__variante__producto").get(id_compra=id_compra)

    @staticmethod
    def actualizar(id_compra, data):
        compra = Compra.objects.get(id_compra=id_compra)
        for campo, valor in data.items():
            setattr(compra, campo, valor)
        compra.save()
        return compra


class CheckoutService:
    @staticmethod
    def compra_existente(usuario, idempotency_key):
        if not idempotency_key:
            return None
        return Compra.objects.filter(usuario=usuario, idempotency_key=idempotency_key).prefetch_related("detalles").first()

    @staticmethod
    @transaction.atomic
    def ejecutar(*, usuario, carrito, direccion, metodo_pago, telefono_contacto=None, idempotency_key=None):
        items = list(carrito.items.select_related("variante__producto").order_by("variante_id"))

        if not items:
            raise ValidationError({"detail": "Tu carrito está vacío."})

        variante_ids = [it.variante_id for it in items]
        variantes = {
            v.id_variante: v
            for v in Variante.objects.select_for_update().select_related("producto").filter(id_variante__in=variante_ids)
        }

        total = Decimal("0")
        lineas = []

        for item in items:
            variante = variantes[item.variante_id]

            if item.cantidad > variante.stock:
                raise ValidationError({
                    "detail": f"Stock insuficiente para {variante.producto.nombre}. Disponible: {variante.stock}, solicitado: {item.cantidad}."
                })

            precio_unitario = Decimal(variante.precio)
            subtotal = precio_unitario * item.cantidad
            total += subtotal

            lineas.append((variante, item.cantidad, precio_unitario, subtotal))

        compra = Compra.objects.create(
            usuario=usuario,
            direccion=direccion,
            metodo_pago=metodo_pago,
            total=total,
            estado="pendiente",
            telefono_contacto=telefono_contacto or usuario.telefono,
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
            Variante.objects.filter(id_variante=variante.id_variante).update(stock=F("stock") - cantidad)

        carrito.items.all().delete()

        return compra
