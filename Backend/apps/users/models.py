from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):

    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio.")

        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        usuario = self.model(email=self.normalize_email(email), **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("nombres", "Admin")
        extra_fields.setdefault("apellidos", "VentasYa")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):

    id_usuario = models.AutoField(primary_key=True)

    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)

    email = models.EmailField(
        max_length=150,
        unique=True,
        db_index=True
    )

    fecha_nacimiento = models.DateField()

    telefono = models.CharField(max_length=20)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nombres", "apellidos", "fecha_nacimiento", "telefono"]

    class Meta:
        db_table = "usuarios"

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

    @property
    def es_administrador(self):
        return self.is_superuser or self.is_staff


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
