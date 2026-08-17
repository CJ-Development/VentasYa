from django.db import models


class Categoria(models.Model):

    id_categoria = models.AutoField(primary_key=True)

    nombre = models.CharField(
        max_length=100,
        unique=True
    )

    descripcion = models.TextField(
        blank=True,
        default=""
    )

    estado = models.CharField(
        max_length=20,
        default="activo"
    )

    # Jerarquía: una subcategoría apunta a su categoría padre.
    # NULL = categoría principal.
    id_categoria_padre = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="subcategorias",
        on_delete=models.PROTECT,
        db_column="id_categoria_padre",
    )

    orden = models.PositiveIntegerField(
        default=1
    )

    class Meta:
        db_table = "categorias"
        ordering = ["orden", "nombre"]

    def __str__(self):
        return self.nombre

    def es_descendiente_de(self, otra):
        """
        Devuelve True si esta categoría es descendiente (directa o
        transitivamente) de `otra`. Se usa para evitar ciclos.
        """
        if not otra:
            return False

        actual = self.id_categoria_padre
        visitados = set()

        while actual is not None:
            if actual.id_categoria == otra.id_categoria:
                return True
            if actual.id_categoria in visitados:
                # Defensa ante datos corruptos: cortamos el ciclo.
                break
            visitados.add(actual.id_categoria)
            actual = actual.id_categoria_padre

        return False
