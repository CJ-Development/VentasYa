from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models import Q


ROL_ADMIN = "administrador"
ROL_CLIENTE = "cliente"


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.nombre_rol


class UsuarioManager(BaseUserManager):

    use_in_migrations = True

    def _rol_por_nombre(self, nombre):
        rol = Rol.objects.filter(nombre_rol__iexact=nombre).first()

        if rol is None:
            rol = Rol.objects.create(nombre_rol=nombre)

        return rol

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio.")

        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        if "rol" not in extra_fields and "rol_id" not in extra_fields:
            extra_fields["rol"] = self._rol_por_nombre(ROL_CLIENTE)

        usuario = self.model(email=self.normalize_email(email), **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("nombres", "Admin")
        extra_fields.setdefault("apellidos", "VentasYa")
        extra_fields.setdefault("rol", self._rol_por_nombre(ROL_ADMIN))

        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
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

    fecha_nacimiento = models.DateField(
        blank=True,
        null=True
    )

    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        null=True,
        blank=True
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO,
        default="activo"
    )

    is_active = models.BooleanField(default=True)

    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "usuarios"
        indexes = [
            models.Index(fields=["estado"], name="idx_usuario_estado"),
        ]

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

    @property
    def es_administrador(self):
        return (
            self.is_superuser
            or self.is_staff
            or (self.rol_id is not None and self.rol.nombre_rol.lower() == ROL_ADMIN)
        )


class Direccion(models.Model):

    id_direccion = models.AutoField(primary_key=True)

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="direcciones"
    )

    nombre_destinatario = models.CharField(
        max_length=150,
        blank=True,
        default=""
    )

    direccion = models.CharField(max_length=255)

    ciudad = models.CharField(max_length=100)

    departamento = models.CharField(max_length=100)

    pais = models.CharField(max_length=100, default="Colombia")

    codigo_postal = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    predeterminada = models.BooleanField(default=False)

    class Meta:
        db_table = "direcciones"
        constraints = [
            # Como máximo una dirección predeterminada por usuario.
            models.UniqueConstraint(
                fields=["usuario"],
                condition=Q(predeterminada=True),
                name="uniq_direccion_predeterminada_por_usuario",
            ),
        ]

    def __str__(self):
        return self.direccion
