from django.db import models

from apps.categories.models import Categoria


class Color(models.Model):
    id_color = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    codigo_hex = models.CharField(max_length=7)

    class Meta:
        db_table = "colores"

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, db_column="id_categoria")
    nombre = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, default="activo")

    class Meta:
        db_table = "productos"

    def __str__(self):
        return self.nombre


class ColorVariant(models.Model):
    """Variante de color - contiene el color y las imágenes"""
    id_variante = models.AutoField(primary_key=True)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, db_column="id_producto")
    color = models.ForeignKey(Color, on_delete=models.PROTECT, db_column="id_color", null=True, blank=True)

    class Meta:
        db_table = "producto_colores"
        unique_together = ['producto', 'color']

    def __str__(self):
        return f"{self.producto.nombre} - {self.color.nombre if self.color else 'Sin color'}"


class SizeVariant(models.Model):
    """Variante de talla - contiene talla, stock y SKU dentro de cada ColorVariant"""
    id_size_variant = models.AutoField(primary_key=True)
    color_variant = models.ForeignKey(ColorVariant, on_delete=models.CASCADE, db_column="id_variante")
    talla = models.CharField(max_length=10, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, unique=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "producto_tallas"
        unique_together = ['color_variant', 'talla']

    def __str__(self):
        return f"{self.color_variant} - {self.talla or 'Sin talla'} - {self.sku}"


class ImagenProducto(models.Model):
    id_imagen = models.AutoField(primary_key=True)
    color_variant = models.ForeignKey(ColorVariant, on_delete=models.CASCADE, db_column="id_variante")
    imagen = models.URLField(max_length=500, blank=True)
    orden = models.PositiveIntegerField(default=1)
    principal = models.BooleanField(default=False)

    class Meta:
        db_table = "producto_imagenes"

    def __str__(self):
        return f"Imagen {self.id_imagen}"
