# Generated for VentasYa

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_agregar_estado_archivado'),
    ]

    operations = [
        migrations.AlterField(
            model_name='imagenproducto',
            name='imagen',
            field=models.URLField(max_length=500),
        ),
    ]
