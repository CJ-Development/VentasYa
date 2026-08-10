from rest_framework import serializers

from .models import Carrito, ItemCarrito


class ItemCarritoSerializer(serializers.ModelSerializer):

    variante_id = serializers.IntegerField(source="variante.id_variante", read_only=True)

    sku = serializers.CharField(source="variante.sku", read_only=True)

    stock = serializers.IntegerField(source="variante.stock", read_only=True)

    producto_id = serializers.IntegerField(source="variante.producto.id_producto", read_only=True)

    producto_nombre = serializers.CharField(source="variante.producto.nombre", read_only=True)

    producto_slug = serializers.CharField(source="variante.producto.slug", read_only=True)

    producto_precio = serializers.DecimalField(
        source="variante.producto.precio",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    color = serializers.CharField(source="variante.color.nombre", read_only=True)

    talla = serializers.CharField(source="variante.talla.nombre", read_only=True)

    imagen = serializers.SerializerMethodField()

    class Meta:

        model = ItemCarrito

        fields = [
            "id_item",
            "variante_id",
            "sku",
            "stock",
            "producto_id",
            "producto_nombre",
            "producto_slug",
            "producto_precio",
            "color",
            "talla",
            "cantidad",
            "imagen",
        ]

    def get_imagen(self, obj):

        principal = obj.variante.imagenproducto_set.filter(principal=True).first()

        if principal:
            return principal.imagen

        primera = obj.variante.imagenproducto_set.order_by("orden", "id_imagen").first()

        return primera.imagen if primera else None


class CarritoSerializer(serializers.ModelSerializer):

    items = ItemCarritoSerializer(
        many=True,
        read_only=True
    )

    class Meta:

        model = Carrito

        fields = "__all__"