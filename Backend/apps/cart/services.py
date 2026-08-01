from .models import Carrito, ItemCarrito


class CarritoService:

    @staticmethod
    def obtener(usuario):

        carrito, created = Carrito.objects.get_or_create(
            usuario=usuario
        )

        return carrito

    @staticmethod
    def agregar(carrito, variante, cantidad):

        item, created = ItemCarrito.objects.get_or_create(
            carrito=carrito,
            variante=variante
        )

        if not created:
            item.cantidad += cantidad
        else:
            item.cantidad = cantidad

        item.save()

        return item

    @staticmethod
    def eliminar(id_item):

        ItemCarrito.objects.filter(
            id_item=id_item
        ).delete()

    @staticmethod
    def vaciar(carrito):

        carrito.items.all().delete()