from rest_framework import serializers

from .models import Oferta

from apps.products.models import Producto
from apps.products.serializers import ProductoSerializer
from apps.categories.models import Categoria


class OfertaSerializer(serializers.ModelSerializer):

    producto = serializers.StringRelatedField(read_only=True)

    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source="producto",
        write_only=True,
    )

    producto_detalle = ProductoSerializer(source="producto", read_only=True)

    # Categorías: lista de PKs para escribir; lista de objetos
    # completos para leer. Permite que la oferta aplique a varias
    # categorías / subcategorías.
    categorias_ids = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source="categorias",
        many=True,
        required=False,
        write_only=True,
    )

    categorias_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Oferta
        fields = [
            "id_oferta",
            "nombre",
            "descripcion",
            "producto",
            "producto_id",
            "producto_detalle",
            "categorias_ids",
            "categorias_detalle",
            "tipo_descuento",
            "valor",
            "fecha_inicio",
            "fecha_fin",
            "activa",
        ]

    def get_categorias_detalle(self, obj):
        return [
            {
                "id_categoria": c.id_categoria,
                "nombre": c.nombre,
                "id_categoria_padre": (
                    c.id_categoria_padre.id_categoria
                    if c.id_categoria_padre
                    else None
                ),
            }
            for c in obj.categorias.all()
        ]
