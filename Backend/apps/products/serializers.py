from rest_framework import serializers

from .models import *

class MarcaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Marca
        fields = "__all__"


class ColorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Color
        fields = "__all__"


class TallaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Talla
        fields = "__all__"


class ImagenSerializer(serializers.ModelSerializer):

    class Meta:
        model = ImagenProducto
        fields="__all__"


class VarianteSerializer(serializers.ModelSerializer):

    imagenes = ImagenSerializer(
        many=True,
        read_only=True,
        source="imagenproducto_set"
    )

    class Meta:
        model=Variante
        fields="__all__"


class ProductoSerializer(serializers.ModelSerializer):

    variantes=VarianteSerializer(
        many=True,
        read_only=True,
        source="variante_set"
    )

    class Meta:

        model=Producto

        fields="__all__"