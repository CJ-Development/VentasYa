from django.db.models import Prefetch

from .models import Producto, ColorVariant, SizeVariant, ImagenProducto


class ProductoService:

    @staticmethod
    def listar(
        *,
        solo_nuevos=False,
        categoria_id=None,
        estado=None,
        ordering=None,
    ):
        """
        Lista productos con filtros opcionales.

        Args:
            solo_nuevos: si True, devuelve solo productos con created_at
                poblado, ordenados del más reciente al más antiguo.
            categoria_id: filtra por id de categoría.
            estado: filtra por estado (ej. "activo", "inactivo", "archivado").
                Si es None, NO se aplica filtro de estado (compatibilidad
                con llamadas existentes).
            ordering: campo de ordenamiento. Si se pasa se ignora el
                default de Meta y se ordena por este campo.
        """
        qs = ProductoService._base_queryset()

        if solo_nuevos:
            qs = qs.filter(
                created_at__isnull=False
            ).order_by("-created_at", "id_producto")
        elif ordering:
            qs = qs.order_by(ordering, "id_producto")

        if categoria_id is not None:
            qs = qs.filter(categoria_id=categoria_id)

        if estado is not None:
            qs = qs.filter(estado=estado)

        return qs


    @staticmethod
    def _base_queryset():
        return (
            Producto.objects
            .select_related("categoria")
            .prefetch_related(
                Prefetch(
                    "colorvariant_set",
                    queryset=ColorVariant.objects.select_related(
                        "color"
                    ).prefetch_related(
                        Prefetch(
                            "sizevariant_set",
                            queryset=SizeVariant.objects.all()
                        ),
                        Prefetch(
                            "imagenproducto_set",
                            queryset=ImagenProducto.objects.order_by(
                                "orden", "id_imagen"
                            ),
                        )
                    ),
                )
            )
        )


    @staticmethod
    def obtener(id_producto):
        return ProductoService._base_queryset().get(
            id_producto=id_producto
        )


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
        return ProductoService.actualizar(
            id_producto,
            {"estado": "archivado"}
        )


    @staticmethod
    def reactivar(id_producto):
        return ProductoService.actualizar(
            id_producto,
            {"estado": "activo"}
        )
