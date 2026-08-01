from .models import Resena


class ResenaService:

    @staticmethod
    def listar_producto(id_producto):

        return Resena.objects.filter(
            producto_id=id_producto
        )

    @staticmethod
    def crear(data):

        return Resena.objects.create(
            **data
        )

    @staticmethod
    def eliminar(id_resena):

        Resena.objects.filter(
            id_resena=id_resena
        ).delete()