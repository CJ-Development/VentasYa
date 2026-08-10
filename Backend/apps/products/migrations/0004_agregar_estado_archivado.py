# Generated for VentasYa

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_delete_marca'),
    ]

    operations = [
        migrations.AlterField(
            model_name='producto',
            name='estado',
            field=models.CharField(
                choices=[
                    ('activo', 'Activo'),
                    ('inactivo', 'Inactivo'),
                    ('archivado', 'Archivado'),
                ],
                default='activo',
                max_length=20,
            ),
        ),
    ]
