from django.db import models


class Carrito(models.Model):

    id_carrito = models.AutoField(primary_key=True)

    usuario = models.OneToOneField(
        "users.Usuario",
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="carrito"
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carritos"

    def __str__(self):
        return f"Carrito {self.id_carrito}"
        

class ItemCarrito(models.Model):

    id_item = models.AutoField(primary_key=True)

    carrito = models.ForeignKey(
        Carrito,
        on_delete=models.CASCADE,
        related_name="items",
        db_column="id_carrito"
    )

    size_variant = models.ForeignKey(
        "products.SizeVariant",
        on_delete=models.CASCADE,
        db_column="id_size_variant"
    )

    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "carrito_items"
        # constraints = [
        #     models.UniqueConstraint(
        #         fields=["carrito", "size_variant"],
        #         name="uniq_item_por_size_variant_en_carrito",
        #     ),
        #     models.CheckConstraint(
        #         condition=models.Q(cantidad__gt=0),
        #         name="chk_item_cantidad_positiva",
        #     ),
        # ]

    def __str__(self):
        return f"{self.size_variant} ({self.cantidad})"