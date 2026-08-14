from rest_framework import serializers

from .models import Producto, ColorVariant, SizeVariant, ImagenProducto, Color

from apps.categories.serializers import CategoriaSerializer
from apps.categories.models import Categoria

from apps.offers.models import Oferta

import os
import uuid
from datetime import date

from django.conf import settings
from django.db import transaction


class OfertaSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para evitar importación circular"""
    class Meta:
        model = Oferta
        fields = ["id_oferta", "nombre", "tipo_descuento", "valor", "fecha_inicio", "fecha_fin", "activa"]


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
        fields = "__all__"

    def _guardar_archivo(self, archivo):
        folder = os.path.join(
            settings.MEDIA_ROOT,
            "productos",
        )
        os.makedirs(folder, exist_ok=True)

        ext = os.path.splitext(archivo.name)[1].lower() or ".jpg"
        nombre = f"{uuid.uuid4().hex}{ext}"
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
    """Serializer para variantes de talla (stock + SKU dentro de cada color)"""
    
    class Meta:
        model = SizeVariant
        fields = "__all__"


class ColorVariantSerializer(serializers.ModelSerializer):
    """Serializer para variantes de color (color + imágenes + tallas)"""
    
    color = ColorSerializer(read_only=True)
    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(),
        source="color",
        write_only=True,
        required=False
    )
    
    imagenes = ImagenSerializer(
        many=True,
        read_only=True,
        required=False,
        source="imagenproducto_set"
    )
    
    size_variants = SizeVariantSerializer(
        many=True,
        read_only=True,
        required=False,
        source="sizevariant_set"
    )
    
    size_variants_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ColorVariant
        fields = "__all__"
    
    @transaction.atomic
    def create(self, validated_data):
        print("Datos recibidos en ColorVariantSerializer.create:", validated_data)
        size_variants_data = validated_data.pop('size_variants_data', [])
        print("Size variants recibidas:", size_variants_data)
        
        try:
            color_variant = ColorVariant.objects.create(**validated_data)
            print("ColorVariant creada:", color_variant)
            
            # Crear size variants (tallas con stock y SKU)
            for size_data in size_variants_data:
                size_data['color_variant'] = color_variant
                try:
                    size_variant = SizeVariant.objects.create(**size_data)
                    print("SizeVariant creada:", size_variant)
                except Exception as e:
                    print(f"Error creando size variant: {e}")
                    raise
            
            return color_variant
        except Exception as e:
            print("Error en ColorVariantSerializer.create:", e)
            raise


class ProductoSerializer(serializers.ModelSerializer):

    categoria = CategoriaSerializer(read_only=True)

    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source="categoria",
        write_only=True
    )

    color_variants = ColorVariantSerializer(
        many=True,
        read_only=True,
        source="colorvariant_set"
    )

    color_variants_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )

    oferta_activa = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = "__all__"

    @transaction.atomic
    def create(self, validated_data):
        print("Datos recibidos en ProductoSerializer.create:", validated_data)
        color_variants_data = validated_data.pop('color_variants_data', [])
        print("Color variants recibidas:", color_variants_data)

        try:
            producto = Producto.objects.create(**validated_data)
            print("Producto creado:", producto)

            # Crear color variants (cada una con sus tallas)
            for color_data in color_variants_data:
                color_data['producto'] = producto
                try:
                    color_variant = ColorVariant.objects.create(**color_data)
                    print("ColorVariant creada:", color_variant)
                except Exception as e:
                    print(f"Error creando color variant: {e}")
                    raise

            return producto
        except Exception as e:
            print("Error en ProductoSerializer.create:", e)
            raise

    def get_oferta_activa(self, obj):
        """Devuelve la oferta activa si existe"""
        hoy = date.today()
        try:
            oferta = Oferta.objects.filter(
                producto=obj,
                activa=True,
                fecha_inicio__lte=hoy,
                fecha_fin__gte=hoy
            ).first()

            if oferta:
                return OfertaSimpleSerializer(oferta).data
        except:
            pass
        return None
