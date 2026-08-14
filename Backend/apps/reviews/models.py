from django.db import models


class Resena(models.Model):

    id_resena = models.AutoField(primary_key=True)

    usuario = models.ForeignKey(
        "users.Usuario",
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="resenas"
    )

    producto = models.ForeignKey(
        "products.Producto",
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="resenas"
    )

    calificacion = models.PositiveSmallIntegerField()

    comentario = models.TextField()

    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "resenas"
        unique_together = ("usuario", "producto")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(calificacion__gte=1) & models.Q(calificacion__lte=5),
                name="chk_resena_calificacion_1_5",
            ),
        ]

    def __str__(self):
        return f"{self.usuario} - {self.producto}"