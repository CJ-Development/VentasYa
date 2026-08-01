from .models import Producto


class ProductoService:

    @staticmethod
    def listar():

        return Producto.objects.all()

    @staticmethod
    def obtener(id_producto):

        return Producto.objects.get(
            id_producto=id_producto
        )

    @staticmethod
    def crear(data):

        return Producto.objects.create(
            **data
        )

    @staticmethod
    def eliminar(id_producto):

        Producto.objects.get(
            id_producto=id_producto
        ).delete()