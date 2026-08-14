from rest_framework import serializers

from .models import Oferta

from apps.products.models import Producto


class ProductoOfertaSerializer(serializers.ModelSerializer):
    """Serializer simplificado para evitar importación circular"""
    class Meta:
        model = Producto
        fields = ["id_producto", "nombre", "precio"]


class OfertaSerializer(serializers.ModelSerializer):

    producto = serializers.StringRelatedField(read_only=True)

    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source="producto",
        write_only=True,
    )

    producto_detalle = ProductoOfertaSerializer(source="producto", read_only=True)

    class Meta:
        model = Oferta
        fields = [
            "id_oferta",
            "nombre",
            "descripcion",
            "producto",
            "producto_id",
            "producto_detalle",
            "tipo_descuento",
            "valor",
            "fecha_inicio",
            "fecha_fin",
            "activa",
        ]
