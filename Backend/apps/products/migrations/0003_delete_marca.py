from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_remove_producto_marca'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Marca',
        ),
    ]