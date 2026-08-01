from django.db import models


class Categoria(models.Model):

    id_categoria = models.AutoField(primary_key=True)

    nombre = models.CharField(
        max_length=100,
        unique=True
    )

    class Meta:
        db_table = "categorias"

    def __str__(self):
        return self.nombre