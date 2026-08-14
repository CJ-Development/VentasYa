from datetime import date
import os
import uuid

from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from .models import (
    Producto,
    ColorVariant,
    SizeVariant,
    ImagenProducto,
    Color,
)

from apps.categories.models import Categoria
from apps.categories.serializers import CategoriaSerializer
from apps.offers.models import Oferta


class OfertaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Oferta
        fields = [
            "id_oferta",
            "nombre",
            "tipo_descuento",
            "valor",
            "fecha_inicio",
            "fecha_fin",
            "activa",
        ]


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = "__all__"


class ImagenSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(
        required=False,
        write_only=True,
    )

    class Meta:
        model = ImagenProducto
        fields = [
            "id_imagen",
            "color_variant",
            "imagen",
            "orden",
            "principal",
            "archivo",
        ]
        read_only_fields = [
            "id_imagen",
            "color_variant",
        ]

    def _guardar_archivo(self, archivo):
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

    def create(self, validated_data):
        archivo = validated_data.pop("archivo", None)

        if archivo:
            validated_data["imagen"] = self._guardar_archivo(archivo)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        archivo = validated_data.pop("archivo", None)

        if archivo:
            validated_data["imagen"] = self._guardar_archivo(archivo)

        return super().update(instance, validated_data)


class SizeVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizeVariant
        fields = [
            "id_size_variant",
            "color_variant",
            "talla",
            "stock",
            "sku",
        ]

        read_only_fields = [
            "id_size_variant",
            "color_variant",
        ]


class ColorVariantSerializer(serializers.ModelSerializer):
    color = ColorSerializer(read_only=True)

    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(),
        source="color",
        write_only=True,
        required=False,
        allow_null=True,
    )

    imagenes = ImagenSerializer(
        many=True,
        read_only=True,
        source="imagenproducto_set",
    )

    size_variants = SizeVariantSerializer(
        many=True,
        read_only=True,
        source="sizevariant_set",
    )

    class Meta:
        model = ColorVariant
        fields = [
            "id_variante",
            "producto",
            "color",
            "color_id",
            "imagenes",
            "size_variants",
        ]

        read_only_fields = [
            "id_variante",
            "producto",
        ]


class ProductoSerializer(serializers.ModelSerializer):

    categoria = CategoriaSerializer(
        read_only=True
    )

    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source="categoria",
        write_only=True,
    )

    color_variants = ColorVariantSerializer(
        many=True,
        read_only=True,
        source="colorvariant_set",
    )

    oferta_activa = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            "id_producto",
            "nombre",
            "slug",
            "descripcion",
            "precio",
            "estado",
            "categoria",
            "categoria_id",
            "color_variants",
            "oferta_activa",
        ]

    def get_oferta_activa(self, obj):
        hoy = date.today()

        oferta = (
            Oferta.objects
            .filter(
                producto=obj,
                activa=True,
                fecha_inicio__lte=hoy,
                fecha_fin__gte=hoy,
            )
            .first()
        )

        if oferta:
            return OfertaSimpleSerializer(
                oferta
            ).data

        return None


class SizeVariantCreateSerializer(serializers.Serializer):
    """
    Datos temporales de una talla dentro del formulario.
    """

    talla = serializers.CharField(
        max_length=10,
        allow_blank=True,
        allow_null=True,
    )

    stock = serializers.IntegerField(
        min_value=0
    )

    sku = serializers.CharField(
        max_length=50
    )

    def validate_sku(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "El SKU es obligatorio."
            )

        return value


class ImagenCreateSerializer(serializers.Serializer):
    """
    Imagen pendiente de guardar.

    Puede ser:
    - URL
    - archivo enviado mediante multipart
    """

    imagen = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    principal = serializers.BooleanField(
        required=False,
        default=False,
    )

    orden = serializers.IntegerField(
        required=False,
        min_value=0,
    )

    archivo = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        imagen = attrs.get("imagen")
        archivo = attrs.get("archivo")

        if not imagen and not archivo:
            raise serializers.ValidationError(
                "La imagen debe contener una URL o un archivo."
            )

        if imagen and archivo:
            raise serializers.ValidationError(
                "Una imagen no puede contener URL y archivo al mismo tiempo."
            )

        return attrs


class ColorVariantCreateSerializer(serializers.Serializer):
    """
    Representa un color completo dentro del formulario.

    Un color contiene:
        color
        tallas
        imágenes
    """

    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(),
        allow_null=True,
        required=False,
    )

    size_variants = SizeVariantCreateSerializer(
        many=True
    )

    imagenes = ImagenCreateSerializer(
        many=True,
        required=False,
    )

    def validate_imagenes(self, value):
        if len(value) > 3:
            raise serializers.ValidationError(
                "Cada color puede tener máximo 3 imágenes."
            )

        return value


class ProductoCompletoSerializer(serializers.Serializer):
    """
    Serializer utilizado exclusivamente para crear
    un producto completo en una sola operación.

    No guarda nada directamente.
    La creación real la realiza ProductoService.
    """

    nombre = serializers.CharField(
        max_length=150
    )

    slug = serializers.SlugField(
        max_length=50
    )

    descripcion = serializers.CharField()

    precio = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0.01,
    )

    estado = serializers.CharField(
        max_length=20,
        default="activo",
    )

    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source="categoria",
    )

    color_variants = ColorVariantCreateSerializer(
        many=True
    )

    def validate_slug(self, value):
        value = value.strip().lower()

        queryset = Producto.objects.filter(
            slug=value
        )

        producto_id = self.context.get(
            "producto_id"
        )

        if producto_id:
            queryset = queryset.exclude(
                id_producto=producto_id
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Ya existe un producto con este slug."
            )

        return value

    def validate_color_variants(self, value):
        if not value:
            raise serializers.ValidationError(
                "El producto debe tener al menos un color."
            )

        if len(value) > 10:
            raise serializers.ValidationError(
                "Un producto puede tener máximo 10 colores."
            )

        colores = []

        for variante in value:
            color = variante.get("color_id")

            if color is not None:
                if color.pk in colores:
                    raise serializers.ValidationError(
                        "No puedes repetir el mismo color."
                    )

                colores.append(color.pk)

            tallas = variante.get(
                "size_variants",
                []
            )

            if not tallas:
                raise serializers.ValidationError(
                    "Cada color debe tener al menos una talla."
                )

            if len(tallas) > 20:
                raise serializers.ValidationError(
                    "Cada color puede tener máximo 20 tallas."
                )

        return value

    def validate(self, attrs):
        skus = set()

        for color_variant in attrs["color_variants"]:
            for size_variant in color_variant[
                "size_variants"
            ]:
                sku = size_variant["sku"].strip()

                sku_normalizado = sku.upper()

                if sku_normalizado in skus:
                    raise serializers.ValidationError({
                        "color_variants": (
                            "No puedes repetir un SKU "
                            "dentro del mismo formulario."
                        )
                    })

                if SizeVariant.objects.filter(
                    sku=sku
                ).exists():
                    raise serializers.ValidationError({
                        "color_variants": (
                            f"El SKU '{sku}' ya existe."
                        )
                    })

                skus.add(sku_normalizado)

        return attrs