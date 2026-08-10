# Documento opcional en registro (tarea #3)
# Se relajan los campos tipo_documento y numero_documento a nullable/blank
# para que el registro público ya no los exija.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="usuario",
            name="tipo_documento",
            field=models.CharField(
                blank=True,
                choices=[("CC", "CC"), ("CE", "CE"), ("PASAPORTE", "PASAPORTE")],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="usuario",
            name="numero_documento",
            field=models.CharField(
                blank=True,
                max_length=20,
                null=True,
                unique=True,
            ),
        ),
    ]
