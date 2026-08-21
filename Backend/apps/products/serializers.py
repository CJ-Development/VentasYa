from rest_framework import serializers

from .models import Producto, Variante, ImagenProducto, Color, Talla

from apps.categories.serializers import CategoriaSerializer
from apps.categories.models import Categoria

import os
import uuid

from django.conf import settings
from .blob_storage import BlobStorageService


class ColorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Color
        fields = "__all__"


class TallaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Talla
        fields = "__all__"


class ImagenSerializer(serializers.ModelSerializer):

    # Campo opcional para subir un archivo desde la PC.
    # NO está en el modelo: se usa solo en create/update y luego
    # se guarda en disco y se asigna la URL resultante a `imagen`.
    archivo = serializers.FileField(
        required=False,
        write_only=True,
    )

    class Meta:
        model = ImagenProducto
        fields = "__all__"

    def _guardar_archivo(self, archivo):
        """Sube el archivo a Vercel Blob Storage"""
        return BlobStorageService.upload_file(archivo, folder="productos")

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


class VarianteSerializer(serializers.ModelSerializer):

    imagenes = ImagenSerializer(
        many=True,
        read_only=True,
        source="imagenproducto_set"
    )

    color = ColorSerializer(read_only=True)

    talla = TallaSerializer(read_only=True)

    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(),
        source="color",
        write_only=True,
        required=False,
        allow_null=True
    )

    talla_id = serializers.PrimaryKeyRelatedField(
        queryset=Talla.objects.all(),
        source="talla",
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Variante
        fields = [
            "id_variante",
            "color",
            "color_id",
            "talla",
            "talla_id",
            "sku",
            "stock",
            "imagenes",
        ]


class ProductoSerializer(serializers.ModelSerializer):

    categoria = CategoriaSerializer(read_only=True)

    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source="categoria",
        write_only=True
    )

    variantes = VarianteSerializer(
        many=True,
        read_only=True,
        source="variante_set"
    )

    def to_internal_value(self, data):
        # Manejar el caso donde descripcion viene como array
        if 'descripcion' in data and isinstance(data['descripcion'], list):
            data = data.copy()
            if len(data['descripcion']) > 0:
                data['descripcion'] = str(data['descripcion'][0])
            else:
                data['descripcion'] = ''
        return super().to_internal_value(data)

    class Meta:

        model = Producto

        fields = [
            "id_producto",
            "categoria",
            "categoria_id",
            "nombre",
            "slug",
            "descripcion",
            "precio",
            "estado",
            "created_at",
            "updated_at",
            "variantes",
        ]
