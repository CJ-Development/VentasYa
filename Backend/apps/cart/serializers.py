from rest_framework import serializers

from .models import Carrito, ItemCarrito


class ItemCarritoSerializer(serializers.ModelSerializer):

    size_variant_id = serializers.IntegerField(source="size_variant.id_size_variant", read_only=True)

    sku = serializers.CharField(source="size_variant.sku", read_only=True)

    stock = serializers.IntegerField(source="size_variant.stock", read_only=True)

    producto_id = serializers.IntegerField(source="size_variant.color_variant.producto.id_producto", read_only=True)

    producto_nombre = serializers.CharField(source="size_variant.color_variant.producto.nombre", read_only=True)

    producto_slug = serializers.CharField(source="size_variant.color_variant.producto.slug", read_only=True)

    producto_precio = serializers.DecimalField(
        source="size_variant.precio",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    color = serializers.CharField(source="size_variant.color_variant.color.nombre", read_only=True)

    talla = serializers.CharField(source="size_variant.talla", read_only=True)

    imagen = serializers.SerializerMethodField()

    class Meta:

        model = ItemCarrito

        fields = [
            "id_item",
            "size_variant_id",
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

        principal = obj.size_variant.color_variant.imagenproducto_set.filter(principal=True).first()

        if principal:
            return principal.imagen

        primera = obj.size_variant.color_variant.imagenproducto_set.order_by("orden", "id_imagen").first()

        return primera.imagen if primera else None


class CarritoSerializer(serializers.ModelSerializer):

    items = ItemCarritoSerializer(
        many=True,
        read_only=True
    )

    class Meta:

        model = Carrito

        fields = "__all__"