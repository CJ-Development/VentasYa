import os
import uuid

from django.conf import settings
from django.db import transaction

from .models import (
    Producto,
    ColorVariant,
    SizeVariant,
    ImagenProducto,
)
from .serializers import ProductoCompletoSerializer


def _guardar_archivo(archivo):
    folder = os.path.join(
        settings.MEDIA_ROOT,
        "productos",
    )
    os.makedirs(folder, exist_ok=True)

    extension = (
        os.path.splitext(archivo.name)[1].lower()
        or ".jpg"
    )

    nombre = f"{uuid.uuid4().hex}{extension}"
    ruta = os.path.join(folder, nombre)

    with open(ruta, "wb") as destino:
        for chunk in archivo.chunks():
            destino.write(chunk)

    return f"{settings.MEDIA_URL}productos/{nombre}"


class ProductoService:

    @staticmethod
    def listar(
        solo_nuevos=False,
        categoria_id=None,
        estado=None,
        ordering=None,
    ):
        productos = Producto.objects.select_related(
            "categoria"
        ).prefetch_related(
            "colorvariant_set__color",
            "colorvariant_set__sizevariant_set",
            "colorvariant_set__imagenproducto_set",
        )

        if estado:
            productos = productos.filter(
                estado=estado
            )

        if categoria_id:
            productos = productos.filter(
                categoria_id=categoria_id
            )

        if solo_nuevos:
            productos = productos.filter(
                estado="activo"
            )

        if ordering:
            campos_permitidos = {
                "nombre",
                "-nombre",
                "precio",
                "-precio",
                "id_producto",
                "-id_producto",
            }

            if ordering in campos_permitidos:
                productos = productos.order_by(
                    ordering
                )
            else:
                productos = productos.order_by(
                    "-id_producto"
                )
        else:
            productos = productos.order_by(
                "-id_producto"
            )

        return productos

    @staticmethod
    def eliminar(id_producto):
        producto = Producto.objects.get(
            id_producto=id_producto
        )

        producto.estado = "inactivo"

        producto.save(
            update_fields=["estado"]
        )

        return producto

    @staticmethod
    def reactivar(id_producto):
        producto = Producto.objects.get(
            id_producto=id_producto
        )

        producto.estado = "activo"

        producto.save(
            update_fields=["estado"]
        )

        return producto

    @staticmethod
    def crear_completo(data, archivos):
        """
        Crea un producto con sus colores, tallas e imágenes
        en una única operación atómica.

        data: dict validado por ProductoCompletoSerializer
        archivos: dict con archivos subidos, claves tipo
                  'imagen_<variante_index>_<imagen_index>'
        """
        with transaction.atomic():
            serializer = ProductoCompletoSerializer(
                data=data
            )
            serializer.is_valid(raise_exception=True)
            payload = serializer.validated_data

            color_variants_data = payload.pop("color_variants")

            producto = Producto.objects.create(**payload)

            for variant_index, variant_data in enumerate(color_variants_data):
                size_variants_data = variant_data.pop("size_variants")
                imagenes_data = variant_data.pop("imagenes", [])

                color_variant = ColorVariant.objects.create(
                    producto=producto,
                    **variant_data,
                )

                for size_data in size_variants_data:
                    SizeVariant.objects.create(
                        color_variant=color_variant,
                        **size_data,
                    )

                for image_index, imagen_data in enumerate(imagenes_data):
                    clave = f"imagen_{variant_index}_{image_index}"
                    archivo = archivos.get(clave)

                    url_imagen = None
                    if archivo is not None:
                        url_imagen = _guardar_archivo(archivo)

                    if url_imagen is None:
                        url_imagen = imagen_data.get("imagen") or ""

                    principal = bool(
                        imagen_data.get("principal", False)
                    )

                    ImagenProducto.objects.create(
                        color_variant=color_variant,
                        imagen=url_imagen,
                        orden=imagen_data.get("orden", image_index + 1),
                        principal=principal,
                    )

            producto.refresh_from_db()

            return producto
