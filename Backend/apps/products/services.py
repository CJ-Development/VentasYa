import os
import uuid
import mimetypes
import urllib.request
import urllib.error
import json

from django.conf import settings
from django.db import transaction
from django.db.models import Prefetch

from .models import Producto, Variante, ImagenProducto
from .serializers import VarianteSerializer


class ProductoService:
    @staticmethod
    def listar(*, solo_nuevos=False, categoria_id=None, estado=None, ordering=None):
        qs = ProductoService._base_queryset()
        if solo_nuevos:
            qs = qs.filter(created_at__isnull=False).order_by("-created_at", "id_producto")
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
            Producto.objects.select_related("categoria").prefetch_related(
                Prefetch(
                    "variante_set",
                    queryset=Variante.objects.select_related("color", "talla").prefetch_related(
                        Prefetch("imagenproducto_set", queryset=ImagenProducto.objects.order_by("orden", "id_imagen"))
                    ),
                )
            )
        )

    @staticmethod
    def obtener(id_producto):
        return ProductoService._base_queryset().get(id_producto=id_producto)

    @staticmethod
    def crear(data):
        return Producto.objects.create(**data)

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

    @staticmethod
    def _save_uploaded_file(uploaded_file):
        # Usar siempre almacenamiento local (Vercel Blob desactivado)
        # Fallback a almacenamiento local
        folder = os.path.join(settings.MEDIA_ROOT, "productos")
        os.makedirs(folder, exist_ok=True)
        ext = os.path.splitext(uploaded_file.name)[1].lower() or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(folder, filename)
        with open(path, "wb") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        return f"{settings.MEDIA_URL.rstrip('/')}/productos/{filename}"

    @staticmethod
    def _resolve_local_path_from_url(value):
        if not value:
            return None
        prefix = settings.MEDIA_URL.rstrip("/") + "/"
        if not value.startswith(prefix):
            return None
        relative = value[len(prefix):]
        return os.path.join(settings.MEDIA_ROOT, relative)

    @staticmethod
    def _delete_file_if_local(imagen):
        path = ProductoService._resolve_local_path_from_url(imagen.imagen)
        if not path:
            return
        if os.path.isfile(path):
            try:
                os.remove(path)
            except OSError:
                pass

    @staticmethod
    def _delete_file_by_url(value):
        path = ProductoService._resolve_local_path_from_url(value)
        if not path:
            return
        if os.path.isfile(path):
            try:
                os.remove(path)
            except OSError:
                pass

    @staticmethod
    @transaction.atomic
    def guardar_completo(*, producto_data, variantes_data, archivos):
        # Lista de URLs de archivos nuevos escritos al disco.
        # Si la transacción falla (rollback), se borran para evitar huérfanos.
        uploaded_file_urls = []

        # on_commit: borra los archivos nuevos que sí se persistieron
        # cuando ya se confirmó la transacción (solo en éxito).
        # Lo usamos para NO borrar archivos de updates exitosos.
        try:
            producto_id = producto_data.pop("id_producto", None)
            if producto_id:
                producto = Producto.objects.select_for_update().get(id_producto=producto_id)
                for field, value in producto_data.items():
                    setattr(producto, field, value)
                producto.save()
            else:
                producto = Producto.objects.create(**producto_data)

            existing_variants = {v.id_variante: v for v in Variante.objects.filter(producto=producto)}
            received_variant_ids = set()

            for variant_data in variantes_data:

                variant_id = variant_data.pop("id_variante", None)

                image_data = variant_data.pop("imagenes", []) or []

                # Validar relaciones obligatorias
                if variant_data.get("color_id") is None:
                    raise ValueError(
                        "Cada variante necesita un color válido. "
                        "Debe enviarse color_id."
                    )

                if variant_data.get("talla_id") is None:
                    raise ValueError(
                        "Cada variante necesita una talla válida. "
                        "Debe enviarse talla_id."
                    )

                existing_variant = (
                    existing_variants.get(int(variant_id))
                    if variant_id is not None
                    else None
                )

                if variant_id and (
                    not existing_variant
                    or existing_variant.producto_id != producto.id_producto
                ):
                    raise ValueError(
                        "Una de las variantes no pertenece al producto."
                    )

                variant_serializer = VarianteSerializer(
                    existing_variant,
                    data={
                        **variant_data,
                        "producto_id": producto.id_producto,
                    },
                    partial=existing_variant is not None,
                )

                variant_serializer.is_valid(raise_exception=True)

                clean_variant = variant_serializer.validated_data

                clean_variant.pop("producto", None)

                if existing_variant:
                    existing_variant.color = clean_variant["color"]
                    existing_variant.talla = clean_variant["talla"]
                    existing_variant.sku = clean_variant["sku"]
                    existing_variant.stock = clean_variant["stock"]
                    existing_variant.save()
                    variant = existing_variant
                else:
                    variant = Variante.objects.create(producto=producto, **clean_variant)

                received_variant_ids.add(variant.id_variante)
                existing_images = {i.id_imagen: i for i in ImagenProducto.objects.filter(variante=variant)}
                received_image_ids = set()

                if len(image_data) > 3:
                    raise ValueError("Cada variante puede tener máximo 3 imágenes.")

                for image_index, image_item in enumerate(image_data, start=1):
                    image_id = image_item.get("id_imagen")
                    principal = bool(image_item.get("principal", image_index == 1))
                    order = int(image_item.get("orden") or image_index)
                    file_key = image_item.get("file_key")

                    if image_id:
                        image = existing_images.get(int(image_id))
                        if not image or image.variante_id != variant.id_variante:
                            raise ValueError("Una de las imágenes no pertenece a la variante.")
                        image.principal = principal
                        image.orden = order
                        image.save(update_fields=["principal", "orden"])
                        received_image_ids.add(image.id_imagen)
                        continue

                    uploaded = archivos.get(file_key) if file_key else None
                    if uploaded:
                        image_url = ProductoService._save_uploaded_file(uploaded)
                        uploaded_file_urls.append(image_url)
                    else:
                        image_url = image_item.get("imagen", "")

                    if not image_url:
                        raise ValueError("Cada imagen nueva debe incluir un archivo o una URL.")

                    image = ImagenProducto.objects.create(variante=variant, imagen=image_url, principal=principal, orden=order)
                    received_image_ids.add(image.id_imagen)

                for old_image in existing_images.values():
                    if old_image.id_imagen not in received_image_ids:
                        ProductoService._delete_file_if_local(old_image)
                        old_image.delete()

                principal_images = ImagenProducto.objects.filter(variante=variant, principal=True).order_by("orden", "id_imagen")
                first = principal_images.first()
                if first:
                    principal_images.exclude(id_imagen=first.id_imagen).update(principal=False)

            for old_variant in existing_variants.values():
                if old_variant.id_variante not in received_variant_ids:
                    for old_image in ImagenProducto.objects.filter(variante=old_variant):
                        ProductoService._delete_file_if_local(old_image)
                    old_variant.delete()

            return ProductoService.obtener(producto.id_producto)
        except Exception:
            # Rollback de archivos: borra cualquier archivo que ya se haya
            # escrito al disco durante esta transacción antes del fallo.
            for url in uploaded_file_urls:
                ProductoService._delete_file_by_url(url)
            raise
