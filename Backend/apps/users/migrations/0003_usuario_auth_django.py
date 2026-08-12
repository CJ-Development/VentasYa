"""
Convierte `Usuario` en el AUTH_USER_MODEL del proyecto.

El hash de contraseña ya estaba generado con `make_password`, así que
renombrar `password_hash` -> `password` conserva las credenciales
existentes sin necesidad de que los usuarios cambien su clave.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("users", "0002_documento_opcional"),
    ]

    operations = [
        migrations.AlterModelManagers(
            name="usuario",
            managers=[],
        ),
        migrations.RenameField(
            model_name="usuario",
            old_name="password_hash",
            new_name="password",
        ),
        migrations.AlterField(
            model_name="usuario",
            name="password",
            field=models.CharField(max_length=128, verbose_name="password"),
        ),
        migrations.AddField(
            model_name="usuario",
            name="last_login",
            field=models.DateTimeField(blank=True, null=True, verbose_name="last login"),
        ),
        migrations.AddField(
            model_name="usuario",
            name="is_superuser",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Designates that this user has all permissions without "
                    "explicitly assigning them."
                ),
                verbose_name="superuser status",
            ),
        ),
        migrations.AddField(
            model_name="usuario",
            name="is_staff",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="usuario",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="usuario",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, blank=True, null=True),
        ),
        migrations.AddField(
            model_name="usuario",
            name="groups",
            field=models.ManyToManyField(
                blank=True,
                help_text=(
                    "The groups this user belongs to. A user will get all "
                    "permissions granted to each of their groups."
                ),
                related_name="user_set",
                related_query_name="user",
                to="auth.group",
                verbose_name="groups",
            ),
        ),
        migrations.AddField(
            model_name="usuario",
            name="user_permissions",
            field=models.ManyToManyField(
                blank=True,
                help_text="Specific permissions for this user.",
                related_name="user_set",
                related_query_name="user",
                to="auth.permission",
                verbose_name="user permissions",
            ),
        ),
        migrations.AlterField(
            model_name="usuario",
            name="fecha_nacimiento",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="usuario",
            index=models.Index(fields=["estado"], name="idx_usuario_estado"),
        ),
        migrations.AddField(
            model_name="direccion",
            name="nombre_destinatario",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AddField(
            model_name="direccion",
            name="pais",
            field=models.CharField(default="Colombia", max_length=100),
        ),
        migrations.AlterField(
            model_name="direccion",
            name="usuario",
            field=models.ForeignKey(
                db_column="id_usuario",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="direcciones",
                to="users.usuario",
            ),
        ),
    ]
