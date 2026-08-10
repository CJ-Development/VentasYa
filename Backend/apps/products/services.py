from django.db.models import Prefetch

from .models import Producto, Variante, ImagenProducto


class ProductoService:

    @staticmethod
    def listar():
        return (
            Producto.objects
            .select_related("categoria")
            .prefetch_related(
                Prefetch(
                    "variante_set",
                    queryset=Variante.objects.select_related("color", "talla").prefetch_related(
                        Prefetch(
                            "imagenproducto_set",
                            queryset=ImagenProducto.objects.order_by("orden", "id_imagen"),
                        )
                    ),
                )
            )
        )

    @staticmethod
    def obtener(id_producto):
        return ProductoService.listar().get(id_producto=id_producto)

    @staticmethod
    def crear(data):
        return Producto.objects.create(
            **data
        )

    @staticmethod
    def actualizar(id_producto, data):
        producto = ProductoService.obtener(id_producto)

        for campo, valor in data.items():
            setattr(producto, campo, valor)

        producto.save()
        return producto

    @staticmethod
    def eliminar(id_producto):
        return ProductoService.actualizar(id_producto, {"estado": "archivado"})

    @staticmethod
    def reactivar(id_producto):
        return ProductoService.actualizar(id_producto, {"estado": "activo"})