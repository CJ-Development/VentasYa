from decimal import Decimal

from django.utils import timezone

from .models import Oferta


class OfertaService:

    @staticmethod
    def listar():
        return Oferta.objects.select_related("producto").order_by("-fecha_inicio")

    @staticmethod
    def obtener(id_oferta):
        return OfertaService.listar().get(id_oferta=id_oferta)

    @staticmethod
    def crear(data):
        return Oferta.objects.create(**data)

    @staticmethod
    def actualizar(id_oferta, data):
        oferta = Oferta.objects.get(id_oferta=id_oferta)

        for campo, valor in data.items():
            setattr(oferta, campo, valor)

        oferta.save()
        return oferta

    @staticmethod
    def eliminar(id_oferta):
        Oferta.objects.filter(id_oferta=id_oferta).delete()

    # ------------------------------------------------------------------
    # Cálculo de precios
    # ------------------------------------------------------------------

    @staticmethod
    def vigentes(producto_ids=None):
        """Ofertas activas cuyo rango de fechas incluye hoy."""

        hoy = timezone.localdate()

        qs = Oferta.objects.filter(
            activa=True,
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy,
        )

        if producto_ids is not None:
            qs = qs.filter(producto_id__in=list(producto_ids))

        return qs

    @staticmethod
    def aplicar(precio_base, oferta):
        """Precio resultante de aplicar una oferta a un precio base."""

        precio = Decimal(precio_base)
        valor = Decimal(oferta.valor)

        if oferta.tipo_descuento == "porcentaje":
            precio_final = precio - (precio * valor / Decimal("100"))
        else:
            precio_final = precio - valor

        return max(precio_final, Decimal("0")).quantize(Decimal("0.01"))

    @staticmethod
    def mapa_precios(productos):
        """
        Dado un iterable de Producto, devuelve
        {id_producto: precio_con_descuento} usando la mejor oferta vigente.

        Si un producto no tiene oferta vigente no aparece en el mapa.
        """

        productos = list(productos)

        precios_base = {p.id_producto: Decimal(p.precio) for p in productos}

        mejores = {}

        for oferta in OfertaService.vigentes(precios_base.keys()):
            base = precios_base[oferta.producto_id]
            candidato = OfertaService.aplicar(base, oferta)

            if oferta.producto_id not in mejores or candidato < mejores[oferta.producto_id]:
                mejores[oferta.producto_id] = candidato

        return mejores

    @staticmethod
    def precio_efectivo(producto):
        """Precio de venta actual del producto (con oferta vigente si la hay)."""

        mapa = OfertaService.mapa_precios([producto])

        return mapa.get(producto.id_producto, Decimal(producto.precio))
