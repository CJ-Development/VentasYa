from django.db import models


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.nombre_rol


class Usuario(models.Model):
    TIPO_DOCUMENTO = [
        ("CC", "CC"),
        ("CE", "CE"),
        ("PASAPORTE", "PASAPORTE"),
    ]

    ESTADO = [
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
    ]

    id_usuario = models.AutoField(primary_key=True)

    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column="id_rol",
        related_name="usuarios"
    )

    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)

    tipo_documento = models.CharField(
        max_length=20,
        choices=TIPO_DOCUMENTO,
        blank=True,
        null=True
    )

    numero_documento = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True
    )

    email = models.EmailField(
        max_length=150,
        unique=True
    )

    fecha_nacimiento = models.DateField()

    password_hash = models.CharField(
        max_length=255
    )

    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO,
        default="activo"
    )

    class Meta:
        db_table = "usuarios"

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"


class Direccion(models.Model):

    id_direccion = models.AutoField(primary_key=True)

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="direcciones"
    )

    direccion = models.CharField(max_length=255)

    ciudad = models.CharField(max_length=100)

    departamento = models.CharField(max_length=100)

    codigo_postal = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    predeterminada = models.BooleanField(default=False)

    class Meta:
        db_table = "direcciones"

    def __str__(self):
        return self.direccion