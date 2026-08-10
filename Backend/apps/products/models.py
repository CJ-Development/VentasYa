from django.db import models

# ==========================
# COLORES
# ==========================

class Color(models.Model):

    id_color = models.AutoField(primary_key=True)

    nombre = models.CharField(
        max_length=50,
        unique=True
    )

    codigo_hex = models.CharField(
        max_length=7
    )

    class Meta:
        db_table = "colores"

    def __str__(self):
        return self.nombre


# ==========================
# TALLAS
# ==========================

class Talla(models.Model):

    id_talla = models.AutoField(primary_key=True)

    nombre = models.CharField(
        max_length=20,
        unique=True
    )

    class Meta:
        db_table = "tallas"

    def __str__(self):
        return self.nombre


# ==========================
# PRODUCTOS
# ==========================

from apps.categories.models import Categoria


class Producto(models.Model):

    ESTADOS = [

        ("activo","Activo"),

        ("inactivo","Inactivo"),

        ("archivado","Archivado"),

    ]

    id_producto = models.AutoField(primary_key=True)

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        db_column="id_categoria"
    )

    nombre = models.CharField(max_length=150)

    slug = models.SlugField(
        unique=True
    )

    descripcion = models.TextField()

    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default="activo"
    )

    class Meta:
        db_table="productos"

    def __str__(self):
        return self.nombre


# ==========================
# VARIANTES
# ==========================

class Variante(models.Model):

    id_variante = models.AutoField(primary_key=True)

    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto"
    )

    color = models.ForeignKey(
        Color,
        on_delete=models.PROTECT,
        db_column="id_color"
    )

    talla = models.ForeignKey(
        Talla,
        on_delete=models.PROTECT,
        db_column="id_talla"
    )

    sku = models.CharField(
        max_length=50,
        unique=True
    )

    stock = models.PositiveIntegerField(default=0)

    class Meta:

        db_table="producto_variantes"

    def __str__(self):

        return self.sku


# ==========================
# IMAGENES
# ==========================

class ImagenProducto(models.Model):

    id_imagen = models.AutoField(primary_key=True)

    variante = models.ForeignKey(

        Variante,

        on_delete=models.CASCADE,

        db_column="id_variante"

    )

    imagen = models.URLField(

        max_length=500

    )

    orden = models.PositiveIntegerField(default=1)

    principal = models.BooleanField(default=False)

    class Meta:

        db_table="producto_imagenes"

    def __str__(self):

        return f"Imagen {self.id_imagen}"