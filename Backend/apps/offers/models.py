from django.db import models

from apps.products.models import Producto


class Oferta(models.Model):

    TIPO_DESCUENTO = [
        ("porcentaje", "Porcentaje"),
        ("fijo", "Valor fijo"),
    ]

    id_oferta = models.AutoField(primary_key=True)

    nombre = models.CharField(max_length=150)

    descripcion = models.TextField(blank=True, default="")

    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="ofertas",
    )

    tipo_descuento = models.CharField(
        max_length=20,
        choices=TIPO_DESCUENTO,
        default="porcentaje",
    )

    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    fecha_inicio = models.DateField()

    fecha_fin = models.DateField()

    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "ofertas"

    def __str__(self):
        return self.nombre
