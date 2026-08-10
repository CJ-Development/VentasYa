from rest_framework import serializers

from .models import Producto, Variante, ImagenProducto, Color, Talla

from apps.categories.serializers import CategoriaSerializer
from apps.categories.models import Categoria


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
        fields = "__all__"


class VarianteSerializer(serializers.ModelSerializer):

    imagenes = ImagenSerializer(
        many=True,
        read_only=True,
        source="imagenproducto_set"
    )

    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source="producto",
        write_only=True,
        required=False
    )

    class Meta:
        model = Variante
        fields = "__all__"


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

    class Meta:

        model = Producto

        fields = "__all__"